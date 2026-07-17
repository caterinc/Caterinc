import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && (session.user as { role?: string }).role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null) as { title?: string; content?: string } | null;
  const title = body?.title?.trim();
  if (!title) return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });

  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.page.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const page = await prisma.page.create({
    data: { title, slug, content: body?.content || "" },
  });
  return NextResponse.json({ page });
}
