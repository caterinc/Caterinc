import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "12");
  const search = searchParams.get("search") ?? "";
  const categoria = searchParams.get("categoria") ?? "";
  const featured = searchParams.get("featured") === "true";
  const adminAll = searchParams.get("adminAll") === "true";
  const sortBy = searchParams.get("sortBy") ?? "order";
  const sizes = searchParams.get("sizes")?.split(",").filter(Boolean) ?? [];
  const colors = searchParams.get("colors")?.split(",").filter(Boolean) ?? [];
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const where: Record<string, unknown> = {};

  if (!adminAll) where.isActive = true;
  if (featured) where.isFeatured = true;
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (categoria) where.category = { slug: categoria };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Record<string, unknown>).gte = parseFloat(minPrice);
    if (maxPrice) (where.price as Record<string, unknown>).lte = parseFloat(maxPrice);
  }
  if (sizes.length > 0) {
    where.variants = { some: { size: { in: sizes } } };
  } else if (colors.length > 0) {
    where.variants = { some: { color: { in: colors } } };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, variants: true },
      orderBy: sortBy === "price_asc"
        ? { price: "asc" }
        : sortBy === "price_desc"
        ? { price: "desc" }
        : sortBy === "name"
        ? { name: "asc" }
        : sortBy === "newest"
        ? { createdAt: "desc" }
        : { order: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const { variants, id: _id, colorGroups: _cg, productType: _pt, ...raw } = body;

    const slug = (raw.slug as string)?.trim() || generateSlug(raw.name as string);
    const seenSkus = new Set<string>();

    const product = await prisma.product.create({
      data: {
        name:         raw.name        as string,
        slug,
        description:  (raw.description as string) || null,
        price:        parseFloat(raw.price as string),
        comparePrice: raw.comparePrice ? parseFloat(raw.comparePrice as string) : null,
        sku:          (raw.sku as string)?.trim() || null,
        images:       (raw.images as string[]) ?? [],
        categoryId:   (raw.categoryId as string) || null,
        isActive:     (raw.isActive  as boolean) ?? true,
        isFeatured:   (raw.isFeatured as boolean) ?? false,
        tags:         (raw.tags as string[]) ?? [],
        variants: variants
          ? {
              create: (variants as { size: string; color?: string; sku?: string; stock?: number; price?: string; images?: string[] }[]).map((v, idx) => {
                const rawSku = v.sku?.trim() || null;
                let sku: string | null = rawSku;
                if (sku) { if (seenSkus.has(sku)) { sku = null; } else { seenSkus.add(sku); } }
                return { size: v.size, color: v.color || null, sku, stock: v.stock ?? 0, price: v.price ? parseFloat(v.price) : null, images: v.images ?? [], order: idx };
              }),
            }
          : undefined,
      },
      include: { category: true, variants: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/produtos]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
