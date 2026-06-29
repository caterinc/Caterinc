"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Truck, MessageCircle, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function PedidoConfirmadoPage() {
  const params = useParams();
  const orderNumber = String(params.orderNumber || "");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(orderNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
          Obrigado pela sua compra. Guarde o número do pedido abaixo.
        </p>

        {/* Order number card */}
        <div className="bg-white border-2 border-cat-yellow rounded-2xl p-5 mb-6 text-center shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Número do Pedido</p>
          <p className="text-3xl font-black text-gray-900 tracking-wide mb-3">{orderNumber}</p>
          <button
            onClick={copy}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar número"}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl border p-5 mb-4 space-y-4">
          <h2 className="font-black text-gray-900 text-base">O que acontece agora?</h2>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cat-yellow flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-cat-black" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Preparação do pedido</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Assim que o pagamento for confirmado, separamos seu calçado e embalamos com cuidado.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cat-yellow flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 text-cat-black" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Envio e rastreamento</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Após o envio, você receberá o código de rastreio por e-mail. Use-o para acompanhar a entrega nos Correios ou na transportadora.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cat-yellow flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-cat-black" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Dúvidas? Fale conosco</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Informe o número <span className="font-bold text-gray-700">{orderNumber}</span> ao entrar em contato pelo WhatsApp ou e-mail.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/produtos"
            className="w-full flex items-center justify-center py-3.5 rounded-xl font-black text-base bg-cat-yellow text-cat-black hover:brightness-95 transition-all"
          >
            Continuar comprando
          </Link>
          <Link
            href="/conta/pedidos"
            className="w-full flex items-center justify-center py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Ver meus pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
