import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { location: string } }) {
  const menu = await prisma.menu.findUnique({
    where: { location: params.location },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(menu);
}

export async function PUT(req: NextRequest, { params }: { params: { location: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items }: { items: Array<{ id?: string; label: string; url: string; order: number }> } = await req.json();

  const menu = await prisma.menu.upsert({
    where: { location: params.location },
    update: {},
    create: { name: params.location, location: params.location },
  });

  // Replace all items
  await prisma.menuItem.deleteMany({ where: { menuId: menu.id } });
  await prisma.menuItem.createMany({
    data: items.map((item, i) => ({
      menuId: menu.id,
      label: item.label,
      url: item.url,
      order: item.order ?? i,
    })),
  });

  const updated = await prisma.menu.findUnique({
    where: { location: params.location },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(updated);
}
