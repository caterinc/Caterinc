import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("s");
  const ok = (cronSecret && authHeader === `Bearer ${cronSecret}`) || (cronSecret && querySecret === cronSecret);
  if (!ok)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderNumber = req.nextUrl.searchParams.get("order");

  const order = await prisma.order.findFirst({
    where: orderNumber
      ? { orderNumber }
      : { paymentStatus: "PAID", paymentMethod: "pix" },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  const addr = order.shippingAddress as Record<string, string> | null;
  const utms = (order as unknown as { utmData: Record<string, string> | null }).utmData;
  const nameParts = (addr?.name || "Cliente").split(" ");
  const fbc = utms?.fbc || null;
  const fbp = utms?.fbp || null;

  await sendMetaEvent({
    eventName: "Purchase",
    eventId: `${order.orderNumber}-purchase-resend`,
    email: order.email,
    phone: addr?.phone || null,
    firstName: nameParts[0] || null,
    lastName: nameParts.slice(1).join(" ") || null,
    value: Number(order.total),
    currency: "BRL",
    contents: order.items.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
    orderId: order.orderNumber,
    fbc,
    fbp,
  });

  return NextResponse.json({
    sent: true,
    orderNumber: order.orderNumber,
    total: Number(order.total),
    fbc,
    fbp,
  });
}
