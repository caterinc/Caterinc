import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// The VSL (forces-one.com) is a separate static site that reports into this
// same admin Live View / Sessões, so it needs cross-origin access here.
const ALLOWED_ORIGIN = "https://forces-one.com";

function corsHeaders(origin: string | null): HeadersInit {
  return origin === ALLOWED_ORIGIN ? { "Access-Control-Allow-Origin": ALLOWED_ORIGIN } : {};
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders(req.headers.get("origin")),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

interface RawEvent {
  type: string;
  page: string;
  path?: string;
  label?: string;
  scrollPct?: number;
  meta?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { sessionId, events } = await req.json() as { sessionId: string; events: RawEvent[] };
    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: false }, { headers });
    }

    // Cleanup events older than 2 hours (10% chance per request to avoid overhead).
    // Events whose sessionId is linked to an Order (utmData.externalId) are kept
    // forever so the admin's per-order navigation history stays available.
    if (Math.random() < 0.1) {
      await prisma.$executeRaw`
        DELETE FROM "SessionEvent"
        WHERE "createdAt" < ${new Date(Date.now() - 2 * 60 * 60 * 1000)}
        AND "sessionId" NOT IN (
          SELECT "utmData"->>'externalId' FROM "Order" WHERE "utmData"->>'externalId' IS NOT NULL
        )
      `;
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

    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json({ ok: false }, { headers });
  }
}
