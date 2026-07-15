import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getRange(period: string, from?: string | null, to?: string | null) {
  const now = new Date();
  switch (period) {
    case "yesterday": {
      const s = new Date(now); s.setDate(now.getDate() - 1); s.setHours(0, 0, 0, 0);
      const e = new Date(s); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "7d": {
      const s = new Date(now); s.setDate(now.getDate() - 6); s.setHours(0, 0, 0, 0);
      return { start: s, end: now };
    }
    case "month": {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    }
    case "lastmonth": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "custom": {
      const s = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
      const e = to ? new Date(to + "T23:59:59") : now;
      return { start: s, end: e };
    }
    default: {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      return { start: s, end: now };
    }
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
