import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";
import { ProductPageClient } from "./ProductPageClient";
import { ProductReviews, ReviewsSummaryBadge } from "./ProductReviews";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: `${product.name} | CAT Store`,
    description: product.description || undefined,
    openGraph: {
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  // Load product page visual settings
  const vppRaw = await prisma.siteSetting.findUnique({ where: { key: "ve_product_page" } });
  const vpp: Record<string, string> = vppRaw
    ? JSON.parse(vppRaw.value || "{}") : {};

  const product = await prisma.product.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      category: true,
      variants: { orderBy: { size: "asc" } },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) notFound();

  // Related products — same category, excluding self, max 6
  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.categoryId || undefined,
      NOT: { id: product.id },
    },
    select: { id: true, name: true, slug: true, price: true, images: true, variants: { select: { stock: true } } },
    orderBy: { order: "asc" },
    take: 6,
  });

  const sizes = Array.from(new Set(product.variants.map((v) => v.size))).sort(
    (a, b) => parseFloat(a) - parseFloat(b)
  );
  const colors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))) as string[];
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const hasDiscount = comparePrice !== null && comparePrice > price;
  const discountPct = hasDiscount ? Math.round((1 - price / comparePrice!) * 100) : 0;

  const reviewProps = product.reviews.map((r) => ({
    id: r.id,
    reviewerName: r.reviewerName,
    rating: r.rating,
    comment: r.comment,
    verifiedPurchase: r.verifiedPurchase,
    createdAt: r.createdAt,
  }));

  // Parse description for bullet points (lines starting with • or -)
  const descLines = (product.description || "").split("\n").filter(Boolean);
  const bullets = descLines.filter((l) => l.startsWith("•") || l.startsWith("-"));
  const prose = descLines.filter((l) => !l.startsWith("•") && !l.startsWith("-"));

  const pageStyle = {
    "--vep-page-bg":     vpp.pageBgColor   || "#F5F5F5",
    "--vep-cart-bg":     vpp.cartBg        || "#FFCD11",
    "--vep-cart-text":   vpp.cartText      || "#000000",
    "--vep-buynow-bg":   vpp.buyNowBg      || "#000000",
    "--vep-buynow-text": vpp.buyNowText    || "#FFFFFF",
    "--vep-price-color": vpp.priceColor    || "#000000",
    "--vep-badge-bg":    vpp.badgeBg       || "#EF4444",
    "--vep-badge-text":  vpp.badgeText     || "#FFFFFF",
    "--vep-shipping-bg": vpp.shippingBg    || "#F0FDF4",
    "--vep-reviews-bg":  vpp.reviewsBg     || "#F9FAFB",
    backgroundColor:     vpp.pageBgColor   || "#F5F5F5",
  } as React.CSSProperties;

  return (
    <div data-ve-section="product-page" data-ve-label="Página do Produto" suppressHydrationWarning data-ve-page="produto" style={pageStyle} className="min-h-screen">
    <div className="max-w-6xl mx-auto px-4 py-6 overflow-x-hidden">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-5 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-cat-black transition-colors">Início</Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-cat-black transition-colors">Produtos</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/produtos?categoria=${product.category.slug}`} className="hover:text-cat-black transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-cat-black font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-14 mb-16 min-w-0">
        <ProductPageClient
          product={{ id: product.id, name: product.name, slug: product.slug, price, comparePrice, images: product.images }}
          variants={product.variants.map((v) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            stock: v.stock,
            price: v.price != null ? parseFloat(v.price.toString()) : null,
            images: (v as { images?: string[] }).images ?? [],
          }))}
          sizes={sizes}
          discountPct={discountPct}
          infoBefore={
            <>
              {product.category && (
                <Link
                  href={`/produtos?categoria=${product.category.slug}`}
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-cat-black transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="text-3xl font-black text-cat-black leading-tight break-words">{product.name}</h1>
              {reviewProps.length > 0 && <ReviewsSummaryBadge reviews={reviewProps} />}
            </>
          }
          infoAfter={
            <>
              {product.description && (
                <div className="border-t pt-5">
                  <h3 className="font-bold text-cat-black mb-3">Sobre o produto</h3>
                  {prose.length > 0 && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{prose.join(" ")}</p>
                  )}
                  {bullets.length > 0 && (
                    <ul className="space-y-1.5">
                      {bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-cat-yellow font-black mt-0.5">✓</span>
                          <span>{b.replace(/^[•\-]\s*/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          }
        />
      </div>

      {/* Reviews */}
      <ProductReviews reviews={reviewProps} productName={product.name} />

      {/* Related products */}
      {related.length > 0 && (
        <div className="py-12 border-t">
          <h2 className="text-2xl font-black text-cat-black mb-6">Você também pode gostar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {related.map((rel) => (
              <Link
                key={rel.id}
                href={`/produtos/${rel.slug}`}
                className="group block"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white border group-hover:border-cat-black transition-colors mb-2">
                  <Image
                    src={rel.images[0] || "/placeholder-product.jpg"}
                    alt={rel.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-xs font-semibold text-cat-black line-clamp-2 leading-tight">{rel.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatPrice(Number(rel.price))}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
