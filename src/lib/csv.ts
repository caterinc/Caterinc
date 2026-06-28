import Papa from "papaparse";

export interface CsvProductRow {
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

export function parseCsvProducts(csvText: string): CsvProductRow[] {
  const result = Papa.parse<CsvProductRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });
  return result.data;
}

export function generateProductsCsv(
  products: Array<{
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    price: string | number;
    comparePrice: string | number | null;
    category: { name: string } | null;
    description: string | null;
    variants: Array<{ size: string; color: string | null; stock: number }>;
    isFeatured: boolean;
    tags: string[];
    images: string[];
  }>
): string {
  const rows = products.map((p) => {
    const sizes = [...new Set(p.variants.map((v) => v.size))].join(";");
    const colors = [...new Set(p.variants.map((v) => v.color).filter(Boolean))].join(";");
    const stocks = p.variants.map((v) => v.stock).join(";");

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || "",
      price: p.price,
      comparePrice: p.comparePrice || "",
      category: p.category?.name || "",
      description: p.description || "",
      sizes,
      colors,
      stock: stocks,
      isFeatured: p.isFeatured ? "true" : "false",
      tags: p.tags.join(","),
      images: p.images.join(";"),
    };
  });

  return Papa.unparse(rows, { header: true });
}
