import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString, sanitizeEmail, sanitizePositiveNumber, sanitizeInt } from "@/lib/sanitize";

// Luna Checkout event → internal status (source: docs.lunacheckout.com)
const LUNA_EVENT_MAP: Record<string, { status: string; paymentStatus: string } | null> = {
  // Approved / paid
  "sale_approved":              { status: "CONFIRMED", paymentStatus: "PAID" },
  "sale_cart_recovered":        { status: "CONFIRMED", paymentStatus: "PAID" },

  // Pending / waiting
  "sale_pending":               { status: "PENDING", paymentStatus: "PENDING" },
  "sale_waiting_payment":       { status: "PENDING", paymentStatus: "PENDING" },

  // Refused
  "sale_refused":               { status: "CANCELLED", paymentStatus: "FAILED" },

  // Refunded / chargeback
  "sale_refunded":              { status: "REFUNDED", paymentStatus: "REFUNDED" },
  "sale_chargeback":            { status: "REFUNDED", paymentStatus: "REFUNDED" },

  // Cancelled
  "sale_cancelled":             { status: "CANCELLED", paymentStatus: "FAILED" },

  // Processed (shipped)
  "sale_partially_processed":   { status: "PROCESSING", paymentStatus: "PAID" },
  "sale_processed":             { status: "SHIPPED", paymentStatus: "PAID" },

  // Tracking events — update tracking code, don't create duplicate orders
  "tracking_posted":            { status: "SHIPPED",    paymentStatus: "PAID" },
  "tracking_in_transit":        { status: "SHIPPED",    paymentStatus: "PAID" },
  "tracking_out_for_delivery":  { status: "SHIPPED",    paymentStatus: "PAID" },
  "tracking_delivered":         { status: "DELIVERED",  paymentStatus: "PAID" },
  "tracking_cancelled":         { status: "CANCELLED",  paymentStatus: "FAILED" },
  "tracking_returned":          { status: "REFUNDED",   paymentStatus: "REFUNDED" },

  // Abandoned cart — ignored (no order created)
  "sale_cart_abandoned": null,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Webhook/Luna] Received:", JSON.stringify(body).slice(0, 800));

    // Luna payload uses `event` field with snake_case English names
    const rawEvent: string = sanitizeString(body.event || body.type || "", 100);

    const mapped = LUNA_EVENT_MAP[rawEvent];
    if (mapped === undefined) {
      console.log(`[Webhook/Luna] Unknown event: "${rawEvent}"`);
      return NextResponse.json({ received: true, skipped: true, event: rawEvent });
    }
    if (mapped === null) {
      // Ignored event (e.g. cart abandoned)
      return NextResponse.json({ received: true, skipped: true, event: rawEvent });
    }

    // Luna payload structure (from docs.lunacheckout.com)
    const orderNumber   = sanitizeString(String(body.id || `LUNA-${Date.now()}`));
    const customerEmail = sanitizeEmail(body.client?.email || "");
    const customerName  = sanitizeString(body.client?.name || "", 200);

    const shippingAddress = {
      name:       customerName,
      street:     sanitizeString(body.address?.street       || ""),
      number:     sanitizeString(body.address?.number       || ""),
      complement: sanitizeString(body.address?.complement   || ""),
      district:   sanitizeString(body.address?.neighborhood || ""),
      city:       sanitizeString(body.address?.city         || ""),
      state:      sanitizeString(body.address?.state        || ""),
      zipCode:    sanitizeString(body.address?.zipcode      || ""),
    };

    const total    = sanitizePositiveNumber(body.amount || 0);
    const shipping = sanitizePositiveNumber(body.tracking?.fee || 0);
    const subtotal = Math.max(0, total - shipping);

    const orderStatus   = mapped.status;
    const paymentStatus = mapped.paymentStatus;

    // For tracking events: update existing order instead of creating
    const isTrackingEvent = rawEvent.startsWith("tracking_");
    const existing = await prisma.order.findFirst({ where: { orderNumber } });

    if (existing) {
      if (isTrackingEvent || rawEvent === "sale_processed" || rawEvent === "sale_partially_processed") {
        // Update status and tracking code
        const trackingCode = body.packages?.[0]?.tracking_code || body.tracking?.tracking_code || null;
        await prisma.order.update({
          where: { id: existing.id },
          data: {
            status: orderStatus as never,
            ...(trackingCode ? { trackingCode: sanitizeString(trackingCode) } : {}),
          },
        });
        await prisma.orderStatusHistory.create({
          data: { orderId: existing.id, status: orderStatus as never, note: `Atualização via Luna (${rawEvent})` },
        });
        return NextResponse.json({ received: true, updated: true, orderNumber });
      }
      return NextResponse.json({ received: true, duplicate: true, orderNumber });
    }

    // Link to existing customer by email
    let userId: string | null = null;
    if (customerEmail) {
      const user = await prisma.user.findUnique({ where: { email: customerEmail }, select: { id: true } });
      userId = user?.id ?? null;
    }

    // items[].variant = "Cor Azul / Tamanho M" — parse into color + size
    const rawItems: unknown[] = Array.isArray(body.items) ? body.items : [];
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        email: customerEmail,
        status: orderStatus as never,
        paymentStatus: paymentStatus as never,
        total,
        subtotal,
        shipping,
        shippingAddress,
        paymentMethod: sanitizeString(body.method || "luna_checkout", 50),
        items: {
          create: rawItems.map((item) => {
            const i = item as Record<string, unknown>;
            // Parse variant string "Cor Azul / Tamanho M" into color + size
            const variantStr = sanitizeString(i.variant || i.description || "", 200);
            const parts = variantStr.split("/").map((s: string) => s.trim());
            const color = parts[0] || "";
            const size  = parts[1] || parts[0] || "";
            return {
              name:     sanitizeString(i.name || "Produto", 300),
              image:    "",
              size,
              color,
              quantity: sanitizeInt(i.quantity || 1, 1),
              price:    sanitizePositiveNumber(i.price || 0),
            };
          }),
        },
        statusHistory: {
          create: {
            status: orderStatus as never,
            note: `Pedido recebido via Luna Checkout (${rawEvent})`,
          },
        },
      },
    });

    console.log(`[Webhook/Luna] Order created: ${order.orderNumber} (${rawEvent})`);
    return NextResponse.json({ received: true, orderId: order.id, orderNumber: order.orderNumber });

  } catch (err) {
    console.error("[Webhook/Luna] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET — used by Luna to verify the webhook URL is reachable
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "luna-checkout" });
}
