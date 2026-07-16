import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brazilDayStart, brazilDayEnd, brazilMonthStart } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getRange(period: string, from?: string | null, to?: string | null) {
  const now = new Date();
  switch (period) {
    case "yesterday":
      return { start: brazilDayStart(1), end: brazilDayEnd(1) };
    case "7d":
      return { start: brazilDayStart(6), end: now };
    case "month":
      return { start: brazilMonthStart(0), end: now };
    case "lastmonth":
      return { start: brazilMonthStart(1), end: new Date(brazilMonthStart(0).getTime() - 1) };
    case "custom": {
      const s = from ? new Date(`${from}T00:00:00-03:00`) : brazilMonthStart(0);
      const e = to ? new Date(`${to}T23:59:59-03:00`) : now;
      return { start: s, end: e };
    }
    default:
      return { start: brazilDayStart(0), end: now };
  }
}

export async function GET(req: Request) {
  try {
    const p = new URL(req.url).searchParams;
    const { start, end } = getRange(p.get("period") || "today", p.get("from"), p.get("to"));

    const [sessions, productRows, cartRows, checkoutRows, paid] = await Promise.all([
      prisma.presence.count({ where: { createdAt: { gte: start, lte: end } } }),

      prisma.sessionEvent.findMany({
        where: { type: "pageview", page: "product", createdAt: { gte: start, lte: end } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),

      prisma.sessionEvent.findMany({
        where: { type: "pageview", page: "cart", createdAt: { gte: start, lte: end } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),

      prisma.sessionEvent.findMany({
        where: { type: "pageview", page: "checkout", createdAt: { gte: start, lte: end } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),

      prisma.order.count({ where: { paymentStatus: "PAID", createdAt: { gte: start, lte: end } } }),
    ]);

    return NextResponse.json({
      sessions,
      product: productRows.length,
      cart: cartRows.length,
      checkout: checkoutRows.length,
      paid,
    });
  } catch {
    return NextResponse.json({ sessions: 0, product: 0, cart: 0, checkout: 0, paid: 0 });
  }
}
