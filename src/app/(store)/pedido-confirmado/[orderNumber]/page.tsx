"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Copy, Check, Truck, Package, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { copyToClipboard } from "@/lib/utils";

export default function PedidoConfirmadoPage() {
  const params = useParams();
  const orderNumber = String(params.orderNumber || "");
  const [copied, setCopied] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/rastreio?numero=${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((d: { trackingCode?: string }) => { if (d.trackingCode) setTrackingCode(d.trackingCode); })
      .catch(() => {});
  }, [orderNumber]);

  const copy = async () => {
    if (await copyToClipboard(trackingCode || orderNumber)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-center text-gray-900 mb-1">Pedido confirmado!</h1>
        <p className="text-sm text-center text-gray-500 mb-8">
          Obrigado pela sua compra. Guarde o código abaixo para acompanhar seu pedido.
        </p>

        {/* Tracking code — the main code the customer uses */}
        <div className="bg-white border-2 border-cat-yellow rounded-2xl p-5 mb-6 text-center shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Seu Código de Rastreio
          </p>
          <p className="text-3xl font-black text-gray-900 tracking-widest mb-1">
            {trackingCode || orderNumber}
          </p>
          <p className="text-xs text-gray-400 mb-4">use este código para acompanhar seu pedido</p>
          <button
            onClick={copy}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar código"}
          </button>
        </div>

        {/* How to track — explaining the truck icon */}
        <div className="bg-white rounded-2xl border p-5 mb-6 space-y-4">
          <h2 className="font-black text-gray-900 text-base">Como acompanhar seu pedido</h2>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cat-yellow flex items-center justify-center flex-shrink-0 text-cat-black font-black text-sm">
              1
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                Clique no ícone <Truck className="w-4 h-4 inline text-cat-black" /> no topo da página
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                O caminhão fica no canto superior direito em qualquer página da loja.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cat-yellow flex items-center justify-center flex-shrink-0 text-cat-black font-black text-sm">
              2
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Digite o código de rastreio</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Cole o código <span className="font-bold text-gray-700">{trackingCode || orderNumber}</span> no campo de busca e clique em Rastrear.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cat-yellow flex items-center justify-center flex-shrink-0 text-cat-black font-black text-sm">
              3
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 inline text-gray-600" /> Acompanhe cada etapa
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Veja em tempo real desde a preparação até a entrega na sua casa.
              </p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-2xl border p-4 mb-6 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Precisou de ajuda?</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Fale conosco pelo WhatsApp informando o código{" "}
              <span className="font-bold text-gray-700">{trackingCode || orderNumber}</span>.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/rastreio"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-base bg-cat-yellow text-cat-black hover:brightness-95 transition-all"
          >
            <Truck className="w-5 h-5" />
            Rastrear meu pedido
          </Link>
          <Link
            href="/produtos"
            className="w-full flex items-center justify-center py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
