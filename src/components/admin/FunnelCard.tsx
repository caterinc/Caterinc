"use client";

import { useState, useEffect, useCallback } from "react";

type Period = "today" | "yesterday" | "7d" | "month" | "lastmonth";

interface FunnelData {
  sessions: number;
  product: number;
  cart: number;
  checkout: number;
  paid: number;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "7d", label: "7 dias" },
  { key: "month", label: "Este mês" },
  { key: "lastmonth", label: "Mês passado" },
];

const STAGE_COLORS = ["#4c37e8", "#5a45ef", "#7060ff", "#3b8ef8", "#22d3a0"];

function stepColor(pct: number) {
  if (pct >= 50) return "#22d3a0";
  if (pct >= 20) return "#fbbf24";
  return "#f87171";
}

function FunnelShape({ stages }: { stages: { label: string; count: number }[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  const VH = 130;
  const VW = 500;
  const CY = VH / 2;
  const SW = VW / stages.length;
  const MAX_H = VH - 10;

  const heights = stages.map((s) => Math.max((s.count / max) * MAX_H, 4));

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full"
      style={{ height: 100 }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="funnel-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4c37e8" />
          <stop offset="60%" stopColor="#6c52ff" />
          <stop offset="100%" stopColor="#22d3a0" />
        </linearGradient>
        <linearGradient id="funnel-fill-d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <filter id="funnel-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {stages.map((_, i) => {
        const x1 = i * SW;
        const x2 = (i + 1) * SW;
        const lH = heights[i];
        const rH = i < stages.length - 1 ? heights[i + 1] : heights[i];
        const d = [
          `M ${x1} ${CY - lH / 2}`,
          `L ${x2} ${CY - rH / 2}`,
          `L ${x2} ${CY + rH / 2}`,
          `L ${x1} ${CY + lH / 2}`,
          "Z",
        ].join(" ");
        return (
          <g key={i}>
            <path d={d} fill="url(#funnel-fill)" />
            <path d={d} fill="url(#funnel-fill-d)" />
            {/* Separator line between stages */}
            {i < stages.length - 1 && (
              <line
                x1={x2} y1={CY - rH / 2}
                x2={x2} y2={CY + rH / 2}
                stroke="#0b0a1e" strokeWidth="2"
              />
            )}
          </g>
        );
      })}

      {/* Percentage labels inside the bars */}
      {stages.map((stage, i) => {
        const pct = i === 0
          ? 100
          : stages[0].count > 0
            ? (stage.count / stages[0].count) * 100
            : 0;
        const x = (i + 0.5) * SW;
        const h = heights[i];
        if (h < 22) return null;
        return (
          <text
            key={i} x={x} y={CY + 5}
            textAnchor="middle"
            fill="white" fontSize="16" fontWeight="900"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {pct.toFixed(0)}%
          </text>
        );
      })}
    </svg>
  );
}

export function FunnelCard() {
  const [period, setPeriod] = useState<Period>("today");
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/funnel?period=${period}`)
      .then((r) => r.json())
      .then((d: FunnelData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const stages = data
    ? [
        { label: "Sessões", count: data.sessions },
        { label: "Produto", count: data.product },
        { label: "Carrinho", count: data.cart },
        { label: "Checkout", count: data.checkout },
        { label: "Pago", count: data.paid },
      ]
    : [];

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(22,19,46,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: "rgba(108,82,255,0.2)" }}
          >
            ⚗️
          </div>
          <h2 className="text-sm font-bold text-white">Funil de Conversão</h2>
        </div>

        {/* Period buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {PERIODS.map((pp) => (
            <button
              key={pp.key}
              onClick={() => setPeriod(pp.key)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background:
                  period === pp.key
                    ? "linear-gradient(135deg, #4c37e8, #6c52ff)"
                    : "rgba(255,255,255,0.05)",
                color: period === pp.key ? "white" : "#7b7fa3",
                border: "1px solid",
                borderColor: period === pp.key ? "transparent" : "rgba(255,255,255,0.08)",
              }}
            >
              {pp.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#6c52ff", borderTopColor: "transparent" }}
          />
        </div>
      ) : data ? (
        <div>
          {/* Funnel SVG */}
          <FunnelShape stages={stages} />

          {/* Labels row */}
          <div className="flex mt-3">
            {stages.map((stage, i) => {
              const totalPct =
                i === 0 ? 100 : stages[0].count > 0 ? (stage.count / stages[0].count) * 100 : 0;
              const stepPct =
                i === 0
                  ? null
                  : stages[i - 1].count > 0
                    ? (stage.count / stages[i - 1].count) * 100
                    : null;

              return (
                <div key={i} className="flex-1 text-center px-0.5">
                  <div
                    className="w-2 h-2 rounded-full mx-auto mb-1"
                    style={{ background: STAGE_COLORS[i] }}
                  />
                  <p
                    className="text-[10px] font-bold truncate leading-none"
                    style={{ color: "#a78bfa" }}
                  >
                    {stage.label}
                  </p>
                  <p className="text-xs font-black text-white mt-0.5">
                    {stage.count.toLocaleString("pt-BR")}
                  </p>
                  {stepPct !== null && (
                    <p
                      className="text-[9px] font-semibold mt-0.5"
                      style={{ color: stepColor(stepPct) }}
                    >
                      ↓ {stepPct.toFixed(0)}%
                    </p>
                  )}
                  {stepPct === null && (
                    <p className="text-[9px] mt-0.5" style={{ color: "#4a4870" }}>
                      100%
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Zero-data hint */}
          {data.product === 0 && data.sessions > 0 && (
            <p
              className="text-[10px] text-center mt-3 px-2"
              style={{ color: "#4a4870" }}
            >
              Os dados de produto/carrinho/checkout acumulam a partir de agora
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
