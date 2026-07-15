import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const activeWindow = new Date(now.getTime() - 20 * 1000);
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      presences,
      activeCarts,
      ordersToday,
      orders24h,
      orders7d,
      orders30d,
      revenueToday,
      revenue24h,
      revenue7d,
      revenue30d,
      totalOrders,
      totalRevenue,
      sessionsToday,
      purchasedToday,
    ] = await Promise.all([
      prisma.presence.findMany({ where: { updatedAt: { gte: activeWindow } }, select: { page: true } }),
      prisma.cart.count({ where: { updatedAt: { gte: activeWindow }, items: { some: {} } } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: h24ago } } }),
      prisma.order.count({ where: { createdAt: { gte: d7ago } } }),
      prisma.order.count({ where: { createdAt: { gte: d30ago } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID", createdAt: { gte: todayStart } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID", createdAt: { gte: h24ago } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID", createdAt: { gte: d7ago } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID", createdAt: { gte: d30ago } } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
      prisma.presence.count({ where: { updatedAt: { gte: todayStart } } }),
      prisma.order.count({ where: { paymentStatus: "PAID", createdAt: { gte: todayStart } } }),
    ]);

    const visitorsNow = presences.length;

    return NextResponse.json({
      visitorsNow,
      onHome: presences.filter((p) => p.page === "home").length,
      onProduct: presences.filter((p) => p.page === "product").length,
      onCart: presences.filter((p) => p.page === "cart").length,
      onCheckout: presences.filter((p) => p.page === "checkout").length,
      activeCarts,
      ordersToday,
      orders24h,
      orders7d,
      orders30d,
      purchasedToday,
      revenueToday: Number(revenueToday._sum.total || 0),
      revenue24h: Number(revenue24h._sum.total || 0),
      revenue7d: Number(revenue7d._sum.total || 0),
      revenue30d: Number(revenue30d._sum.total || 0),
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      sessionsToday,
    });
  } catch {
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
