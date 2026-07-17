"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ProductGallery } from "./ProductGallery";
import { ProductPurchase } from "./ProductPurchase";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number | null;
  images: string[];
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
}

interface Props {
  product: ProductData;
  variants: Variant[];
  sizes: string[];
  discountPct: number;
  pixDiscountPct: number;
  infoBefore?: ReactNode;
  infoAfter?: ReactNode;
}

export function ProductPageClient({
  product, variants, sizes, discountPct, pixDiscountPct, infoBefore, infoAfter,
}: Props) {
  const searchParams = useSearchParams();
  const isMirror = searchParams.get("__mirror") === "1";

  useEffect(() => {
    if (isMirror) return;
    try {
      const fbc = localStorage.getItem("_fbc") || undefined;
      const fbp = localStorage.getItem("_fbp") || undefined;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "ViewContent",
          productId: product.id,
          productName: product.name,
          value: product.price,
          fbc, fbp,
        }),
      }).catch(() => {});
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, product.price, product.name]);

  // Map color → images array (first variant per color wins)
  const colorImagesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const v of variants) {
      if (v.color && !map[v.color] && v.images.length > 0) {
        map[v.color] = v.images;
      }
    }
    return map;
  }, [variants]);

  // First swatch image per color (for color button thumbnails)
  const colorSwatchMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const v of variants) {
      if (v.color && !map[v.color]) {
        map[v.color] = v.images[0] ?? null;
      }
    }
    return map;
  }, [variants]);

  const firstColor = variants.find((v) => v.color)?.color || "";
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(firstColor);

  // Images shown in gallery: color-specific if available, else product.images
  const displayImages = useMemo(() => {
    const imgs = selectedColor ? (colorImagesMap[selectedColor] ?? []) : [];
    if (imgs.length > 0) return imgs;
    return product.images.length > 0 ? product.images : ["/placeholder-product.jpg"];
  }, [selectedColor, colorImagesMap, product.images]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setActiveIndex(0); // reset gallery to first image when switching color
  };

  const handleIndexChange = (i: number) => {
    setActiveIndex(i);
    if (!isMirror) {
      try {
        window.dispatchEvent(new CustomEvent("cs:gallery", {
          detail: { index: i, total: displayImages.length, productName: product.name },
        }));
      } catch {}
    }
  };

  // Mirror mode: admin's live view can jump the gallery to match the real session
  useEffect(() => {
    function onMirrorIndex(e: Event) {
      const idx = (e as CustomEvent).detail?.index;
      if (typeof idx === "number" && idx >= 0 && idx < displayImages.length) {
        setActiveIndex(idx);
      }
    }
    window.addEventListener("cs:mirror-index", onMirrorIndex as EventListener);
    return () => window.removeEventListener("cs:mirror-index", onMirrorIndex as EventListener);
  }, [displayImages.length]);

  return (
    <>
      {/* Column 1: Gallery */}
      <ProductGallery
        images={displayImages}
        productName={product.name}
        discountPct={discountPct}
        activeIndex={activeIndex}
        onIndexChange={handleIndexChange}
      />

      {/* Column 2: Info + Purchase */}
      <div className="space-y-4 min-w-0 overflow-x-hidden">
        {infoBefore}
        <ProductPurchase
          product={product}
          variants={variants}
          sizes={sizes}
          pixDiscountPct={pixDiscountPct}
          selectedColorProp={selectedColor}
          colorSwatchMap={colorSwatchMap}
          onColorSelect={handleColorSelect}
        />
        {infoAfter}
      </div>
    </>
  );
}
