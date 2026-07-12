import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

// Slimmpay webhook body: { Id, Status, PaymentMethod, Amount, PaidAt, ExternalId }
interface SlimmpayWebhookBody {
  Id?: string;
  Status?: string;
  PaymentMethod?: string;
  Amount?: number;
  PaidAt?: string;
  ExternalId?: string;
}

export async function POST(req: NextRequest) {
  let rawBody = "";
  try { rawBody = await req.text(); }
  catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  let body: SlimmpayWebhookBody;
  try { body = JSON.parse(rawBody) as SlimmpayWebhookBody; }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const slimmpayId = body.Id || "";
  const status     = (body.Status || "").toUpperCase();

  console.log("[Webhook/Slimmpay] Body recebido:", JSON.stringify(body));
  console.log("[Webhook/Slimmpay] Id:", slimmpayId, "| Status:", status);

  if (!slimmpayId) {
    console.log("[Webhook/Slimmpay] Skipped — sem Id");
    return NextResponse.json({ received: true, skipped: true });
  }

  const log = async (result: string) => {
    try {
      await prisma.webhookLog.create({ data: { source: "slimmpay", paymentId: slimmpayId, action: status, mpStatus: status, result } });
    } catch { /* não bloqueia o fluxo */ }
  };

  if (status !== "PAID") {
    console.log("[Webhook/Slimmpay] Ignorado — status:", status);
    await log(`ignorado: status=${status}`);
    return NextResponse.json({ received: true, status });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { mpPaymentId: slimmpayId },
      include: { items: true },
    });

    console.log("[Webhook/Slimmpay] Pedido encontrado:", order ? order.orderNumber : "NÃO ENCONTRADO");

    if (!order) {
      await log(`pedido não encontrado para slimmpayId=${slimmpayId}`);
      return NextResponse.json({ received: true, notFound: true });
    }

    if (order.paymentStatus === "PAID") {
      await log(`já estava PAID: ${order.orderNumber}`);
      return NextResponse.json({ received: true, alreadyPaid: true });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "CONFIRMED", note: `PIX aprovado via webhook Slimmpay (${slimmpayId})` },
    });

    await log(`confirmado: ${order.orderNumber} R$${order.total}`);

    const addr = order.shippingAddress as Record<string, string> | null;
    const utms = (order as unknown as { utmData: Record<string, string> | null }).utmData;
    const nameParts = (addr?.name || "Cliente").split(" ");
    const fbc = utms?.fbc || null;
    const fbp = utms?.fbp || null;

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

    return NextResponse.json({ received: true, confirmed: order.orderNumber });

  } catch (err) {
    await log(`exceção: ${String(err)}`).catch(() => {});
    console.error("[Webhook/Slimmpay] Erro:", err);
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "slimmpay" });
}
