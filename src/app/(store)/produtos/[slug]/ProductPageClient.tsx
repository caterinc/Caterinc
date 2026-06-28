"use client";

import { useState, useMemo, type ReactNode } from "react";
import { ProductGallery } from "./ProductGallery";
import { ProductPurchase } from "./ProductPurchase";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number | null;
  image: string | null;
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
  infoBefore?: ReactNode; // category link, product name, reviews badge
  infoAfter?: ReactNode;  // description, tags
}

export function ProductPageClient({
  product, variants, sizes, discountPct, infoBefore, infoAfter,
}: Props) {
  // Build merged image list: variant images (one per color) first, then product images (deduped)
  const { allImages, colorToIndex, indexToColor } = useMemo(() => {
    const seen = new Set<string>();
    const colorImages: { color: string; image: string }[] = [];
    for (const v of variants) {
      if (v.color && v.image && !seen.has(v.color)) {
        seen.add(v.color);
        colorImages.push({ color: v.color, image: v.image });
      }
    }

    const variantImgUrls = colorImages.map((x) => x.image);
    const merged = [
      ...variantImgUrls,
      ...product.images.filter((img) => !variantImgUrls.includes(img)),
    ];
    const all = merged.length > 0 ? merged : ["/placeholder-product.jpg"];

    const c2i: Record<string, number> = {};
    const i2c: Record<number, string> = {};
    colorImages.forEach(({ color, image }) => {
      const idx = all.indexOf(image);
      if (idx >= 0) { c2i[color] = idx; i2c[idx] = color; }
    });

    return { allImages: all, colorToIndex: c2i, indexToColor: i2c };
  }, [product.images, variants]);

  // Initialize to first color so sizes are usable immediately
  const firstColor = variants.find((v) => v.color)?.color || "";
  const firstIndex = firstColor && colorToIndex[firstColor] !== undefined ? colorToIndex[firstColor] : 0;

  const [activeIndex, setActiveIndex] = useState(firstIndex);
  const [selectedColor, setSelectedColor] = useState<string>(firstColor);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (colorToIndex[color] !== undefined) setActiveIndex(colorToIndex[color]);
  };

  const handleIndexChange = (i: number) => {
    setActiveIndex(i);
    if (indexToColor[i]) setSelectedColor(indexToColor[i]);
  };

  return (
    <>
      {/* Column 1: Gallery */}
      <ProductGallery
        images={allImages}
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
          selectedColorProp={selectedColor}
          onColorSelect={handleColorSelect}
        />
        {infoAfter}
      </div>
    </>
  );
}
