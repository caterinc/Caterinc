"use client";

import { useState } from "react";
import { Loader2, X, Copy, Check, Zap, ChevronDown, ChevronUp } from "lucide-react";

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
  const [showQr, setShowQr] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);
    setShowQr(false);
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
        <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
      )}

      {/* Modal */}
      {result && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          onClick={() => setResult(null)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#12102a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <p className="font-black text-white text-sm">Código PIX gerado</p>
                {result.merchantName && (
                  <p className="text-[11px] mt-0.5" style={{ color: "#7b7fa3" }}>
                    Beneficiário: <span className="text-white">{result.merchantName}</span>
                  </p>
                )}
              </div>
              <button onClick={() => setResult(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" style={{ color: "#7b7fa3" }} />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(90dvh - 65px)" }}>
              {/* Amount */}
              <p className="text-3xl font-black text-white text-center">R$&nbsp;5,50</p>

              {/* COPY BUTTON — prominent, first */}
              <button
                onClick={copy}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black transition-all active:scale-[0.98]"
                style={
                  copied
                    ? { background: "rgba(34,211,160,0.15)", border: "1px solid rgba(34,211,160,0.4)", color: "#22d3a0" }
                    : { background: "linear-gradient(135deg, #4c37e8, #6c52ff)", color: "white" }
                }
              >
                {copied
                  ? <><Check className="w-4 h-4" /> Copiado! Cole no app do banco</>
                  : <><Copy className="w-4 h-4" /> Copiar código PIX</>
                }
              </button>

              {/* PIX code preview (truncated) */}
              <div
                className="px-3 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                onClick={copy}
              >
                <span className="text-[10px] flex-1 truncate font-mono" style={{ color: "#7b7fa3" }}>
                  {result.qrCode.slice(0, 60)}…
                </span>
                <Copy className="w-3 h-3 flex-shrink-0" style={{ color: "#7b7fa3" }} />
              </div>

              {/* QR Code — collapsible */}
              <button
                onClick={() => setShowQr((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ color: "#7b7fa3" }}
              >
                {showQr ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showQr ? "Ocultar QR Code" : "Mostrar QR Code"}
              </button>

              {showQr && (
                <div className="flex justify-center pb-1">
                  <div className="p-3 rounded-xl inline-block" style={{ background: "white" }}>
                    <img
                      src={`data:image/png;base64,${result.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-44 h-44"
                    />
                  </div>
                </div>
              )}

              <p className="text-[10px] text-center pb-1" style={{ color: "#4a4870" }}>
                Este PIX é apenas para teste — não cria pedido
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
