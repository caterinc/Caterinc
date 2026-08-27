import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent, type PixelSource } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

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
  const externalId = utms?.externalId || null;
  const pixelSource = (utms?.pixelSource as PixelSource | undefined) || null;

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
    orderId: order.orderNumber, fbc, fbp, externalId, pixelSource,
  }).catch((e) => console.error("[Meta CAPI] webhook error:", e));
}

export async function POST(req: NextRequest) {
  let rawBody = "";
  try { rawBody = await req.text(); }
  catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const log = async (paymentId: string, action: string, result: string) => {
    try {
      await prisma.webhookLog.create({ data: { source: "flevopay", paymentId, action, mpStatus: action, result } });
    } catch { /* não bloqueia */ }
  };

  // FlevoPay webhook: { transaction_id, external_id: orderNumber, status: "approved"|"pending"|"failed"|..., ... }
  const flevopayId     = String(body.transaction_id ?? "");
  const flevopayStatus = ((body.status as string) || "").toUpperCase();

  console.log("[Webhook/FlevoPay] id:", flevopayId, "| status:", flevopayStatus);
  await log(flevopayId, flevopayStatus, "received");

  if (flevopayStatus !== "APPROVED") {
    await log(flevopayId, flevopayStatus, `ignorado: status=${flevopayStatus}`);
    return NextResponse.json({ received: true, status: flevopayStatus });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { mpPaymentId: flevopayId },
          { orderNumber: (body.external_id as string) || "__none__" },
        ],
      },
      include: { items: true },
    });

    if (!order) {
      await log(flevopayId, flevopayStatus, "pedido não encontrado");
      return NextResponse.json({ received: true, notFound: true });
    }

    if (order.paymentStatus === "PAID") {
      await log(flevopayId, flevopayStatus, `já estava PAID: ${order.orderNumber}`);
      return NextResponse.json({ received: true, alreadyPaid: true });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "CONFIRMED", note: `PIX aprovado via webhook FlevoPay (${flevopayId})` },
    });

    await log(flevopayId, flevopayStatus, `confirmado: ${order.orderNumber} R$${order.total}`);
    await firePostPaymentEvents(order);
    console.log("[Webhook/FlevoPay] confirmado:", order.orderNumber);
    return NextResponse.json({ received: true, confirmed: order.orderNumber });

  } catch (err) {
    await log(flevopayId, flevopayStatus, `exceção: ${String(err)}`).catch(() => {});
    console.error("[Webhook/FlevoPay] Erro:", err);
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "flevopay" });
}
