import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Suporta formato novo (action + data.id) e formato antigo IPN (topic + id)
  const action = String(body.action || body.type || body.topic || "");
  const paymentId = String(
    (body.data as Record<string, unknown>)?.id || body.id || ""
  );

  console.log("[Webhook/MP] Body recebido:", JSON.stringify(body));
  console.log("[Webhook/MP] action:", action, "| paymentId:", paymentId);

  const isPaymentEvent = action.startsWith("payment") || action === "payment";
  if (!isPaymentEvent || !paymentId) {
    console.log("[Webhook/MP] Skipped — action:", action, "| paymentId:", paymentId);
    return NextResponse.json({ received: true, skipped: true });
  }

  const log = async (mpStatus: string | null, result: string) => {
    try {
      await prisma.webhookLog.create({ data: { source: "mercadopago", paymentId, action, mpStatus, result } });
    } catch { /* não bloqueia o fluxo */ }
  };

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    await log(null, "erro: MP_ACCESS_TOKEN não configurado");
    return NextResponse.json({ received: true });
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpRes.ok) {
      await log(null, `erro: MP API ${mpRes.status}`);
      return NextResponse.json({ received: true });
    }

    const mpData = await mpRes.json() as { status: string; external_reference: string };
    const mpStatus = mpData.status;

    console.log("[Webhook/MP] Status do MP:", mpStatus, "| external_reference:", mpData.external_reference);

    if (mpStatus !== "approved") {
      console.log("[Webhook/MP] Ignorado — status não é approved:", mpStatus);
      await log(mpStatus, `ignorado: status=${mpStatus}`);
      return NextResponse.json({ received: true, status: mpStatus });
    }

    const order = await prisma.order.findFirst({
      where: { mpPaymentId: paymentId },
      include: { items: true },
    });

    console.log("[Webhook/MP] Pedido encontrado pelo mpPaymentId:", order ? order.orderNumber : "NÃO ENCONTRADO");

    if (!order) {
      await log(mpStatus, `pedido não encontrado para paymentId=${paymentId}`);
      return NextResponse.json({ received: true, notFound: true });
    }

    if (order.paymentStatus === "PAID") {
      await log(mpStatus, `já estava PAID: ${order.orderNumber}`);
      return NextResponse.json({ received: true, alreadyPaid: true });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "CONFIRMED", note: `PIX aprovado via webhook (payment ${paymentId})` },
    });

    await log(mpStatus, `confirmado: ${order.orderNumber} R$${order.total}`);

    const addr = order.shippingAddress as Record<string, string> | null;
    const utms = (order as unknown as { utmData: Record<string, string> | null }).utmData;
    const nameParts = (addr?.name || "Cliente").split(" ");

    sendUtmifyEvent(
      order.orderNumber, "paid",
      { name: addr?.name || "Cliente", email: order.email, phone: addr?.phone },
      order.items.map((i) => ({ id: i.productId || "item", name: i.name, quantity: i.quantity, priceInCents: Math.round(Number(i.price) * 100) })),
      Math.round(Number(order.total) * 100),
      order.createdAt, utms, order.paymentMethod || "pix"
    ).catch((e) => console.error("[UTMify] webhook paid error:", e));

    sendMetaEvent({
      eventName: "Purchase", eventId: `${order.orderNumber}-purchase`,
      sourceUrl: "https://loja-caterpillar.com/pedido-confirmado/" + order.orderNumber,
      email: order.email, phone: addr?.phone || null,
      firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
      value: Number(order.total), currency: "BRL",
      contents: order.items.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
      orderId: order.orderNumber,
    }).catch((e) => console.error("[Meta CAPI] webhook error:", e));

    return NextResponse.json({ received: true, confirmed: order.orderNumber });

  } catch (err) {
    await log(null, `exceção: ${String(err)}`).catch(() => {});
    console.error("[Webhook/MP] Erro:", err);
    return NextResponse.json({ received: true });
  }
}

// MP faz GET para verificar que a URL está acessível
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "mercadopago" });
}
