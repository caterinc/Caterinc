import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Allow Vercel cron calls (x-vercel-cron header) or CRON_SECRET if set
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "MP not configured" }, { status: 500 });

  // Find all PENDING PIX orders with an mpPaymentId (created in last 3 days)
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const pendingOrders = await prisma.order.findMany({
    where: {
      paymentStatus: "PENDING",
      paymentMethod: "pix",
      mpPaymentId: { not: null },
      createdAt: { gte: since },
    },
    include: { items: true },
  });

  let confirmed = 0;

  for (const order of pendingOrders) {
    try {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${order.mpPaymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) continue;

      const mp = await res.json() as { status: string };
      if (mp.status !== "approved") continue;

      // Mark as PAID
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });
      await prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: "CONFIRMED", note: "PIX aprovado — detectado via cron" },
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
        order.createdAt, utms, "pix"
      ).catch((e) => console.error("[Cron/UTMify]", e));

      // Meta CAPI Purchase
      sendMetaEvent({
        eventName: "Purchase", eventId: `${order.orderNumber}-purchase`,
        sourceUrl: "https://lojalegado.com/pedido-confirmado/" + order.orderNumber,
        email: order.email, phone: addr?.phone || null,
        firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
        value: Number(order.total), currency: "BRL",
        contents: order.items.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
        orderId: order.orderNumber,
      }).catch((e) => console.error("[Cron/Meta]", e));

      confirmed++;
      console.log(`[Cron] ${order.orderNumber} → PAID (R$${order.total})`);
    } catch (e) {
      console.error(`[Cron] erro ao checar ${order.orderNumber}:`, e);
    }
  }

  return NextResponse.json({ checked: pendingOrders.length, confirmed });
}
