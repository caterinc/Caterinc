import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
    },
    include: { category: true, variants: true },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variants, id: _id, ...productData } = body;

  if (productData.name && !productData.slug) {
    productData.slug = generateSlug(productData.name);
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...productData,
      price: productData.price ? parseFloat(productData.price) : undefined,
      comparePrice: productData.comparePrice ? parseFloat(productData.comparePrice) : null,
      categoryId: productData.categoryId || null,
    },
    include: { category: true, variants: true },
  });

  if (variants !== undefined) {
    await prisma.productVariant.deleteMany({ where: { productId: params.id } });
    if (variants.length > 0) {
      await prisma.productVariant.createMany({
        data: variants.map((v: { size: string; color?: string; sku?: string; stock?: number; price?: string; image?: string }) => ({
          productId: params.id,
          size: v.size,
          color: v.color || null,
          sku: v.sku || null,
          stock: v.stock ?? 0,
          price: v.price ? parseFloat(v.price) : null,
          image: v.image || null,
        })),
      });
    }
  }

  return NextResponse.json(product);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderItemCount = await prisma.orderItem.count({ where: { productId: params.id } });
  if (orderItemCount > 0) {
    // Soft delete: deactivate instead of hard delete to preserve order history
    await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ success: true, softDeleted: true });
  }

  await prisma.productVariant.deleteMany({ where: { productId: params.id } });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
