import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find products with "teste" in the name (case insensitive)
  const products = await prisma.product.findMany({
    where: { name: { contains: "teste", mode: "insensitive" } },
    include: { variants: true },
  });

  if (products.length === 0) {
    return NextResponse.json({ message: "Nenhum produto teste encontrado." });
  }

  const deleted: string[] = [];

  for (const product of products) {
    const variantIds = product.variants.map((v) => v.id);

    // Null-out orderItem references to this product/variants (no cascade defined)
    await prisma.orderItem.updateMany({
      where: { productId: product.id },
      data: { productId: null, variantId: null },
    });

    // Remove cart items referencing these variants
    await prisma.cartItem.deleteMany({
      where: { productId: product.id },
    });

    // Now delete the product (cascades: variants, reviews)
    await prisma.product.delete({ where: { id: product.id } });

    deleted.push(product.name);
  }

  return NextResponse.json({ deleted, message: `Excluídos: ${deleted.join(", ")}` });
}
