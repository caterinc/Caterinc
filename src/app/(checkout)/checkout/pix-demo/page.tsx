"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Copy, Check, Loader2 } from "lucide-react";
import { formatPrice, copyToClipboard } from "@/lib/utils";

const FAKE_PIX = "00020126580014br.gov.bcb.pix0136a629534e-7693-4846-852d-1bbff817b5a8520400005303986540510.005802BR5925ZENYX INTERMEDIACOES LTD6009SAO PAULO62070503***6304E2CA";
const FAKE_TOTAL = 139.90;
const FAKE_ORDER = "CAT-1729999999-DEMO";

function PixIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,50 L32,23 Q50,4 68,23 Z"/>
      <path d="M50,50 L77,32 Q96,50 77,68 Z"/>
      <path d="M50,50 L68,77 Q50,96 32,77 Z"/>
      <path d="M50,50 L23,68 Q4,50 23,32 Z"/>
    </svg>
  );
}

export default function PixDemoPage() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await copyToClipboard(FAKE_PIX)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F5F5" }}>

      {/* Header */}
      <div className="bg-black py-3 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <span className="text-white font-black text-lg tracking-tight">
            CAT <span style={{ color: "#FFCD11" }}>Store</span>
          </span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#16c789" }} />
            <span>Compra segura</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4" style={{ backgroundColor: "#16c789" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                <PixIcon size={22} />
              </div>
              <div>
                <p className="text-white font-black text-base leading-tight">Pague com PIX</p>
                <p className="text-white/80 text-xs">Aprovação em segundos · Sem taxas</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 space-y-5">

            {/* Valor + timer */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-400 font-semibold">Pedido #{FAKE_ORDER}</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{formatPrice(FAKE_TOTAL)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Expira em</p>
                <p className="font-black text-base text-gray-900">09:47</p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "97%", backgroundColor: "#16c789" }} />
            </div>

            {/* QR Code falso (SVG placeholder) */}
            <div className="flex flex-col items-center">
              <div className="p-3 border-2 border-gray-100 rounded-2xl inline-block">
                <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
                  <rect width="192" height="192" fill="white"/>
                  {/* Finder pattern TL */}
                  <rect x="8" y="8" width="56" height="56" fill="black"/><rect x="16" y="16" width="40" height="40" fill="white"/><rect x="24" y="24" width="24" height="24" fill="black"/>
                  {/* Finder pattern TR */}
                  <rect x="128" y="8" width="56" height="56" fill="black"/><rect x="136" y="16" width="40" height="40" fill="white"/><rect x="144" y="24" width="24" height="24" fill="black"/>
                  {/* Finder pattern BL */}
                  <rect x="8" y="128" width="56" height="56" fill="black"/><rect x="16" y="136" width="40" height="40" fill="white"/><rect x="24" y="144" width="24" height="24" fill="black"/>
                  {/* Dados simulados */}
                  <rect x="72" y="8" width="8" height="8" fill="black"/><rect x="88" y="8" width="8" height="8" fill="black"/><rect x="104" y="8" width="8" height="8" fill="black"/><rect x="120" y="8" width="8" height="8" fill="black"/>
                  <rect x="72" y="24" width="8" height="8" fill="black"/><rect x="104" y="24" width="8" height="8" fill="black"/>
                  <rect x="80" y="40" width="8" height="8" fill="black"/><rect x="96" y="40" width="8" height="8" fill="black"/><rect x="112" y="40" width="8" height="8" fill="black"/>
                  <rect x="72" y="56" width="8" height="8" fill="black"/><rect x="88" y="56" width="8" height="8" fill="black"/><rect x="120" y="56" width="8" height="8" fill="black"/>
                  <rect x="8" y="72" width="8" height="8" fill="black"/><rect x="24" y="72" width="8" height="8" fill="black"/><rect x="48" y="72" width="8" height="8" fill="black"/><rect x="72" y="72" width="8" height="8" fill="black"/><rect x="88" y="72" width="8" height="8" fill="black"/><rect x="112" y="72" width="8" height="8" fill="black"/><rect x="136" y="72" width="8" height="8" fill="black"/><rect x="160" y="72" width="8" height="8" fill="black"/>
                  <rect x="8" y="88" width="8" height="8" fill="black"/><rect x="40" y="88" width="8" height="8" fill="black"/><rect x="64" y="88" width="8" height="8" fill="black"/><rect x="96" y="88" width="8" height="8" fill="black"/><rect x="128" y="88" width="8" height="8" fill="black"/><rect x="152" y="88" width="8" height="8" fill="black"/>
                  <rect x="16" y="104" width="8" height="8" fill="black"/><rect x="48" y="104" width="8" height="8" fill="black"/><rect x="80" y="104" width="8" height="8" fill="black"/><rect x="104" y="104" width="8" height="8" fill="black"/><rect x="136" y="104" width="8" height="8" fill="black"/><rect x="168" y="104" width="8" height="8" fill="black"/>
                  <rect x="8" y="120" width="8" height="8" fill="black"/><rect x="32" y="120" width="8" height="8" fill="black"/><rect x="56" y="120" width="8" height="8" fill="black"/><rect x="88" y="120" width="8" height="8" fill="black"/><rect x="112" y="120" width="8" height="8" fill="black"/><rect x="144" y="120" width="8" height="8" fill="black"/>
                  <rect x="72" y="128" width="8" height="8" fill="black"/><rect x="96" y="128" width="8" height="8" fill="black"/><rect x="120" y="128" width="8" height="8" fill="black"/><rect x="152" y="128" width="8" height="8" fill="black"/>
                  <rect x="80" y="144" width="8" height="8" fill="black"/><rect x="104" y="144" width="8" height="8" fill="black"/><rect x="128" y="144" width="8" height="8" fill="black"/><rect x="160" y="144" width="8" height="8" fill="black"/>
                  <rect x="72" y="160" width="8" height="8" fill="black"/><rect x="96" y="160" width="8" height="8" fill="black"/><rect x="136" y="160" width="8" height="8" fill="black"/><rect x="168" y="160" width="8" height="8" fill="black"/>
                  <rect x="80" y="176" width="8" height="8" fill="black"/><rect x="112" y="176" width="8" height="8" fill="black"/><rect x="144" y="176" width="8" height="8" fill="black"/>
                </svg>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">Abra o app do seu banco e escaneie</p>
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-semibold">ou copie o código</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Copia e cola */}
            <div>
              <p className="text-[11px] font-mono text-gray-400 break-all mb-3 bg-gray-50 rounded-lg p-3 line-clamp-2">{FAKE_PIX}</p>
              <button onClick={copy}
                className="w-full h-12 flex items-center justify-center gap-2 font-black text-sm rounded-xl transition-all active:scale-[0.98]"
                style={{ backgroundColor: copied ? "#111" : "#16c789", color: "#fff" }}>
                {copied ? <><Check className="w-4 h-4" /> Código copiado!</> : <><Copy className="w-4 h-4" /> Copiar código PIX</>}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Aguardando confirmação do pagamento...
            </div>
          </div>
        </div>

        {/* Como pagar */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Como pagar</p>
          <div className="space-y-3">
            {[
              { n: "1", t: "Abra o app do seu banco ou carteira digital" },
              { n: "2", t: "Escolha pagar via PIX com QR Code ou Copia e Cola" },
              { n: "3", t: "Confirme o valor e finalize o pagamento" },
            ].map(({ n, t }) => (
              <div key={n} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: "#16c789" }}>{n}</div>
                <p className="text-sm text-gray-600 pt-0.5">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CNPJ */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#16c789" }} />
            <div>
              <p className="text-xs font-black text-gray-700">Beneficiário do pagamento</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">ZENYX INTERMEDIAÇÕES LTDA</p>
              <p className="text-xs text-gray-400 mt-0.5">Os pagamentos são processados exclusivamente em nome deste CNPJ. Verifique no app do seu banco antes de confirmar.</p>
            </div>
          </div>
        </div>

        <div className="text-center pb-2">
          <p className="text-[11px] text-gray-400">
            Ambiente seguro · Processado pelo <span className="font-bold">Mercado Pago</span>
          </p>
          <Link href="/checkout" className="text-[11px] text-gray-300 underline mt-1 block">← Voltar ao checkout real</Link>
        </div>

      </div>
    </div>
  );
}
