"use client";

import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, X, ShoppingBag, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CarrinhoPage() {
  const router = useRouter();
  const { state, dispatch, total, itemCount, isHydrated } = useCart();
  const { items } = state;
  const [freeAbove, setFreeAbove] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((methods: { freeAbove: number | null }[]) => {
        const thresholds = methods.map((m) => m.freeAbove).filter((v): v is number => v !== null);
        if (thresholds.length > 0) setFreeAbove(Math.min(...thresholds));
      })
      .catch(() => {});
  }, []);

  const freeShipping = freeAbove !== null && total >= freeAbove;
  const shipping = freeShipping ? 0 : 29.9;

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-cat-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-6 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-200" />
        <div>
          <h2 className="text-xl font-black text-gray-800">Carrinho vazio</h2>
          <p className="text-sm text-gray-500 mt-1">Adicione produtos para continuar.</p>
        </div>
        <Link href="/produtos" className="px-6 py-3 bg-cat-black text-white font-bold text-sm rounded-xl">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-xl text-cat-black flex-1">
          Carrinho <span className="text-gray-400 font-normal text-base">({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
        </h1>
      </div>

      {/* Items — compact list */}
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 bg-white rounded-2xl border p-3 items-center">
            <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border">
              <Image src={item.image || "/placeholder-product.jpg"} alt={item.name} fill className="object-contain p-1" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.name}</p>
              {(item.color || item.size) && (
                <p className="text-xs text-gray-400">
                  {[item.color, item.size && `Tam ${item.size}`].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                  <button
                    onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: item.quantity - 1 } })}
                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-l-lg transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: item.quantity + 1 } })}
                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-r-lg transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
              </div>
            </div>
            <button
              onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
              className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Frete grátis progress */}
      {freeAbove !== null && !freeShipping && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-3 text-xs text-amber-800">
          Falta <strong>{formatPrice(freeAbove - total)}</strong> para frete grátis!
        </div>
      )}
      {freeShipping && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-3 text-xs text-green-700 font-semibold">
          🎉 Você ganhou frete grátis!
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-2xl border p-4 mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Frete estimado</span>
            <span className={shipping === 0 ? "text-green-600 font-semibold" : ""}>
              {shipping === 0 ? "Grátis" : formatPrice(shipping)}
            </span>
          </div>
          <div className="flex justify-between font-black text-base border-t pt-2 mt-2">
            <span>Total</span><span>{formatPrice(total + shipping)}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/checkout"
        prefetch
        className="block w-full h-14 font-black text-base rounded-2xl mb-3 flex items-center justify-center"
        style={{ backgroundColor: "var(--vep-cart-page-btn-bg,#FFCD11)", color: "var(--vep-cart-page-btn-text,#000)" }}
      >
        Finalizar pedido →
      </Link>
      <Link href="/produtos" className="block w-full h-11 flex items-center justify-center border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors">
        Continuar comprando
      </Link>
    </div>
  );
}
