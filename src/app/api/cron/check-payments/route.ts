import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";
import { slimmpayGetTransaction } from "@/lib/slimmpay";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isCronSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !isCronSecret) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all PENDING PIX orders with a Slimmpay ID (created in last 3 days)
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
      const status = await slimmpayGetTransaction(order.mpPaymentId!);
      if (!status || status !== "PAID") continue;

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });
      await prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: "CONFIRMED", note: "PIX aprovado — detectado via cron (Slimmpay)" },
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
        order.createdAt, utms, "pix"
      ).catch((e) => console.error("[Cron/UTMify]", e));

      sendMetaEvent({
        eventName: "Purchase", eventId: `${order.orderNumber}-purchase`,
        email: order.email, phone: addr?.phone || null,
        firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
        value: Number(order.total), currency: "BRL",
        contents: order.items.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
        orderId: order.orderNumber, fbc, fbp,
      }).catch((e) => console.error("[Cron/Meta]", e));

      confirmed++;
      console.log(`[Cron] ${order.orderNumber} → PAID (R$${order.total})`);
    } catch (e) {
      console.error(`[Cron] erro ao checar ${order.orderNumber}:`, e);
    }
  }

  return NextResponse.json({ checked: pendingOrders.length, confirmed });
}
