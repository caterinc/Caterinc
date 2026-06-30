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

  try {
    const body = await req.json();
    const { variants, id: _id, ...raw } = body as Record<string, unknown>;

    const slug = (raw.slug as string)?.trim() || generateSlug(raw.name as string);

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name:         raw.name         as string,
        slug,
        description:  (raw.description as string) || null,
        price:        parseFloat(raw.price  as string),
        comparePrice: raw.comparePrice  ? parseFloat(raw.comparePrice as string) : null,
        sku:          (raw.sku as string)?.trim() || null,
        images:       (raw.images as string[]) ?? [],
        categoryId:   (raw.categoryId as string) || null,
        isActive:     raw.isActive  as boolean ?? true,
        isFeatured:   raw.isFeatured as boolean ?? false,
        tags:         (raw.tags as string[]) ?? [],
      },
      include: { category: true, variants: true },
    });

    if (variants !== undefined) {
      const variantList = variants as { size: string; color?: string; sku?: string; stock?: number; price?: string; images?: string[] }[];
      await prisma.productVariant.deleteMany({ where: { productId: params.id } });
      if (variantList.length > 0) {
        // Deduplicate variant SKUs — keep only first occurrence, null the rest
        const seenSkus = new Set<string>();
        await prisma.productVariant.createMany({
          data: variantList.map((v) => {
            const rawSku = v.sku?.trim() || null;
            let sku: string | null = rawSku;
            if (sku) {
              if (seenSkus.has(sku)) { sku = null; }
              else { seenSkus.add(sku); }
            }
            return {
              productId: params.id,
              size:   v.size,
              color:  v.color  || null,
              sku,
              stock:  v.stock  ?? 0,
              price:  v.price  ? parseFloat(v.price) : null,
              images: v.images ?? [],
            };
          }),
        });
      }
    }

    return NextResponse.json(product);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PUT /api/produtos/:id]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
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
