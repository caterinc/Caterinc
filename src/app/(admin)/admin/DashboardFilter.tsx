"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Calendar } from "lucide-react";

const PERIODS = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "7d", label: "7 dias" },
  { key: "month", label: "Este mês" },
  { key: "lastmonth", label: "Mês passado" },
  { key: "custom", label: "Personalizado" },
];

export default function DashboardFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("period") || "today";
  const [showCustom, setShowCustom] = useState(current === "custom");
  const [from, setFrom] = useState(sp.get("from") || "");
  const [to, setTo] = useState(sp.get("to") || "");

  function select(key: string) {
    if (key === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    router.push(`/admin?period=${key}`);
  }

  function applyCustom() {
    if (!from || !to) return;
    router.push(`/admin?period=custom&from=${from}&to=${to}`);
    setShowCustom(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7b7fa3" }} />
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => select(p.key)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={
            current === p.key || (p.key === "custom" && current === "custom")
              ? { background: "linear-gradient(135deg, #4c37e8, #6c52ff)", color: "white" }
              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }
          }
        >
          {p.label}
        </button>
      ))}
      {showCustom && (
        <div className="flex flex-wrap items-center gap-2 w-full mt-1">
          <input
            type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
          />
          <span className="text-xs" style={{ color: "#7b7fa3" }}>até</span>
          <input
            type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
          />
          <button
            onClick={applyCustom}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #4c37e8, #6c52ff)" }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
