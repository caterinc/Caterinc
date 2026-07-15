import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ ok: false });

    const presence = await prisma.presence.findUnique({
      where: { sessionId },
      select: { path: true, page: true, scrollPct: true, photoIndex: true, typing: true, updatedAt: true },
    });

    if (!presence) return NextResponse.json({ ok: false });

    return NextResponse.json({
      ok: true,
      path: presence.path,
      page: presence.page,
      photoIndex: presence.photoIndex,
      scrollPct: presence.scrollPct,
      typing: presence.typing ?? null,
      updatedAt: presence.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
