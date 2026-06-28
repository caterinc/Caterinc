"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { QuickAddModal } from "./QuickAddModal";
import type { Product, Category } from "@/types";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number | null;
  image: string | null;
}

interface ProductCardProps {
  product: Product & { category?: Category | null; variants?: Variant[] };
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [variants, setVariants] = useState<Variant[]>(product.variants ?? []);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const image = product.images[0] || "/placeholder-product.jpg";
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const hasDiscount = comparePrice !== null && comparePrice > price;
  const discountPct = hasDiscount ? Math.round((1 - price / comparePrice!) * 100) : 0;
  const installment = price / 12;

  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Fetch variants if not already loaded
    if (variants.length === 0 && !loadingVariants) {
      setLoadingVariants(true);
      try {
        const res = await fetch(`/api/produtos/${product.id}`);
        const data = await res.json() as { variants?: Variant[] };
        setVariants(data.variants ?? []);
      } catch {
        // ignore — modal will show empty sizes
      }
      setLoadingVariants(false);
    }
    setShowModal(true);
  };

  return (
    <>
      <Link
        href={`/produtos/${product.slug}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300"
      >
        {/* Image area */}
        <div className="relative aspect-square bg-white overflow-hidden">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Discount badge */}
          {hasDiscount && (
            <span
              className="absolute top-3 left-3 flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg shadow-sm select-none"
              style={{
                backgroundColor: "var(--vep-badge-bg, #FFCD11)",
                color: "var(--vep-badge-text, #000000)",
              }}
            >
              ◆ {discountPct}% OFF
            </span>
          )}

          {/* Featured badge */}
          {product.isFeatured && !hasDiscount && (
            <span className="absolute top-3 left-3 flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg shadow-sm select-none bg-cat-yellow text-cat-black">
              ◆ Destaque
            </span>
          )}

          {/* Cart button — opens modal */}
          <button
            onClick={handleCartClick}
            aria-label="Adicionar ao carrinho"
            className="absolute top-3 right-3 w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:shadow-lg hover:scale-110 active:scale-95"
            style={{ backgroundColor: "var(--vep-quickadd-bg,#16c789)", color: "var(--vep-quickadd-text,#fff)" }}
          >
            {loadingVariants
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <ShoppingCart className="w-4 h-4" strokeWidth={2} />
            }
          </button>
        </div>

        {/* Info */}
        <div className="px-4 pt-3 pb-4 text-center">
          <h3 className="font-semibold text-cat-black text-sm leading-snug mb-3 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-baseline justify-center gap-2 flex-wrap">
            <span className="font-black text-lg text-cat-black">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">{formatPrice(comparePrice!)}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            em até{" "}
            <strong className="font-semibold text-gray-600">12x de {formatPrice(installment)}</strong>
          </p>
        </div>
      </Link>

      {showModal && (
        <QuickAddModal
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price,
            comparePrice,
            images: product.images,
          }}
          variants={variants}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
