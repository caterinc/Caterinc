import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RawEvent {
  type: string;
  page: string;
  path?: string;
  label?: string;
  scrollPct?: number;
  meta?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, events } = await req.json() as { sessionId: string; events: RawEvent[] };
    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: false });
    }

    // Cleanup events older than 2 hours (10% chance per request to avoid overhead)
    if (Math.random() < 0.1) {
      await prisma.sessionEvent.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
      });
    }

    await prisma.sessionEvent.createMany({
      data: events.map((e) => ({
        sessionId,
        type: e.type ?? "unknown",
        page: e.page ?? "other",
        path: e.path ?? null,
        label: e.label ?? null,
        scrollPct: e.scrollPct ?? null,
        meta: e.meta as Prisma.InputJsonValue | undefined,
      })),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
