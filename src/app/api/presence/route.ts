import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
    if (!sessionId || !page) return NextResponse.json({ ok: false });

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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
