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
        className="w-full flex items-center justify-center gap-2 text-white text-sm font-bold py-2.5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #4c37e8, #6c52ff)" }}
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
            className="rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            style={{ background: "#16132e", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4" style={{ color: "#a78bfa" }} />
                <span className="font-black text-white text-sm">Testar Adquirente PIX</span>
              </div>
              <button onClick={() => setResult(null)} className="transition-colors" style={{ color: "#7b7fa3" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-3xl font-black text-white">R$&nbsp;5,50</p>
                {result.merchantName && (
                  <p className="text-xs mt-1" style={{ color: "#7b7fa3" }}>Beneficiário: <span className="text-white font-semibold">{result.merchantName}</span></p>
                )}
              </div>
              <div className="flex justify-center">
                <div className="p-3 rounded-xl inline-block" style={{ background: "white" }}>
                  <img src={`data:image/png;base64,${result.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48" />
                </div>
              </div>
              <p className="text-xs text-center" style={{ color: "#7b7fa3" }}>Escaneie com o app do banco para testar</p>
              <button onClick={copy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {copied ? <><Check className="w-4 h-4" style={{ color: "#22d3a0" }} /><span style={{ color: "#22d3a0" }}>Copiado!</span></> : <><Copy className="w-4 h-4" /> Copiar código PIX</>}
              </button>
              <p className="text-xs text-center" style={{ color: "#7b7fa3" }}>Este PIX é apenas para teste — não cria pedido</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
