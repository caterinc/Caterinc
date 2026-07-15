"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, ShoppingCart, CreditCard, TrendingUp, ShoppingBag, Eye } from "lucide-react";

interface LiveStats {
  visitorsNow: number;
  fromMeta: number;
  returningNow: number;
  onHome: number;
  onProduct: number;
  onCart: number;
  onCheckout: number;
  onTracking: number;
  activeCarts: number;
  sessionsToday: number;
  totalOrders: number;
  totalRevenue: number;
  paidToday: number; pendingToday: number; revenueToday: number;
  paid24h: number; pending24h: number; revenue24h: number;
  paid7d: number; pending7d: number; revenue7d: number;
  paid30d: number; pending30d: number; revenue30d: number;
  metaToday: number; meta24h: number; meta7d: number; meta30d: number;
  retToday: number; ret24h: number; ret7d: number; ret30d: number;
}

const CARD: React.CSSProperties = { background: "#16132e", border: "1px solid rgba(255,255,255,0.07)" };

function fmt(n: number) { return n.toLocaleString("pt-BR"); }
function fmtMoney(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function MetricCard({ label, value, icon: Icon, iconBg, iconColor, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  iconBg: string; iconColor: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex items-center justify-between gap-2" style={CARD}>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide truncate" style={{ color: "#7b7fa3" }}>{label}</p>
        <p className="text-2xl font-black text-white mt-0.5">{typeof value === "number" ? fmt(value) : value}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: "#7b7fa3" }}>{sub}</p>}
      </div>
      <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: iconBg }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
    </div>
  );
}

const SHOPIFY_BLUE = "#3b82f6";

function FunnelRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const hasVisitors = value > 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium" style={{ color: hasVisitors ? "white" : "rgba(255,255,255,0.35)" }}>{label}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasVisitors && <span className="text-xs" style={{ color: "#7b7fa3" }}>{pct.toFixed(0)}%</span>}
          <span className="text-sm font-bold min-w-[1.5rem] text-right" style={{ color: hasVisitors ? "white" : "rgba(255,255,255,0.25)" }}>{value}</span>
        </div>
      </div>
      {hasVisitors && (
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${SHOPIFY_BLUE}, #60a5fa)` }}
          />
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-stats", { cache: "no-store" });
      if (res.ok) {
        setStats(await res.json());
        setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 2000);
    return () => clearInterval(t);
  }, [fetchStats]);

  const total = Math.max(stats?.visitorsNow || 0, 1);

  return (
    <div className="space-y-4 w-full overflow-x-hidden">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-white">Live View</h1>
          <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>Atividade em tempo real na sua loja</p>
        </div>
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5 flex-shrink-0"
          style={{ background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.25)" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#22d3a0" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22d3a0" }} />
          </span>
          <span className="text-xs font-bold" style={{ color: "#22d3a0" }}>AO VIVO</span>
          {lastUpdate && <span className="text-xs hidden sm:inline" style={{ color: "#7b7fa3" }}>{lastUpdate}</span>}
        </div>
      </div>

      {/* Hero + Funnel combinados */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={CARD}>
        <div className="flex items-center gap-2 mb-5">
          <Eye className="w-4 h-4" style={{ color: "#7b7fa3" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7b7fa3" }}>Visitantes agora</span>
        </div>

        <div className="flex gap-6 lg:gap-10 flex-col sm:flex-row">
          {/* Número grande */}
          <div className="flex-shrink-0">
            <p className="text-8xl font-black text-white leading-none">
              {stats ? fmt(stats.visitorsNow) : "—"}
            </p>
            {/* Meta + Retornante badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#60a5fa">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-xs font-bold" style={{ color: "#60a5fa" }}>
                  {stats?.fromMeta ?? 0} do anúncio
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)" }}>
                <span className="text-xs" style={{ color: "#a78bfa" }}>↩</span>
                <span className="text-xs font-bold" style={{ color: "#a78bfa" }}>
                  {stats?.returningNow ?? 0} voltaram
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-3">
              {[
                { label: "na home", value: stats?.onHome ?? 0, color: "#60a5fa" },
                { label: "em produto", value: stats?.onProduct ?? 0, color: "#a78bfa" },
                { label: "no carrinho", value: stats?.onCart ?? 0, color: "#38bdf8" },
                { label: "no checkout", value: stats?.onCheckout ?? 0, color: "#22d3a0" },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs" style={{ color: "#7b7fa3" }}>
                    <span className="text-white font-semibold">{d.value}</span> {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Divisor vertical */}
          <div className="hidden sm:block w-px self-stretch" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Funil */}
          <div className="flex-1 flex flex-col justify-center gap-4 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7b7fa3" }}>Jornada do cliente</p>
            <div className="space-y-4">
              {[
                { label: "Página inicial", value: stats?.onHome ?? 0, bar: "linear-gradient(90deg, #3b82f6, #60a5fa)" },
                { label: "Produto", value: stats?.onProduct ?? 0, bar: "linear-gradient(90deg, #3b82f6, #60a5fa)" },
                { label: "Carrinho", value: stats?.onCart ?? 0, bar: "linear-gradient(90deg, #3b82f6, #60a5fa)" },
                { label: "Checkout", value: stats?.onCheckout ?? 0, bar: "linear-gradient(90deg, #3b82f6, #60a5fa)" },
                { label: "Rastreando pedido", value: stats?.onTracking ?? 0, bar: "linear-gradient(90deg, #f97316, #fb923c)" },
              ].map((row) => {
                const pct = total > 0 ? Math.min((row.value / total) * 100, 100) : 0;
                const active = row.value > 0;
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm" style={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>{row.label}</span>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: active ? "white" : "rgba(255,255,255,0.2)" }}>{row.value}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      {active && (
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: row.bar }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mini totais */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(34,211,160,0.08)" }}>
                <p className="text-lg font-black" style={{ color: "#22d3a0" }}>{stats ? fmt(stats.paidToday) : "—"}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#7b7fa3" }}>Pagos hoje</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(108,82,255,0.08)" }}>
                <p className="text-lg font-black" style={{ color: "#a78bfa" }}>{stats ? fmt(stats.activeCarts) : "—"}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#7b7fa3" }}>Carrinhos ativos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-6 top-6 w-28 h-28 rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: "radial-gradient(circle, #6c52ff, transparent)" }} />
      </div>

      {/* Metric cards — 2 cols mobile, 4 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Cliques hoje" value={stats?.sessionsToday ?? "—"} icon={Eye}
          iconBg="rgba(96,165,250,0.15)" iconColor="#60a5fa" sub="sessões únicas" />
        <MetricCard label="Carrinhos" value={stats?.activeCarts ?? "—"} icon={ShoppingCart}
          iconBg="rgba(52,211,153,0.15)" iconColor="#34d399" sub="tempo real" />
        <MetricCard label="Checkout" value={stats?.onCheckout ?? "—"} icon={CreditCard}
          iconBg="rgba(52,211,153,0.12)" iconColor="#6ee7b7" sub="tempo real" />
        <MetricCard label="Receita hoje" value={stats ? fmtMoney(stats.revenueToday) : "—"} icon={TrendingUp}
          iconBg="rgba(34,211,160,0.15)" iconColor="#22d3a0" />
      </div>

      {/* Orders by period */}
      <div className="rounded-2xl p-5" style={CARD}>
        <p className="text-sm font-bold text-white mb-1">Pedidos por período</p>
        <p className="text-xs mb-4" style={{ color: "#7b7fa3" }}>Pagos e pendentes por janela de tempo</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Hoje", paid: stats?.paidToday ?? 0, pending: stats?.pendingToday ?? 0, revenue: stats?.revenueToday ?? 0, color: "#60a5fa", bg: "rgba(96,165,250,0.07)" },
            { label: "Últimas 24h", paid: stats?.paid24h ?? 0, pending: stats?.pending24h ?? 0, revenue: stats?.revenue24h ?? 0, color: "#a78bfa", bg: "rgba(108,82,255,0.07)" },
            { label: "7 dias", paid: stats?.paid7d ?? 0, pending: stats?.pending7d ?? 0, revenue: stats?.revenue7d ?? 0, color: "#34d399", bg: "rgba(52,211,153,0.07)" },
            { label: "30 dias", paid: stats?.paid30d ?? 0, pending: stats?.pending30d ?? 0, revenue: stats?.revenue30d ?? 0, color: "#22d3a0", bg: "rgba(34,211,160,0.07)" },
          ].map((p) => (
            <div key={p.label} className="rounded-xl p-4" style={{ background: p.bg, border: `1px solid ${p.color}20` }}>
              <p className="text-xs font-semibold mb-3" style={{ color: p.color }}>{p.label}</p>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-xs" style={{ color: "#7b7fa3" }}>Pagos</span>
                  </div>
                  <span className="text-sm font-black text-white">{fmt(p.paid)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <span className="text-xs" style={{ color: "#7b7fa3" }}>Pendentes</span>
                  </div>
                  <span className="text-sm font-black text-white">{fmt(p.pending)}</span>
                </div>
              </div>
              <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-bold" style={{ color: p.color }}>{fmtMoney(p.revenue)}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#7b7fa3" }}>receita paga</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visitantes — Meta + Retornantes por período */}
      <div className="rounded-2xl p-5" style={CARD}>
        <p className="text-sm font-bold text-white mb-1">Visitantes por período</p>
        <p className="text-xs mb-4" style={{ color: "#7b7fa3" }}>Do anúncio (Meta) e visitantes que voltaram</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Hoje",         meta: stats?.metaToday ?? 0, ret: stats?.retToday ?? 0, color: "#60a5fa", bg: "rgba(96,165,250,0.07)" },
            { label: "Últimas 24h",  meta: stats?.meta24h   ?? 0, ret: stats?.ret24h   ?? 0, color: "#a78bfa", bg: "rgba(108,82,255,0.07)" },
            { label: "7 dias",       meta: stats?.meta7d    ?? 0, ret: stats?.ret7d    ?? 0, color: "#34d399", bg: "rgba(52,211,153,0.07)" },
            { label: "30 dias",      meta: stats?.meta30d   ?? 0, ret: stats?.ret30d   ?? 0, color: "#22d3a0", bg: "rgba(34,211,160,0.07)" },
          ].map((p) => (
            <div key={p.label} className="rounded-xl p-4" style={{ background: p.bg, border: `1px solid ${p.color}20` }}>
              <p className="text-xs font-semibold mb-3" style={{ color: p.color }}>{p.label}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="#60a5fa"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span className="text-xs" style={{ color: "#7b7fa3" }}>Anúncio</span>
                  </div>
                  <span className="text-sm font-black text-white">{fmt(p.meta)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: "#a78bfa" }}>↩</span>
                    <span className="text-xs" style={{ color: "#7b7fa3" }}>Voltaram</span>
                  </div>
                  <span className="text-sm font-black text-white">{fmt(p.ret)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Totals */}

        {/* Totals */}
        <div className="rounded-2xl p-4" style={CARD}>
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Totais gerais</h2>
            <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>Acumulado de todos os tempos</p>
          </div>
          <div className="space-y-2">
            {[
              { label: "Total de pedidos", value: stats ? fmt(stats.totalOrders) : "—", icon: ShoppingBag, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
              { label: "Receita total", value: stats ? fmtMoney(stats.totalRevenue) : "—", icon: TrendingUp, color: "#22d3a0", bg: "rgba(34,211,160,0.1)" },
              { label: "Pedidos hoje", value: stats ? fmt((stats.paidToday ?? 0) + (stats.pendingToday ?? 0)) : "—", icon: ShoppingCart, color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
              { label: "Pagos hoje", value: stats ? fmt(stats.paidToday ?? 0) : "—", icon: CreditCard, color: "#a78bfa", bg: "rgba(108,82,255,0.1)" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: row.bg }}>
                    <row.icon className="w-3.5 h-3.5" style={{ color: row.color }} />
                  </div>
                  <span className="text-sm truncate" style={{ color: "#7b7fa3" }}>{row.label}</span>
                </div>
                <span className="text-sm font-black text-white flex-shrink-0 ml-2">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
