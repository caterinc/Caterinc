"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Truck, RotateCcw, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number | null;
  images: string[];
}

interface ProductPurchaseProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    images: string[];
  };
  variants: Variant[];
  sizes: string[];
  selectedColorProp?: string;
  colorSwatchMap?: Record<string, string | null>;
  onColorSelect?: (color: string) => void;
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(value) ? "text-cat-yellow" : "text-gray-300"} style={{ fontSize: 14 }}>
          ★
        </span>
      ))}
    </div>
  );
}

export function ProductPurchase({ product, variants, sizes, selectedColorProp, colorSwatchMap, onColorSelect }: ProductPurchaseProps) {
  const router = useRouter();
  const { dispatch } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [internalColor, setInternalColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [showPayments, setShowPayments] = useState(false);

  // Color data: unique colors (swatch from colorSwatchMap or first variant image)
  const colorData = (() => {
    const seen = new Set<string>();
    const result: { color: string; swatch: string | null }[] = [];
    for (const v of variants) {
      if (v.color && !seen.has(v.color)) {
        seen.add(v.color);
        const swatch = colorSwatchMap?.[v.color] ?? v.images[0] ?? null;
        result.push({ color: v.color, swatch });
      }
    }
    return result;
  })();
  const hasColors = colorData.length > 0;

  // Use external color if provided (from ProductPageClient), otherwise internal
  const selectedColor = (selectedColorProp !== undefined && selectedColorProp !== "")
    ? selectedColorProp
    : (internalColor || colorData[0]?.color || "");

  const handleColorChange = (color: string) => {
    setInternalColor(color);
    setSelectedSize("");
    onColorSelect?.(color);
  };

  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && (!hasColors || v.color === selectedColor)
  );
  const price = selectedVariant?.price ? Number(selectedVariant.price) : product.price;

  const installmentPrice = price / 12;
  const pixPrice = price * 0.95;

  const isOutOfStock = (size: string) => {
    const v = variants.find((v) => v.size === size && (!hasColors || v.color === selectedColor));
    return !v || v.stock === 0;
  };

  const buildPayload = () => ({
    id: `${product.id}-${selectedVariant!.id}`,
    productId: product.id,
    variantId: selectedVariant!.id,
    name: product.name,
    price,
    image: product.images[0] || "",
    size: selectedVariant!.size,
    color: selectedVariant!.color || "",
    quantity,
    slug: product.slug,
  });

  const handleAddToCart = () => {
    if (!selectedSize) { toast({ title: "Selecione um tamanho", variant: "destructive" }); return; }
    if (!selectedVariant || selectedVariant.stock === 0) { toast({ title: "Produto sem estoque", variant: "destructive" }); return; }
    dispatch({ type: "ADD_ITEM", payload: buildPayload() });
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "AddToCart", {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: selectedVariant.price ?? product.price,
        currency: "BRL",
      });
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize) { toast({ title: "Selecione um tamanho", variant: "destructive" }); return; }
    if (!selectedVariant || selectedVariant.stock === 0) { toast({ title: "Produto sem estoque", variant: "destructive" }); return; }
    dispatch({ type: "ADD_ITEM", payload: buildPayload() });
    router.push("/checkout");
  };

  const installmentRows = [
    { n: 1, rate: 0, label: "à vista" },
    { n: 2, rate: 0 },
    { n: 3, rate: 0 },
    { n: 6, rate: 0 },
    { n: 10, rate: 0 },
    { n: 12, rate: 0 },
  ];

  return (
    <div className="space-y-5">
      {/* Price block */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="vep-price text-3xl font-black" style={{ color: "var(--vep-price-color, #000000)" }}>{formatPrice(price)}</span>
          {product.comparePrice && product.comparePrice > price && (
            <>
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
              <span className="vep-badge text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--vep-badge-bg, #EF4444)", color: "var(--vep-badge-text, #FFFFFF)" }}>
                -{Math.round((1 - price / product.comparePrice) * 100)}% OFF
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-600">
          em até <strong className="text-cat-black">12x de {formatPrice(installmentPrice)}</strong> sem juros
        </p>
        <p className="text-sm text-green-600 font-semibold">
          ou <strong>{formatPrice(pixPrice)}</strong> no PIX com 5% de desconto
        </p>
      </div>

      {/* Color selector */}
      {hasColors && (
        <div>
          <p className="text-sm font-bold text-cat-black mb-2">
            Cor: <span className="font-normal text-gray-600">{selectedColor}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {colorData.map(({ color, swatch }) => (
              <div key={color} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleColorChange(color)}
                  className={cn(
                    "transition-all rounded-xl overflow-hidden border-2",
                    swatch ? "w-16 h-16" : "px-3 py-1.5 text-sm font-medium",
                    selectedColor === color
                      ? "border-cat-black ring-2 ring-cat-black ring-offset-1"
                      : "border-gray-200 hover:border-gray-400"
                  )}
                  title={color}
                >
                  {swatch ? (
                    <img src={swatch} alt={color} className="w-full h-full object-cover bg-white" />
                  ) : (
                    <span className={selectedColor === color ? "text-cat-black" : "text-gray-700"}>{color}</span>
                  )}
                </button>
                {swatch && (
                  <span className="text-xs text-gray-600 font-medium max-w-[4rem] text-center truncate leading-tight">{color}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-cat-black">
            Tamanho: <span className="font-normal text-gray-600">{selectedSize || "Selecione"}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const oos = isOutOfStock(size);
            return (
              <button
                key={size}
                onClick={() => !oos && setSelectedSize(size)}
                disabled={oos}
                title={oos ? "Sem estoque" : size}
                className={cn(
                  "min-w-[3rem] h-11 px-2 text-sm rounded-lg border-2 font-semibold transition-all relative",
                  oos
                    ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                    : selectedSize === size
                    ? "border-cat-black bg-cat-black text-white shadow-sm"
                    : "border-gray-200 hover:border-cat-black text-gray-800"
                )}
              >
                {size}
                {oos && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-full h-px bg-gray-200 rotate-[-35deg] absolute" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
          <p className="mt-2 text-xs font-semibold text-orange-500">
            ⚡ Últimas {selectedVariant.stock} unidades!
          </p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <p className="text-sm font-bold text-cat-black mb-2">Quantidade</p>
        <div className="flex items-center border-2 border-gray-200 rounded-lg w-fit">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-cat-black hover:bg-gray-50 transition-colors text-lg font-bold"
          >
            −
          </button>
          <span className="w-10 text-center font-bold text-cat-black">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-10 h-10 flex items-center justify-center text-cat-black hover:bg-gray-50 transition-colors text-lg font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          className="vep-cart-btn w-full flex items-center justify-center gap-2 py-4 px-6 font-black text-base rounded-xl active:scale-[0.98] transition-all shadow-sm"
          style={{ backgroundColor: "var(--vep-cart-bg, #FFCD11)", color: "var(--vep-cart-text, #000000)" }}
        >
          <ShoppingCart className="w-5 h-5" />
          Adicionar ao Carrinho
        </button>
        <button
          onClick={handleBuyNow}
          className="vep-buynow-btn w-full flex items-center justify-center gap-2 py-4 px-6 font-black text-base rounded-xl active:scale-[0.98] transition-all"
          style={{ backgroundColor: "var(--vep-buynow-bg, #000000)", color: "var(--vep-buynow-text, #FFFFFF)" }}
        >
          <Zap className="w-5 h-5" />
          Comprar Agora
        </button>
      </div>

      {/* Shipping info */}
      <div className="vep-shipping-block border rounded-xl overflow-hidden divide-y text-sm">
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50">
          <Truck className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-700">Frete Grátis</p>
            <p className="text-xs text-green-600">Para todo o Brasil</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-lg flex-shrink-0">📦</span>
          <div>
            <p className="font-semibold text-gray-800">Envio em até 2 dias úteis</p>
            <p className="text-xs text-gray-500">Seu pedido será preparado com rapidez</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <RotateCcw className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Devolução garantida</p>
            <p className="text-xs text-gray-500">Dinheiro de volta em até 7 dias</p>
          </div>
        </div>
      </div>

      {/* Payment methods accordion */}
      <div className="border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowPayments((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-cat-black hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Ver formas de pagamento
          </div>
          {showPayments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showPayments && (
          <div className="px-4 pb-4 border-t text-sm">
            {/* PIX */}
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="font-bold text-green-700">PIX — 5% de desconto</p>
              <p className="text-green-600 font-semibold text-lg">{formatPrice(pixPrice)}</p>
              <p className="text-xs text-green-600">Aprovação imediata</p>
            </div>
            {/* Credit card */}
            <div className="mt-3">
              <p className="font-semibold text-gray-700 mb-2">Cartão de crédito (sem juros)</p>
              <table className="w-full text-xs text-gray-600">
                <tbody>
                  {installmentRows.map(({ n, label }) => (
                    <tr key={n} className="border-b last:border-0">
                      <td className="py-1.5 font-medium">{n}x {label || ""}</td>
                      <td className="py-1.5 text-right font-semibold text-cat-black">
                        {formatPrice(price / n)}
                      </td>
                      <td className="py-1.5 text-right text-gray-400">
                        {n > 1 ? `= ${formatPrice(price)}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
