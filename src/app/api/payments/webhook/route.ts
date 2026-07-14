import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

async function confirmOrder(orderId: string, orderNumber: string, gatewayId: string, source: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID", status: "CONFIRMED" },
  });
  await prisma.orderStatusHistory.create({
    data: { orderId, status: "CONFIRMED", note: `PIX aprovado via webhook ${source} (${gatewayId})` },
  });
}

async function firePostPaymentEvents(order: {
  id: string; orderNumber: string; email: string; total: unknown;
  shippingAddress: unknown; paymentMethod: string | null;
  items: { productId: string | null; name: string; quantity: number; price: unknown }[];
  utmData?: unknown; createdAt: Date;
}) {
  const addr  = order.shippingAddress as Record<string, string> | null;
  const utms  = (order as unknown as { utmData: Record<string, string> | null }).utmData;
  const nameParts = (addr?.name || "Cliente").split(" ");
  const fbc   = utms?.fbc || null;
  const fbp   = utms?.fbp || null;

  sendUtmifyEvent(
    order.orderNumber, "paid",
    { name: addr?.name || "Cliente", email: order.email, phone: addr?.phone },
    order.items.map((i) => ({ id: i.productId || "item", name: i.name, quantity: i.quantity, priceInCents: Math.round(Number(i.price) * 100) })),
    Math.round(Number(order.total) * 100),
    order.createdAt, utms, order.paymentMethod || "pix"
  ).catch((e) => console.error("[UTMify] webhook paid error:", e));

  sendMetaEvent({
    eventName: "Purchase", eventId: `${order.orderNumber}-purchase`,
    email: order.email, phone: addr?.phone || null,
    firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
    value: Number(order.total), currency: "BRL",
    contents: order.items.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
    orderId: order.orderNumber, fbc, fbp,
  }).catch((e) => console.error("[Meta CAPI] webhook error:", e));
}

export async function POST(req: NextRequest) {
  let rawBody = "";
  try { rawBody = await req.text(); }
  catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const log = async (source: string, paymentId: string, action: string, result: string) => {
    try {
      await prisma.webhookLog.create({ data: { source, paymentId, action, mpStatus: action, result } });
    } catch { /* não bloqueia */ }
  };

  // ── Vezion webhook ──────────────────────────────────────────────────────────
  // Body: { id: UUID, external_id: orderNumber, status: "AUTHORIZED"|"PENDING"|..., ... }
  const vezionId     = (body.id as string) || "";
  const vezionStatus = ((body.status as string) || "").toUpperCase();
  const isVezionUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vezionId);

  if (isVezionUUID && vezionStatus) {
    console.log("[Webhook/Vezion] id:", vezionId, "| status:", vezionStatus);
    await log("vezion", vezionId, vezionStatus, "received");

    if (vezionStatus !== "AUTHORIZED") {
      await log("vezion", vezionId, vezionStatus, `ignorado: status=${vezionStatus}`);
      return NextResponse.json({ received: true, status: vezionStatus });
    }

    try {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { mpPaymentId: vezionId },
            { orderNumber: (body.external_id as string) || "__none__" },
          ],
        },
        include: { items: true },
      });

      if (!order) {
        await log("vezion", vezionId, vezionStatus, "pedido não encontrado");
        return NextResponse.json({ received: true, notFound: true });
      }

      if (order.paymentStatus === "PAID") {
        await log("vezion", vezionId, vezionStatus, `já estava PAID: ${order.orderNumber}`);
        return NextResponse.json({ received: true, alreadyPaid: true });
      }

      await confirmOrder(order.id, order.orderNumber, vezionId, "Vezion");
      await log("vezion", vezionId, vezionStatus, `confirmado: ${order.orderNumber} R$${order.total}`);
      await firePostPaymentEvents(order);
      console.log("[Webhook/Vezion] confirmado:", order.orderNumber);
      return NextResponse.json({ received: true, confirmed: order.orderNumber });

    } catch (err) {
      await log("vezion", vezionId, vezionStatus, `exceção: ${String(err)}`).catch(() => {});
      console.error("[Webhook/Vezion] Erro:", err);
      return NextResponse.json({ received: true });
    }
  }

  // ── GoatPay webhook ─────────────────────────────────────────────────────────
  // Body: { transaction_hash: string, status: "paid"|..., ... }
  interface GoatpayWebhook { transaction_hash?: string; status?: string; }
  const gBody  = body as GoatpayWebhook;
  const hash   = gBody.transaction_hash || "";
  const gStatus = (gBody.status || "").toLowerCase();

  console.log("[Webhook/Goatpay] hash:", hash, "| status:", gStatus);

  if (!hash) {
    return NextResponse.json({ received: true, skipped: true });
  }

  await log("goatpay", hash, gStatus, "received");

  if (gStatus !== "paid") {
    await log("goatpay", hash, gStatus, `ignorado: status=${gStatus}`);
    return NextResponse.json({ received: true, status: gStatus });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { mpPaymentId: hash },
      include: { items: true },
    });

    if (!order) {
      await log("goatpay", hash, gStatus, "pedido não encontrado");
      return NextResponse.json({ received: true, notFound: true });
    }

    if (order.paymentStatus === "PAID") {
      await log("goatpay", hash, gStatus, `já estava PAID: ${order.orderNumber}`);
      return NextResponse.json({ received: true, alreadyPaid: true });
    }

    await confirmOrder(order.id, order.orderNumber, hash, "GoatPay");
    await log("goatpay", hash, gStatus, `confirmado: ${order.orderNumber} R$${order.total}`);
    await firePostPaymentEvents(order);
    return NextResponse.json({ received: true, confirmed: order.orderNumber });

  } catch (err) {
    await log("goatpay", hash, gStatus, `exceção: ${String(err)}`).catch(() => {});
    console.error("[Webhook/Goatpay] Erro:", err);
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "vezion+goatpay" });
}
