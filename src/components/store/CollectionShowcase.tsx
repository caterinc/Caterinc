import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { ShowcaseProductCard } from "./ShowcaseProductCard";
import type { Product, Category, ProductVariant } from "@prisma/client";

type ProductWithRelations = Product & {
  category: Category | null;
  variants: ProductVariant[];
};

export type CollectionDisplayMode = "grade" | "carrossel";

interface CollectionShowcaseProps {
  sectionId: string;
  title: string;
  products: ProductWithRelations[];
  displayMode?: CollectionDisplayMode;
  desktopColumns?: number;
  mobileColumns?: number;
  viewMoreUrl?: string;
  viewMoreText?: string;
}

const MOBILE_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};
const DESKTOP_COLS: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

export function CollectionShowcase({
  sectionId,
  title,
  products,
  displayMode = "carrossel",
  desktopColumns = 4,
  mobileColumns = 2,
  viewMoreUrl,
  viewMoreText = "Ver Mais",
}: CollectionShowcaseProps) {
  if (products.length === 0) return null;

  const mobileCls = MOBILE_COLS[mobileColumns] ?? "grid-cols-2";
  const desktopCls = DESKTOP_COLS[desktopColumns] ?? "md:grid-cols-4";
  const gridClass = `grid gap-4 md:gap-5 ${mobileCls} ${desktopCls}`;

  return (
    <section
      data-ve-section={sectionId}
      data-ve-label={title}
      suppressHydrationWarning
      className="py-10"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl md:text-3xl font-black text-cat-black uppercase tracking-wide">
            {title}
          </h2>
          {viewMoreUrl && (
            <Link
              href={viewMoreUrl}
              className="text-sm font-semibold text-cat-yellow hover:text-cat-black transition-colors flex items-center gap-1"
            >
              {viewMoreText} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Product grid — card style depends on displayMode */}
        <div className={gridClass}>
          {products.map((product, i) =>
            displayMode === "carrossel" ? (
              <ShowcaseProductCard key={product.id} product={product} priority={i < desktopColumns} />
            ) : (
              <ProductCard key={product.id} product={product} priority={i < desktopColumns} />
            )
          )}
        </div>
      </div>
    </section>
  );
}
