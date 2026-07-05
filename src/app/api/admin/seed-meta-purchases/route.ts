import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { paymentStatus: "PAID" },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  let ok = 0, fail = 0;
  const results: string[] = [];

  for (const order of orders) {
    const addr = order.shippingAddress as Record<string, string> | null;
    const utms = (order as unknown as { utmData: Record<string, string> | null }).utmData;
    const nameParts = (addr?.name || "Cliente").split(" ");

    try {
      await sendMetaEvent({
        eventName: "Purchase",
        eventId: `${order.orderNumber}-purchase-seed`,
        email: order.email,
        phone: addr?.phone || null,
        firstName: nameParts[0] || null,
        lastName: nameParts.slice(1).join(" ") || null,
        value: Number(order.total),
        currency: "BRL",
        contents: order.items.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
        orderId: order.orderNumber,
        fbc: utms?.fbc || null,
        fbp: utms?.fbp || null,
      });
      results.push(`✅ ${order.orderNumber} R$${order.total}`);
      ok++;
    } catch (e) {
      results.push(`❌ ${order.orderNumber} — ${String(e)}`);
      fail++;
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  return NextResponse.json({ total: orders.length, ok, fail, results });
}
