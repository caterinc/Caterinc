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

    const [presence, lastGallery, lastScroll] = await Promise.all([
      prisma.presence.findUnique({
        where: { sessionId },
        select: { path: true, page: true, updatedAt: true },
      }),
      prisma.sessionEvent.findFirst({
        where: { sessionId, type: "gallery" },
        orderBy: { createdAt: "desc" },
        select: { meta: true, createdAt: true },
      }),
      prisma.sessionEvent.findFirst({
        where: { sessionId, type: "scroll" },
        orderBy: { createdAt: "desc" },
        select: { scrollPct: true, createdAt: true },
      }),
    ]);

    if (!presence) return NextResponse.json({ ok: false });

    const galleryMeta = (lastGallery?.meta as { photoIndex?: number } | null) ?? null;

    return NextResponse.json({
      ok: true,
      path: presence.path,
      page: presence.page,
      updatedAt: presence.updatedAt.toISOString(),
      photoIndex: galleryMeta?.photoIndex ?? null,
      photoAt: lastGallery?.createdAt.toISOString() ?? null,
      scrollPct: lastScroll?.scrollPct ?? null,
      scrollAt: lastScroll?.createdAt.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
