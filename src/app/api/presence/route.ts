import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, page } = body as { sessionId?: string; page?: string };
    if (!sessionId || !page) return NextResponse.json({ ok: false });

    await prisma.presence.upsert({
      where: { sessionId },
      update: { page },
      create: { sessionId, page },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
