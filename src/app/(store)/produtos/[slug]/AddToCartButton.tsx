"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";

interface Props {
  product: Product & { variants: ProductVariant[] };
  sizes: string[];
  colors: string[];
}

export function AddToCartButton({ product, sizes, colors }: Props) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] || "");
  const { dispatch } = useCart();

  const selectedVariant = product.variants.find(
    (v) =>
      v.size === selectedSize &&
      (colors.length === 0 || v.color === selectedColor)
  );

  const handleAdd = () => {
    if (!selectedSize) {
      toast({ title: "Selecione um tamanho", variant: "destructive" });
      return;
    }
    if (!selectedVariant) {
      toast({ title: "Combinação indisponível", variant: "destructive" });
      return;
    }
    if (selectedVariant.stock === 0) {
      toast({ title: "Produto sem estoque", variant: "destructive" });
      return;
    }

    const cartItemId = `${product.id}-${selectedVariant.id}`;
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: cartItemId,
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        price: selectedVariant.price
          ? Number(selectedVariant.price)
          : Number(product.price),
        image: product.images[0] || "",
        size: selectedVariant.size,
        color: selectedVariant.color || "",
        quantity: 1,
        slug: product.slug,
      },
    });

    toast({ title: "Adicionado ao carrinho!", variant: "success" });
  };

  return (
    <div className="space-y-4">
      {/* Color picker */}
      {colors.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">
            Cor: <span className="font-normal text-gray-600">{selectedColor}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded border-2 transition-all",
                  selectedColor === color
                    ? "border-cat-black bg-cat-black text-white"
                    : "border-gray-300 hover:border-cat-black"
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size picker */}
      <div>
        <p className="text-sm font-semibold mb-2">
          Tamanho: <span className="font-normal text-gray-600">{selectedSize || "Selecione"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const variant = product.variants.find(
              (v) => v.size === size && (colors.length === 0 || v.color === selectedColor)
            );
            const outOfStock = !variant || variant.stock === 0;

            return (
              <button
                key={size}
                onClick={() => !outOfStock && setSelectedSize(size)}
                disabled={outOfStock}
                className={cn(
                  "w-12 h-12 text-sm rounded border-2 font-semibold transition-all",
                  outOfStock
                    ? "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                    : selectedSize === size
                    ? "border-cat-black bg-cat-black text-white"
                    : "border-gray-300 hover:border-cat-black"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <Button size="xl" className="w-full" onClick={handleAdd}>
        <ShoppingCart className="w-5 h-5 mr-2" />
        Adicionar ao Carrinho
      </Button>

      {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
        <p className="text-sm text-red-500 font-medium">
          Últimas {selectedVariant.stock} unidades!
        </p>
      )}
    </div>
  );
}
