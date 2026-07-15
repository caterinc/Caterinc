import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const threeMinAgo = new Date(now.getTime() - 20 * 1000);
    const thirtyMinAgo = new Date(now.getTime() - 20 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      presences,
      activeCarts,
      ordersToday,
      revenueToday,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.presence.findMany({
        where: { updatedAt: { gte: threeMinAgo } },
        select: { page: true },
      }),
      prisma.cart.count({
        where: {
          updatedAt: { gte: thirtyMinAgo },
          items: { some: {} },
        },
      }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID", createdAt: { gte: todayStart } },
      }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID" },
      }),
    ]);

    const visitorsNow = presences.length;
    const onHome = presences.filter((p) => p.page === "home").length;
    const onProduct = presences.filter((p) => p.page === "product").length;
    const onCart = presences.filter((p) => p.page === "cart").length;
    const onCheckout = presences.filter((p) => p.page === "checkout").length;

    const purchasedToday = await prisma.order.count({
      where: { paymentStatus: "PAID", createdAt: { gte: todayStart } },
    });

    return NextResponse.json({
      visitorsNow,
      onHome,
      onProduct,
      onCart,
      onCheckout,
      activeCarts,
      ordersToday,
      purchasedToday,
      revenueToday: Number(revenueToday._sum.total || 0),
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      updatedAt: now.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
