import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { sendUtmifyEvent } from "@/lib/utmify";

export const dynamic = "force-dynamic";

// ─── MP event → order status ──────────────────────────────────────────────────
const STATUS_MAP: Record<string, { status: string; paymentStatus: string }> = {
  approved:        { status: "CONFIRMED",  paymentStatus: "PAID" },
  authorized:      { status: "CONFIRMED",  paymentStatus: "PAID" },
  in_process:      { status: "PENDING",    paymentStatus: "PENDING" },
  pending:         { status: "PENDING",    paymentStatus: "PENDING" },
  rejected:        { status: "CANCELLED",  paymentStatus: "FAILED" },
  cancelled:       { status: "CANCELLED",  paymentStatus: "FAILED" },
  refunded:        { status: "REFUNDED",   paymentStatus: "REFUNDED" },
  charged_back:    { status: "REFUNDED",   paymentStatus: "REFUNDED" },
};

// ─── Verify MP signature (prevents fake webhook calls) ────────────────────────
// Note: async version not possible here since it's called inline — secret is passed as param
function verifyMpSignature(req: NextRequest, rawBody: string, secret: string): boolean {
  if (!secret) return true; // skip if not configured (development)

  const xSignature  = req.headers.get("x-signature") || "";
  const xRequestId  = req.headers.get("x-request-id") || "";
  const dataId      = req.nextUrl.searchParams.get("data.id") || "";

  const tsMatch = xSignature.match(/ts=(\d+)/);
  const v1Match = xSignature.match(/v1=([a-f0-9]+)/);
  if (!tsMatch || !v1Match) return false;

  const ts = tsMatch[1];
  const v1 = v1Match[1];

  const message = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = createHmac("sha256", secret).update(message).digest("hex");

  return hmac === v1;
}

export async function POST(req: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const webhookSecret = process.env.MP_WEBHOOK_SECRET || "";

  // Verify signature
  if (!verifyMpSignature(req, rawBody, webhookSecret)) {
    console.warn("[Webhook/MP] Assinatura inválida");
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // MP sends: { action: "payment.updated", data: { id: "123" } }
  const action    = String(body.action || body.type || "");
  const paymentId = String(
    (body.data as Record<string, unknown>)?.id || body.id || ""
  );

  if (!action.startsWith("payment") || !paymentId) {
    return NextResponse.json({ received: true, skipped: true });
  }

  // Fetch full payment from MP API
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error("MP not configured");

    const { default: MercadoPago, Payment } = await import("mercadopago");
    const client  = new MercadoPago({ accessToken });
    const payment = new Payment(client);
    const mpData  = await payment.get({ id: Number(paymentId) });

    const mpRaw        = mpData as unknown as Record<string, unknown>;
    const mpStatus     = String(mpRaw.status || "pending");
    const externalRef  = String(mpRaw.external_reference || "");

    const mapped = STATUS_MAP[mpStatus];
    if (!mapped || !externalRef) {
      return NextResponse.json({ received: true, skipped: true });
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: externalRef }, { mpPaymentId: paymentId }] },
    });

    if (!order) {
      console.warn(`[Webhook/MP] Order not found for ref=${externalRef}`);
      return NextResponse.json({ received: true, notFound: true });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpPaymentId: paymentId,
        status:        mapped.status as never,
        paymentStatus: mapped.paymentStatus as never,
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: mapped.status as never,
        note: `Mercado Pago: ${mpStatus} (payment ${paymentId})`,
      },
    });

    console.log(`[Webhook/MP] Order ${order.orderNumber} → ${mapped.status}`);

    // UTMify tracking — fire-and-forget
    const utmStatus = mapped.paymentStatus === "PAID" ? "paid" as const
      : mapped.paymentStatus === "REFUNDED" ? "refunded" as const
      : mapped.status === "CANCELLED" ? "cancelled" as const
      : "waiting_payment" as const;
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    if (fullOrder) {
      const addr = fullOrder.shippingAddress as Record<string, string> | null;
      const customerName = addr?.name || "Cliente";
      const utms = (fullOrder as unknown as { utmData: Record<string, string> | null }).utmData;
      sendUtmifyEvent(
        fullOrder.orderNumber,
        utmStatus,
        { name: customerName, email: fullOrder.email },
        fullOrder.items.map((i) => ({
          id: i.productId || "item",
          name: i.name,
          quantity: i.quantity,
          priceInCents: Math.round(Number(i.price) * 100),
        })),
        Math.round(Number(fullOrder.total) * 100),
        fullOrder.createdAt,
        utms
      ).catch((e) => console.error("[UTMify] MP event error:", e));
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("[Webhook/MP] Error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// MP pings GET to verify the URL is reachable
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "mercadopago" });
}
