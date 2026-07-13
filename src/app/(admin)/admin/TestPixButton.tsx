"use client";

import { useState } from "react";
import { Loader2, X, Copy, Check, Zap, QrCode } from "lucide-react";

interface PixResult {
  qrCode: string;
  qrCodeBase64: string;
  merchantName: string;
  amount: number;
}

export default function TestPixButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PixResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/test-pix", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar PIX");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.qrCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <>
      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-cat-black text-white text-sm font-bold py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {loading ? "Gerando..." : "Gerar PIX R$5,50"}
      </button>

      {error && (
        <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
      )}

      {/* Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setResult(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cat-black" />
                <span className="font-black text-cat-black">Testar Adquirente PIX</span>
              </div>
              <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-2xl font-black text-cat-black">R$&nbsp;5,50</p>
                {result.merchantName && (
                  <p className="text-xs text-gray-500 mt-1">Beneficiário: <span className="font-semibold">{result.merchantName}</span></p>
                )}
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-3 border-2 border-gray-100 rounded-xl inline-block">
                  <img
                    src={`data:image/png;base64,${result.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-52 h-52"
                  />
                </div>
              </div>

              <p className="text-xs text-center text-gray-400">Escaneie com o app do banco para testar</p>

              {/* Copy button */}
              <button
                onClick={copy}
                className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? <><Check className="w-4 h-4 text-green-500" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar código PIX</>}
              </button>

              <p className="text-xs text-center text-gray-400">
                Este PIX é apenas para teste — não cria pedido no sistema
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
