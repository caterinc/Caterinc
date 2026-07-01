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

  const action = String(body.action || body.type || "");
  const paymentId = String(
    (body.data as Record<string, unknown>)?.id || body.id || ""
  );

  if (!action.startsWith("payment") || !paymentId) {
    return NextResponse.json({ received: true, skipped: true });
  }

  console.log(`[Webhook/MP] Recebido: action=${action} paymentId=${paymentId}`);

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[Webhook/MP] MP_ACCESS_TOKEN não configurado");
    return NextResponse.json({ received: true });
  }

  try {
    // Busca status do pagamento diretamente via fetch (mais confiável que SDK em serverless)
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpRes.ok) {
      console.warn(`[Webhook/MP] MP API retornou ${mpRes.status} para payment ${paymentId}`);
      return NextResponse.json({ received: true });
    }

    const mpData = await mpRes.json() as { status: string; external_reference: string };
    const mpStatus = mpData.status;

    console.log(`[Webhook/MP] Payment ${paymentId} status: ${mpStatus}`);

    if (mpStatus !== "approved") {
      return NextResponse.json({ received: true, status: mpStatus });
    }

    // Busca pedido pelo mpPaymentId
    const order = await prisma.order.findFirst({
      where: { mpPaymentId: paymentId },
      include: { items: true },
    });

    if (!order) {
      console.warn(`[Webhook/MP] Pedido não encontrado para paymentId=${paymentId}`);
      return NextResponse.json({ received: true, notFound: true });
    }

    // Já estava pago — retorna sem duplicar notificações
    if (order.paymentStatus === "PAID") {
      console.log(`[Webhook/MP] Pedido ${order.orderNumber} já estava PAID, ignorando`);
      return NextResponse.json({ received: true, alreadyPaid: true });
    }

    // Atualiza para PAID
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "CONFIRMED", note: `PIX aprovado via webhook (payment ${paymentId})` },
    });

    console.log(`[Webhook/MP] Pedido ${order.orderNumber} → PAID (R$${order.total})`);

    const addr = order.shippingAddress as Record<string, string> | null;
    const utms = (order as unknown as { utmData: Record<string, string> | null }).utmData;
    const nameParts = (addr?.name || "Cliente").split(" ");

    // UTMify paid
    sendUtmifyEvent(
      order.orderNumber, "paid",
      { name: addr?.name || "Cliente", email: order.email, phone: addr?.phone },
      order.items.map((i) => ({ id: i.productId || "item", name: i.name, quantity: i.quantity, priceInCents: Math.round(Number(i.price) * 100) })),
      Math.round(Number(order.total) * 100),
      order.createdAt, utms, order.paymentMethod || "pix"
    ).catch((e) => console.error("[UTMify] webhook paid error:", e));

    // Meta CAPI Purchase
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
    console.error("[Webhook/MP] Erro:", err);
    return NextResponse.json({ received: true });
  }
}

// MP faz GET para verificar que a URL está acessível
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "mercadopago" });
}
