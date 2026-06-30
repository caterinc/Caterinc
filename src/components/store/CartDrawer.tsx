"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Minus, ShoppingBag, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { state, dispatch, total } = useCart();
  const { items, isOpen } = state;
  const [showAdded, setShowAdded] = useState(false);
  const prevItemCount = useRef(items.reduce((s, i) => s + i.quantity, 0));
  const [freeShippingAbove, setFreeShippingAbove] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((methods: { freeAbove: number | null }[]) => {
        const thresholds = methods.map((m) => m.freeAbove).filter((v): v is number => v !== null);
        if (thresholds.length > 0) setFreeShippingAbove(Math.min(...thresholds));
      })
      .catch(() => {});
  }, []);

  // Show brief "added" banner when item count increases
  const currentItemCount = items.reduce((s, i) => s + i.quantity, 0);
  useEffect(() => {
    if (currentItemCount > prevItemCount.current) {
      setShowAdded(true);
      const t = setTimeout(() => setShowAdded(false), 2200);
      prevItemCount.current = currentItemCount;
      return () => clearTimeout(t);
    }
    prevItemCount.current = currentItemCount;
  }, [currentItemCount]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={() => dispatch({ type: "CLOSE_DRAWER" })}
        style={{ touchAction: "none" }}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-[61] shadow-2xl flex flex-col"
        style={{
          width: "min(100vw, 26rem)",
          backgroundColor: "var(--vep-drawer-bg, #ffffff)",
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-4 flex items-center justify-between flex-shrink-0"
          style={{
            backgroundColor: "var(--vep-drawer-header-bg, #000000)",
            color: "var(--vep-drawer-header-text, #ffffff)",
          }}
        >
          <h2 className="font-bold text-base flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Carrinho ({items.length})
          </h2>
          <button
            onClick={() => dispatch({ type: "CLOSE_DRAWER" })}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {showAdded && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 mb-3 transition-all">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Produto adicionado
            </div>
          )}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center px-4">
              <ShoppingBag className="w-14 h-14 mb-3 text-gray-200" />
              <p className="text-base font-semibold text-gray-500">Carrinho vazio</p>
              <p className="text-sm mt-1 mb-6 text-gray-400">Adicione produtos para continuar</p>
              <button
                onClick={() => dispatch({ type: "CLOSE_DRAWER" })}
                className="px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                style={{
                  backgroundColor: "var(--vep-drawer-btn-bg, #FFCD11)",
                  color: "var(--vep-drawer-btn-text, #000000)",
                }}
              >
                Ver Produtos
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white border">
                    <Image
                      src={item.image || "/placeholder-product.jpg"}
                      alt={item.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">
                      {item.name}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.color && (
                        <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md">
                          {item.color}
                        </span>
                      )}
                      {item.size && (
                        <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md">
                          Tam {item.size}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg p-0.5">
                        <button
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_QUANTITY",
                              payload: { id: item.id, quantity: Math.max(0, item.quantity - 1) },
                            })
                          }
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_QUANTITY",
                              payload: { id: item.id, quantity: item.quantity + 1 },
                            })
                          }
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                          aria-label="Remover"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3 flex-shrink-0 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Subtotal</span>
              <span className="font-black text-lg text-gray-900">{formatPrice(total)}</span>
            </div>
            {freeShippingAbove !== null && total < freeShippingAbove && (
              <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                Falta <strong>{formatPrice(freeShippingAbove - total)}</strong> para frete grátis!
              </div>
            )}
            {freeShippingAbove !== null && total >= freeShippingAbove && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-2.5 rounded-lg font-semibold">
                🎉 Você ganhou frete grátis!
              </div>
            )}
            <Link
              href="/carrinho"
              onClick={() => dispatch({ type: "CLOSE_DRAWER" })}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-black text-sm transition-all active:scale-[0.98] shadow-sm"
              style={{
                backgroundColor: "var(--vep-drawer-btn-bg, #FFCD11)",
                color: "var(--vep-drawer-btn-text, #000000)",
              }}
            >
              Ir ao Carrinho →
            </Link>
            <button
              onClick={() => dispatch({ type: "CLOSE_DRAWER" })}
              className="w-full flex items-center justify-center py-2.5 px-6 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
            >
              Continuar comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
