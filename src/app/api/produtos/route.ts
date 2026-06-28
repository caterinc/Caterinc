import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

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

  const body = await req.json();
  const { variants, ...productData } = body;

  const slug = productData.slug || generateSlug(productData.name);

  const product = await prisma.product.create({
    data: {
      ...productData,
      slug,
      price: parseFloat(productData.price),
      comparePrice: productData.comparePrice ? parseFloat(productData.comparePrice) : null,
      variants: variants
        ? {
            create: variants.map((v: { size: string; color?: string; sku?: string; stock?: number; price?: string; image?: string }) => ({
              size: v.size,
              color: v.color || null,
              sku: v.sku || null,
              stock: v.stock ?? 0,
              price: v.price ? parseFloat(v.price) : null,
              image: v.image || null,
            })),
          }
        : undefined,
    },
    include: { category: true, variants: true },
  });

  return NextResponse.json(product, { status: 201 });
}
