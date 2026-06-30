"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { QuickAddModal } from "./QuickAddModal";
interface Variant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number | null;
  images: string[];
}

interface CardProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number | { toNumber(): number };
  comparePrice: number | { toNumber(): number } | null;
  isFeatured: boolean;
  category?: unknown;
  variants?: Variant[];
}

interface ProductCardProps {
  product: CardProduct;
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
        className="group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
      >
        {/* Image area */}
        <div className="relative aspect-[4/3] bg-white overflow-hidden">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]"
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Discount badge */}
          {hasDiscount && (
            <span
              className="absolute top-2 left-2 flex items-center gap-0.5 text-[11px] font-black px-2 py-0.5 rounded-md shadow-sm select-none"
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
            <span className="absolute top-2 left-2 flex items-center gap-0.5 text-[11px] font-black px-2 py-0.5 rounded-md shadow-sm select-none bg-cat-yellow text-cat-black">
              ◆ Destaque
            </span>
          )}

          {/* Cart button — opens modal */}
          <button
            onClick={handleCartClick}
            aria-label="Adicionar ao carrinho"
            className="absolute top-2 right-2 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:shadow-lg hover:scale-110 active:scale-95"
            style={{ backgroundColor: "var(--vep-quickadd-bg,#16c789)", color: "var(--vep-quickadd-text,#fff)", outline: "2px solid var(--vep-quickadd-ring, transparent)", outlineOffset: "2px" }}
          >
            {loadingVariants
              ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
            }
          </button>
        </div>

        {/* Info */}
        <div className="px-3 pt-2 pb-3 text-center">
          <h3 className="font-semibold text-cat-black text-xs leading-snug mb-1.5 line-clamp-2 min-h-[2.2rem]">
            {product.name}
          </h3>
          <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
            <span className="font-black text-base text-cat-black">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(comparePrice!)}</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
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
