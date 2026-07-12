import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";
import { slimmpayGetTransaction } from "@/lib/slimmpay";

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

  // Check Slimmpay API directly
  try {
    if (!order.mpPaymentId) return NextResponse.json({ paid: false });

    const status = await slimmpayGetTransaction(order.mpPaymentId);
    if (!status || status !== "PAID") return NextResponse.json({ paid: false });

    // Update DB
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "CONFIRMED", note: "PIX aprovado — detectado via polling (Slimmpay)" },
    });

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
    ).catch((e) => console.error("[UTMify] status paid error:", e));

    sendMetaEvent({
      eventName: "Purchase", eventId: `${order.orderNumber}-purchase`,
      email: order.email, phone: addr?.phone || null,
      firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
      value: Number(order.total), currency: "BRL",
      contents: order.items.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
      orderId: order.orderNumber, fbc, fbp,
    }).catch((e) => console.error("[Meta CAPI] status purchase error:", e));

    return NextResponse.json({ paid: true, orderNumber: order.orderNumber });

  } catch (e) {
    console.error("[Status] Slimmpay check error:", e);
  }

  return NextResponse.json({ paid: false });
}
