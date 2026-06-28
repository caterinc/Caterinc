import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

function isShopifyFormat(headers: string[]): boolean {
  return headers.includes("Handle") && headers.includes("Title") && headers.includes("Variant Price");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractCategoryFromShopify(productCategory: string): string {
  if (!productCategory) return "";
  const parts = productCategory.split(">").map((p) => p.trim());
  return parts[parts.length - 1] || "";
}

interface ShopifyRow {
  Handle: string;
  Title: string;
  "Body (HTML)": string;
  Tags: string;
  Published: string;
  "Option1 Name": string;
  "Option1 Value": string;
  "Option2 Name": string;
  "Option2 Value": string;
  "Option3 Name": string;
  "Option3 Value": string;
  "Variant SKU": string;
  "Variant Inventory Qty": string;
  "Variant Price": string;
  "Variant Compare At Price": string;
  "Image Src": string;
  "Product Category": string;
  Status: string;
}

interface NativeRow {
  name: string;
  slug?: string;
  sku?: string;
  price: string;
  comparePrice?: string;
  category?: string;
  description?: string;
  sizes?: string;
  colors?: string;
  stock?: string;
  isFeatured?: string;
  tags?: string;
  images?: string;
}

interface ParsedProduct {
  name: string;
  slug: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  description: string;
  categoryName: string;
  isFeatured: boolean;
  tags: string[];
  images: string[];
  isActive: boolean;
  variants: Array<{ size: string; color: string | null; sku: string | null; stock: number; price: number | null }>;
}

function parseShopifyProducts(rows: ShopifyRow[]): ParsedProduct[] {
  const groups = new Map<string, ShopifyRow[]>();
  for (const row of rows) {
    if (!row.Handle) continue;
    if (!groups.has(row.Handle)) groups.set(row.Handle, []);
    groups.get(row.Handle)!.push(row);
  }

  const products: ParsedProduct[] = [];

  for (const [handle, productRows] of groups) {
    const firstFull = productRows.find((r) => r.Title) || productRows[0];
    if (!firstFull) continue;

    const opt1Name = (firstFull["Option1 Name"] || "").toLowerCase();
    const opt2Name = (firstFull["Option2 Name"] || "").toLowerCase();

    const isOpt1Color = opt1Name.includes("cor") || opt1Name.includes("color");
    const isOpt2Size =
      opt2Name.includes("tamanho") ||
      opt2Name.includes("size") ||
      opt2Name.includes("tam") ||
      opt2Name.includes("número");

    const images = [
      ...new Set(productRows.map((r) => r["Image Src"]).filter(Boolean)),
    ];

    const variants = productRows
      .filter((r) => r["Variant Price"] || r["Variant SKU"])
      .map((r) => {
        const opt1 = r["Option1 Value"] || "";
        const opt2 = r["Option2 Value"] || "";
        const size = isOpt2Size ? opt2 : opt1 || "Único";
        const color = isOpt1Color ? opt1 : null;

        return {
          size: size || "Único",
          color: color || null,
          sku: r["Variant SKU"] || null,
          stock: parseInt(r["Variant Inventory Qty"]) || 0,
          price: r["Variant Price"] ? parseFloat(r["Variant Price"]) : null,
        };
      });

    const basePrice = parseFloat(firstFull["Variant Price"] || "0") || 0;
    const comparePrice = firstFull["Variant Compare At Price"]
      ? parseFloat(firstFull["Variant Compare At Price"])
      : null;

    products.push({
      name: firstFull.Title,
      slug: handle,
      sku: variants[0]?.sku?.split("-").slice(0, 2).join("-") || "",
      price: basePrice,
      comparePrice: comparePrice && comparePrice > basePrice ? comparePrice : null,
      description: firstFull["Body (HTML)"] ? stripHtml(firstFull["Body (HTML)"]) : "",
      categoryName: extractCategoryFromShopify(firstFull["Product Category"]),
      isFeatured: false,
      tags: firstFull.Tags
        ? firstFull.Tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
      images,
      isActive: firstFull.Status !== "draft",
      variants: variants.length > 0 ? variants : [{ size: "Único", color: null, sku: null, stock: 0, price: null }],
    });
  }

  return products;
}

function parseNativeProducts(rows: NativeRow[]): ParsedProduct[] {
  return rows
    .filter((row) => row.name && row.price)
    .map((row) => {
      const sizes = row.sizes ? row.sizes.split(";").map((s) => s.trim()) : ["Único"];
      const colors = row.colors ? row.colors.split(";").map((c) => c.trim()) : [null];
      const stocks = row.stock ? row.stock.split(";").map((s) => parseInt(s.trim()) || 0) : [];

      const variants = sizes.flatMap((size, si) =>
        colors.map((color, ci) => ({
          size,
          color: color || null,
          sku: row.sku ? `${row.sku}-${size}-${ci}` : null,
          stock: stocks[si] ?? stocks[0] ?? 0,
          price: null,
        }))
      );

      return {
        name: row.name,
        slug: row.slug || generateSlug(row.name),
        sku: row.sku || "",
        price: parseFloat(row.price),
        comparePrice: row.comparePrice ? parseFloat(row.comparePrice) : null,
        description: row.description || "",
        categoryName: row.category || "",
        isFeatured: row.isFeatured === "true",
        tags: row.tags ? row.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        images: row.images ? row.images.split(";").map((i) => i.trim()).filter(Boolean) : [],
        isActive: true,
        variants,
      };
    });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const products: ParsedProduct[] = isShopifyFormat(headers)
    ? parseShopifyProducts(parsed.data as ShopifyRow[])
    : parseNativeProducts(parsed.data as NativeRow[]);

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const product of products) {
    try {
      if (!product.name || !product.price) {
        results.errors.push(`Produto inválido: nome="${product.name}", preço="${product.price}"`);
        continue;
      }

      const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
      if (existing) {
        results.skipped++;
        continue;
      }

      let categoryId: string | undefined;
      if (product.categoryName) {
        const cat = await prisma.category.findFirst({
          where: { name: { contains: product.categoryName, mode: "insensitive" } },
        });
        categoryId = cat?.id;
      }

      await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          sku: product.sku || null,
          price: product.price,
          comparePrice: product.comparePrice,
          description: product.description || null,
          categoryId: categoryId || null,
          isFeatured: product.isFeatured,
          tags: product.tags,
          images: product.images,
          isActive: product.isActive,
          variants: { create: product.variants },
        },
      });

      results.created++;
    } catch (e) {
      results.errors.push(`Erro ao importar "${product.name}": ${(e as Error).message}`);
    }
  }

  return NextResponse.json(results);
}
