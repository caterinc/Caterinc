import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, page, path, source, returning: ret } = body as {
      sessionId?: string;
      page?: string;
      path?: string;
      source?: string;
      returning?: boolean;
    };
    if (!sessionId || !page) return NextResponse.json({ ok: false });

    await prisma.presence.upsert({
      where: { sessionId },
      update: { page, path: path ?? null, source: source ?? "direct", returning: ret ?? false },
      create: { sessionId, page, path: path ?? null, source: source ?? "direct", returning: ret ?? false },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
