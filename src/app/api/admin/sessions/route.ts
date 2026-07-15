import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activeWindow = new Date(Date.now() - 20 * 1000);

    const [presences, recentEvents] = await Promise.all([
      prisma.presence.findMany({
        where: { updatedAt: { gte: activeWindow } },
        select: { sessionId: true, page: true, source: true, returning: true, updatedAt: true, createdAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.sessionEvent.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
        select: { sessionId: true, type: true, page: true, label: true, scrollPct: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);

    // Group events by sessionId
    const eventsBySession: Record<string, typeof recentEvents> = {};
    for (const e of recentEvents) {
      if (!eventsBySession[e.sessionId]) eventsBySession[e.sessionId] = [];
      eventsBySession[e.sessionId].push(e);
    }

    const sessions = presences.map((p) => ({
      sessionId: p.sessionId,
      page: p.page,
      source: p.source,
      returning: p.returning,
      activeFor: Math.round((Date.now() - p.createdAt.getTime()) / 1000),
      lastSeen: p.updatedAt.toISOString(),
      events: (eventsBySession[p.sessionId] || []).slice(0, 30).reverse(),
    }));

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}
