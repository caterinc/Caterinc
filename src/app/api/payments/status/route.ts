import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ paid: false });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return NextResponse.json({ paid: false });

  // Already confirmed in DB
  if (order.paymentStatus === "PAID") return NextResponse.json({ paid: true, orderNumber: order.orderNumber });

  // Check MP API directly
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken || !order.mpPaymentId) return NextResponse.json({ paid: false });

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${order.mpPaymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return NextResponse.json({ paid: false });

    const mp = await res.json() as { status: string };

    if (mp.status === "approved") {
      // Update DB
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });
      await prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: "CONFIRMED", note: "PIX aprovado — detectado via polling" },
      });

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
      ).catch((e) => console.error("[UTMify] status paid error:", e));

      // Meta CAPI Purchase
      sendMetaEvent({
        eventName: "Purchase", eventId: `${order.orderNumber}-purchase`,
        sourceUrl: "https://loja-caterpillar.com/pedido-confirmado/" + order.orderNumber,
        email: order.email, phone: addr?.phone || null,
        firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
        value: Number(order.total), currency: "BRL",
        contents: order.items.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
        orderId: order.orderNumber,
      }).catch((e) => console.error("[Meta CAPI] status purchase error:", e));

      return NextResponse.json({ paid: true, orderNumber: order.orderNumber });
    }
  } catch (e) {
    console.error("[Status] MP check error:", e);
  }

  return NextResponse.json({ paid: false });
}
