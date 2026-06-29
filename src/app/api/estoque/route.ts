import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lowStock = searchParams.get("lowStock") === "true";

  const variants = await prisma.productVariant.findMany({
    where: lowStock ? { stock: { lt: 5 } } : undefined,
    include: { product: { select: { id: true, name: true, slug: true, images: true } } },
    orderBy: { stock: "asc" },
  });

  return NextResponse.json(variants);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Array<{ id: string; stock: number }> = body.updates;

  if (Array.isArray(updates) && updates.length > 0) {
    await Promise.all(
      updates.map((u) =>
        prisma.productVariant.update({
          where: { id: u.id },
          data: { stock: u.stock },
        })
      )
    );
    return NextResponse.json({ success: true });
  }

  // Bulk add: add X units to every variant
  const addAmount: number | undefined = body.addToAll;
  if (typeof addAmount === "number" && addAmount > 0) {
    await prisma.productVariant.updateMany({
      data: { stock: { increment: addAmount } },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Nenhuma atualização" }, { status: 400 });
}
