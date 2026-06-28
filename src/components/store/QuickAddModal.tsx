"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number | null;
  image: string | null;
}

interface QuickAddModalProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    images: string[];
  };
  variants: Variant[];
  onClose: () => void;
}

export function QuickAddModal({ product, variants, onClose }: QuickAddModalProps) {
  const { dispatch } = useCart();

  // Build unique colors with images
  const colorData = (() => {
    const seen = new Set<string>();
    const result: { color: string; image: string | null }[] = [];
    for (const v of variants) {
      if (v.color && !seen.has(v.color)) {
        seen.add(v.color);
        result.push({ color: v.color, image: v.image || null });
      }
    }
    return result;
  })();
  const hasColors = colorData.length > 0;
  const firstColor = colorData[0]?.color || "";

  const sizes = Array.from(new Set(variants.map((v) => v.size))).sort(
    (a, b) => parseFloat(a) - parseFloat(b)
  );

  const [selectedColor, setSelectedColor] = useState(firstColor);
  const [selectedSize, setSelectedSize] = useState("");
  const [imgIdx, setImgIdx] = useState(0);

  // Build image list: variant images first, then product images
  const images = (() => {
    const colorImgUrls: string[] = [];
    const seen = new Set<string>();
    for (const { color, image } of colorData) {
      if (image && !seen.has(color)) { seen.add(color); colorImgUrls.push(image); }
    }
    const extras = product.images.filter((img) => !colorImgUrls.includes(img));
    return [...colorImgUrls, ...extras].filter(Boolean);
  })();
  const displayImages = images.length > 0 ? images : ["/placeholder-product.jpg"];

  // Sync image to selected color
  useEffect(() => {
    const colorVariant = variants.find((v) => v.color === selectedColor && v.image);
    if (colorVariant?.image) {
      const idx = displayImages.indexOf(colorVariant.image);
      if (idx >= 0) setImgIdx(idx);
    }
  }, [selectedColor]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOutOfStock = (size: string) => {
    const v = variants.find((v) => v.size === size && (!hasColors || v.color === selectedColor));
    return !v || v.stock === 0;
  };

  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && (!hasColors || v.color === selectedColor)
  );
  const price = selectedVariant?.price ? Number(selectedVariant.price) : product.price;
  const comparePrice = product.comparePrice;
  const hasDiscount = comparePrice !== null && comparePrice !== undefined && comparePrice > price;

  const handleAdd = useCallback(() => {
    if (!selectedSize) { toast({ title: "Selecione um tamanho", variant: "destructive" }); return; }
    if (!selectedVariant || selectedVariant.stock === 0) { toast({ title: "Sem estoque", variant: "destructive" }); return; }
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: `${product.id}-${selectedVariant.id}`,
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        price,
        image: displayImages[0] || "",
        size: selectedVariant.size,
        color: selectedVariant.color || "",
        quantity: 1,
        slug: product.slug,
      },
    });
    toast({ title: "Adicionado ao carrinho!", variant: "success" });
    onClose();
  }, [selectedSize, selectedVariant, price, product, displayImages, dispatch, onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image + info row */}
        <div className="flex gap-4 p-4 pb-3 border-b">
          {/* Image carousel */}
          <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border">
            <Image
              src={displayImages[imgIdx] || "/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-contain p-1"
            />
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + displayImages.length) % displayImages.length)}
                  className="absolute left-0.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center shadow"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % displayImages.length)}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center shadow"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </>
            )}
          </div>

          {/* Name + price */}
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-3">{product.name}</h3>
            <div className="flex items-baseline gap-2 mt-2 flex-wrap">
              <span className="text-xl font-black text-cat-black">{formatPrice(price)}</span>
              {hasDiscount && comparePrice && (
                <span className="text-sm text-gray-400 line-through">{formatPrice(comparePrice)}</span>
              )}
            </div>
            {hasDiscount && comparePrice && (
              <span className="inline-block text-xs font-black bg-cat-yellow text-cat-black px-2 py-0.5 rounded-full mt-1">
                {Math.round((1 - price / comparePrice) * 100)}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Selectors */}
        <div className="overflow-y-auto p-4 space-y-5 flex-1">
          {/* Color */}
          {hasColors && (
            <div>
              <p className="text-sm font-bold text-cat-black mb-2">
                Cor: <span className="font-semibold text-cat-black">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {colorData.map(({ color, image }) => (
                  <button
                    key={color}
                    onClick={() => { setSelectedColor(color); setSelectedSize(""); }}
                    className={cn(
                      "transition-all rounded-xl overflow-hidden border-2",
                      image ? "w-14 h-14" : "px-3 py-1.5 text-sm font-medium",
                      selectedColor === color
                        ? "border-cat-black ring-2 ring-cat-black ring-offset-1"
                        : "border-gray-200 hover:border-gray-400"
                    )}
                    title={color}
                  >
                    {image ? (
                      <img src={image} alt={color} className="w-full h-full object-cover bg-white" />
                    ) : (
                      <span className={selectedColor === color ? "text-cat-black font-bold" : "text-gray-700"}>{color}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          <div>
            <p className="text-sm font-bold text-cat-black mb-2">
              Tamanho: {selectedSize
                ? <span className="font-bold text-cat-black"> {selectedSize}</span>
                : <span className="font-normal text-gray-400"> Selecione</span>
              }
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const oos = isOutOfStock(size);
                return (
                  <button
                    key={size}
                    onClick={() => !oos && setSelectedSize(size)}
                    disabled={oos}
                    className={cn(
                      "min-w-[2.8rem] h-10 px-2 text-sm rounded-lg border-2 font-semibold transition-all relative",
                      oos
                        ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                        : selectedSize === size
                        ? "border-cat-black bg-cat-black text-white"
                        : "border-gray-200 hover:border-cat-black text-gray-800"
                    )}
                  >
                    {size}
                    {oos && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-px bg-gray-200 rotate-[-35deg] absolute" /></span>}
                  </button>
                );
              })}
            </div>
            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
              <p className="mt-2 text-xs font-semibold text-orange-500">⚡ Últimas {selectedVariant.stock} unidades!</p>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t bg-white">
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-base transition-all active:scale-[0.98]"
            style={{ backgroundColor: "var(--vep-cart-bg, #FFCD11)", color: "var(--vep-cart-text, #000000)" }}
          >
            <ShoppingCart className="w-5 h-5" />
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
