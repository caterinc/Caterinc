"use client";

import { useCart } from "@/lib/cart-context";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface UpsellProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
}

export function UpsellProducts() {
  const { state } = useCart();
  const [products, setProducts] = useState<UpsellProduct[]>([]);

  useEffect(() => {
    const cartIds = new Set(state.items.map((i) => i.productId));
    fetch("/api/produtos?limit=20")
      .then((r) => r.json())
      .then((data: { products: UpsellProduct[] }) => {
        const filtered = (data.products || []).filter((p) => !cartIds.has(p.id));
        setProducts(filtered.slice(0, 8));
      })
      .catch(() => {});
  }, [state.items]);

  if (products.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="font-black text-sm uppercase tracking-widest text-gray-500 mb-3">
        Você também pode gostar
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {products.map((p) => {
          const img = p.images?.[0] || "/placeholder-product.jpg";
          const price = Number(p.price);
          const compare = p.comparePrice ? Number(p.comparePrice) : null;
          return (
            <Link
              key={p.id}
              href={`/produtos/${p.slug}`}
              className="flex-shrink-0 w-36 bg-white rounded-2xl border hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="relative w-full h-32 bg-gray-50">
                <Image src={img} alt={p.name} fill className="object-contain p-2" />
                {compare && compare > price && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    -{Math.round((1 - price / compare) * 100)}%
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-tight mb-1.5">
                  {p.name}
                </p>
                {compare && compare > price && (
                  <p className="text-[10px] text-gray-400 line-through">{formatPrice(compare)}</p>
                )}
                <p className="text-sm font-black text-gray-900">{formatPrice(price)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
