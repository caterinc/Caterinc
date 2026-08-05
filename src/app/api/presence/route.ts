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

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const body = await req.json();
    const { sessionId, page, path, scrollPct, photoIndex, typing, source, returning: ret } = body as {
      sessionId?: string;
      page?: string;
      path?: string;
      scrollPct?: number;
      photoIndex?: number;
      typing?: Record<string, unknown>;
      source?: string;
      returning?: boolean;
    };
    if (!sessionId || !page) return NextResponse.json({ ok: false }, { headers });

    const typingJson = typing as Prisma.InputJsonValue | undefined;

    await prisma.presence.upsert({
      where: { sessionId },
      update: {
        page,
        path: path ?? null,
        scrollPct: scrollPct ?? null,
        photoIndex: photoIndex ?? null,
        ...(typingJson !== undefined ? { typing: typingJson } : {}),
        source: source ?? "direct",
        returning: ret ?? false,
      },
      create: {
        sessionId,
        page,
        path: path ?? null,
        scrollPct: scrollPct ?? null,
        photoIndex: photoIndex ?? null,
        typing: typingJson ?? Prisma.JsonNull,
        source: source ?? "direct",
        returning: ret ?? false,
      },
    });

    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json({ ok: false }, { headers });
  }
}
