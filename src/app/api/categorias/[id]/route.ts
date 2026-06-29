import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, image, description, order, isActive } = body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (image !== undefined) data.image = image;
    if (description !== undefined) data.description = description;
    if (order !== undefined) data.order = order;
    if (isActive !== undefined) data.isActive = isActive;

    const category = await prisma.category.update({ where: { id: params.id }, data });
    return NextResponse.json(category);
  } catch (e) {
    const err = e as { code?: string };
    const msg = err.code === "P2002" ? "Este slug já está em uso" : "Erro ao salvar coleção";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.category.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
