import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Sessions seen in the last 10 minutes
    const activeWindow = new Date(Date.now() - 10 * 60 * 1000);
    // Events from the last 2 hours
    const eventWindow = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const [presences, recentEvents] = await Promise.all([
      prisma.presence.findMany({
        where: { updatedAt: { gte: activeWindow } },
        select: { sessionId: true, page: true, source: true, returning: true, updatedAt: true, createdAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.sessionEvent.findMany({
        where: { createdAt: { gte: eventWindow } },
        select: { sessionId: true, type: true, page: true, label: true, scrollPct: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);

    const eventsBySession: Record<string, typeof recentEvents> = {};
    for (const e of recentEvents) {
      if (!eventsBySession[e.sessionId]) eventsBySession[e.sessionId] = [];
      eventsBySession[e.sessionId].push(e);
    }

    // Mark sessions as "active" (last 20s) or "recent" (10 min)
    const activeThreshold = new Date(Date.now() - 20 * 1000);

    const sessions = presences.map((p) => ({
      sessionId: p.sessionId,
      page: p.page,
      source: p.source,
      returning: p.returning,
      active: p.updatedAt >= activeThreshold,
      activeFor: Math.round((Date.now() - p.createdAt.getTime()) / 1000),
      lastSeen: p.updatedAt.toISOString(),
      events: (eventsBySession[p.sessionId] || []).slice(0, 50).reverse(),
    }));

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}
