import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProductsCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");

  const products = await prisma.product.findMany({
    where: categoria ? { category: { slug: categoria } } : undefined,
    include: { category: true, variants: true },
    orderBy: { order: "asc" },
  });

  const csv = generateProductsCsv(
    products.map((p) => ({
      ...p,
      price: p.price.toString(),
      comparePrice: p.comparePrice?.toString() ?? null,
      variants: p.variants.map((v) => ({
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="produtos-${Date.now()}.csv"`,
    },
  });
}
