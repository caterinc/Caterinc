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

    const paid = "PAID";
    const pending = "PENDING";

    const [
      presences, activeCarts, sessionsToday,
      totalOrders, totalRevenue,
      // Today
      paidToday, pendingToday, revenueToday,
      // 24h
      paid24h, pending24h, revenue24h,
      // 7d
      paid7d, pending7d, revenue7d,
      // 30d
      paid30d, pending30d, revenue30d,
    ] = await Promise.all([
      prisma.presence.findMany({ where: { updatedAt: { gte: activeWindow } }, select: { page: true } }),
      prisma.cart.count({ where: { updatedAt: { gte: activeWindow }, items: { some: {} } } }),
      prisma.presence.count({ where: { updatedAt: { gte: todayStart } } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: paid } }),
      // today
      prisma.order.count({ where: { paymentStatus: paid, createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { paymentStatus: pending, createdAt: { gte: todayStart } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: paid, createdAt: { gte: todayStart } } }),
      // 24h
      prisma.order.count({ where: { paymentStatus: paid, createdAt: { gte: h24ago } } }),
      prisma.order.count({ where: { paymentStatus: pending, createdAt: { gte: h24ago } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: paid, createdAt: { gte: h24ago } } }),
      // 7d
      prisma.order.count({ where: { paymentStatus: paid, createdAt: { gte: d7ago } } }),
      prisma.order.count({ where: { paymentStatus: pending, createdAt: { gte: d7ago } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: paid, createdAt: { gte: d7ago } } }),
      // 30d
      prisma.order.count({ where: { paymentStatus: paid, createdAt: { gte: d30ago } } }),
      prisma.order.count({ where: { paymentStatus: pending, createdAt: { gte: d30ago } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: paid, createdAt: { gte: d30ago } } }),
    ]);

    const visitorsNow = presences.length;
    const fromMeta = presences.filter((p) => p.source === "meta").length;
    const returningNow = presences.filter((p) => p.returning).length;

    return NextResponse.json({
      visitorsNow,
      fromMeta,
      returningNow,
      onHome: presences.filter((p) => p.page === "home").length,
      onProduct: presences.filter((p) => p.page === "product").length,
      onCart: presences.filter((p) => p.page === "cart").length,
      onCheckout: presences.filter((p) => p.page === "checkout").length,
      activeCarts,
      sessionsToday,
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      // today
      paidToday, pendingToday,
      revenueToday: Number(revenueToday._sum.total || 0),
      // 24h
      paid24h, pending24h,
      revenue24h: Number(revenue24h._sum.total || 0),
      // 7d
      paid7d, pending7d,
      revenue7d: Number(revenue7d._sum.total || 0),
      // 30d
      paid30d, pending30d,
      revenue30d: Number(revenue30d._sum.total || 0),
    });
  } catch {
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
