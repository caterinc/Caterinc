import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST { add: string[], remove: string[] } — batch assign/unassign products from a collection
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { add = [], remove = [] } = await req.json() as { add?: string[]; remove?: string[] };

  await Promise.all([
    add.length > 0
      ? prisma.product.updateMany({ where: { id: { in: add } }, data: { categoryId: params.id } })
      : Promise.resolve(),
    remove.length > 0
      ? prisma.product.updateMany({ where: { id: { in: remove } }, data: { categoryId: null } })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true, added: add.length, removed: remove.length });
}
