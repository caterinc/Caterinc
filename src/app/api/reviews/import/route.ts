import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ReviewRow {
  product_slug?: string;
  product_name?: string;
  product_link?: string;
  reviewer_name: string;
  rating: string | number;
  comment?: string;
  verified_purchase?: string | boolean;
  date?: string;
}

function extractSlugFromLink(link: string): string {
  try {
    const url = link.includes("://") ? new URL(link) : new URL(`http://x.com${link}`);
    const parts = url.pathname.split("/").filter(Boolean);
    // Take last non-empty segment as the slug
    return parts[parts.length - 1] || "";
  } catch {
    return link.split("/").filter(Boolean).pop() || "";
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { rows: ReviewRow[]; selectedProductId?: string };
  const { rows, selectedProductId } = body;

  // Collect all slugs/names/links to batch resolve
  const allSlugs = new Set<string>();
  const allNames = new Set<string>();

  for (const row of rows) {
    if (row.product_slug) allSlugs.add(row.product_slug.trim());
    if (row.product_link) {
      const s = extractSlugFromLink(row.product_link);
      if (s) allSlugs.add(s);
    }
    if (row.product_name) allNames.add(row.product_name.trim());
  }

  // Batch lookup products by slug and by name
  const [bySlugList, byNameList] = await Promise.all([
    allSlugs.size > 0
      ? prisma.product.findMany({ where: { slug: { in: Array.from(allSlugs) } }, select: { id: true, slug: true, name: true } })
      : Promise.resolve([]),
    allNames.size > 0
      ? prisma.product.findMany({
          where: { OR: Array.from(allNames).map((n) => ({ name: { contains: n, mode: "insensitive" as const } })) },
          select: { id: true, slug: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const slugToId = Object.fromEntries(bySlugList.map((p) => [p.slug, p.id]));
  // For name lookup: map lowercase trimmed name → productId
  const nameToId: Record<string, string> = {};
  for (const p of byNameList) {
    nameToId[p.name.toLowerCase().trim()] = p.id;
  }
  // Also partial match: for each queried name, find best match
  function findByName(query: string): string | null {
    const q = query.toLowerCase().trim();
    // Exact match
    if (nameToId[q]) return nameToId[q];
    // Partial match
    for (const [name, id] of Object.entries(nameToId)) {
      if (name.includes(q) || q.includes(name)) return id;
    }
    return null;
  }

  const valid: {
    productId: string;
    reviewerName: string;
    rating: number;
    comment: string | null;
    verifiedPurchase: boolean;
    createdAt: Date;
  }[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const lineNum = idx + 2;

    // Resolve productId using priority: slug → name → link → selectedProductId
    let productId: string | null = null;

    if (row.product_slug?.trim()) {
      productId = slugToId[row.product_slug.trim()] || null;
    }
    if (!productId && row.product_name?.trim()) {
      productId = findByName(row.product_name.trim());
    }
    if (!productId && row.product_link?.trim()) {
      const slug = extractSlugFromLink(row.product_link.trim());
      if (slug) productId = slugToId[slug] || null;
    }
    if (!productId && selectedProductId) {
      productId = selectedProductId;
    }

    if (!productId) {
      const identifier = row.product_slug || row.product_name || row.product_link || "";
      if (identifier) {
        errors.push(`Linha ${lineNum}: produto "${identifier}" não encontrado. Dica: selecione um produto na dropdown ou verifique o slug.`);
      } else {
        errors.push(`Linha ${lineNum}: sem produto identificado. Selecione um produto na dropdown ou adicione a coluna "product_slug" no CSV.`);
      }
      return;
    }

    const rating = parseInt(String(row.rating));
    if (isNaN(rating) || rating < 1 || rating > 5) {
      errors.push(`Linha ${lineNum}: nota inválida "${row.rating}"`);
      return;
    }

    valid.push({
      productId,
      reviewerName: String(row.reviewer_name || "Anônimo"),
      rating,
      comment: row.comment ? String(row.comment) : null,
      verifiedPurchase: String(row.verified_purchase).toLowerCase() === "true",
      createdAt: row.date ? new Date(row.date) : new Date(),
    });
  });

  const created = await prisma.review.createMany({ data: valid });

  return NextResponse.json({ created: created.count, errors });
}
