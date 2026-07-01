"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function CheckPaymentsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function check() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron/check-payments");
      const data = await res.json() as { checked: number; confirmed: number };
      if (data.confirmed > 0) {
        setResult(`✅ ${data.confirmed} venda(s) confirmada(s) e enviadas ao UTMify!`);
      } else {
        setResult(`Verificado ${data.checked} pedido(s) — nenhum novo pagamento encontrado.`);
      }
    } catch {
      setResult("Erro ao verificar pagamentos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={check}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-sm py-2.5 px-4 rounded-lg transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Verificando..." : "Verificar Pagamentos MP"}
      </button>
      {result && (
        <p className="text-xs text-gray-700 bg-gray-100 rounded-lg px-3 py-2">{result}</p>
      )}
    </div>
  );
}
