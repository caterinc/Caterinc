import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: true } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const slug = (body.slug as string) || generateSlug(body.name as string);
    const category = await prisma.category.create({
      data: {
        name: body.name as string,
        slug,
        image: (body.image as string) || null,
        description: (body.description as string) || null,
        order: (body.order as number) || 0,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    const msg = err.code === "P2002" ? "Este slug já está em uso" : "Erro ao criar coleção";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
