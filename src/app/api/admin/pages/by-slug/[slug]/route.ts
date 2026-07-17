import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && (session.user as { role?: string }).role === "ADMIN";
}

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  return NextResponse.json({ page });
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null) as { title?: string; content?: string } | null;
  if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

  const page = await prisma.page.upsert({
    where: { slug: params.slug },
    update: { ...(body.content !== undefined ? { content: body.content } : {}) },
    create: {
      slug: params.slug,
      title: body.title || params.slug,
      content: body.content || "",
    },
  });
  return NextResponse.json({ page });
}
