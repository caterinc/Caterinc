"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, ShoppingCart, CreditCard, TrendingUp, ShoppingBag, Eye } from "lucide-react";

interface LiveStats {
  visitorsNow: number;
  onHome: number;
  onProduct: number;
  onCart: number;
  onCheckout: number;
  activeCarts: number;
  ordersToday: number;
  orders24h: number;
  orders7d: number;
  orders30d: number;
  purchasedToday: number;
  revenueToday: number;
  revenue24h: number;
  revenue7d: number;
  revenue30d: number;
  totalOrders: number;
  totalRevenue: number;
  sessionsToday: number;
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

function FunnelRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-white/70 truncate">{label}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs" style={{ color: "#7b7fa3" }}>{pct.toFixed(0)}%</span>
          <span className="text-sm font-bold text-white w-5 text-right">{value}</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
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

      {/* Hero */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={CARD}>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4" style={{ color: "#7b7fa3" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7b7fa3" }}>Visitantes agora</span>
        </div>
        <div className="flex items-end gap-4 flex-wrap">
          <p className="text-6xl font-black text-white leading-none">
            {stats ? fmt(stats.visitorsNow) : "—"}
          </p>
          <div className="mb-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#a78bfa" }} />
              <span className="text-xs" style={{ color: "#7b7fa3" }}>{stats ? fmt(stats.onProduct) : "—"} em produto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#22d3a0" }} />
              <span className="text-xs" style={{ color: "#7b7fa3" }}>{stats ? fmt(stats.onCheckout) : "—"} no checkout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#60a5fa" }} />
              <span className="text-xs" style={{ color: "#7b7fa3" }}>{stats ? fmt(stats.onHome) : "—"} na home</span>
            </div>
          </div>
        </div>
        <div className="absolute right-4 top-4 w-20 h-20 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #6c52ff, transparent)" }} />
      </div>

      {/* Metric cards — 2 cols mobile, 4 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Cliques hoje" value={stats?.sessionsToday ?? "—"} icon={Eye}
          iconBg="rgba(96,165,250,0.15)" iconColor="#60a5fa" sub="sessões únicas" />
        <MetricCard label="Carrinhos" value={stats?.activeCarts ?? "—"} icon={ShoppingCart}
          iconBg="rgba(251,146,60,0.15)" iconColor="#fb923c" sub="tempo real" />
        <MetricCard label="Checkout" value={stats?.onCheckout ?? "—"} icon={CreditCard}
          iconBg="rgba(108,82,255,0.15)" iconColor="#a78bfa" sub="tempo real" />
        <MetricCard label="Receita hoje" value={stats ? fmtMoney(stats.revenueToday) : "—"} icon={TrendingUp}
          iconBg="rgba(34,211,160,0.15)" iconColor="#22d3a0" />
      </div>

      {/* Orders by period */}
      <div className="rounded-2xl p-4" style={CARD}>
        <p className="text-sm font-bold text-white mb-1">Pedidos por período</p>
        <p className="text-xs mb-4" style={{ color: "#7b7fa3" }}>Quantidade e receita por janela de tempo</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Hoje", orders: stats?.ordersToday ?? 0, revenue: stats?.revenueToday ?? 0, color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
            { label: "Últimas 24h", orders: stats?.orders24h ?? 0, revenue: stats?.revenue24h ?? 0, color: "#a78bfa", bg: "rgba(108,82,255,0.08)" },
            { label: "7 dias", orders: stats?.orders7d ?? 0, revenue: stats?.revenue7d ?? 0, color: "#22d3a0", bg: "rgba(34,211,160,0.08)" },
            { label: "30 dias", orders: stats?.orders30d ?? 0, revenue: stats?.revenue30d ?? 0, color: "#fb923c", bg: "rgba(251,146,60,0.08)" },
          ].map((p) => (
            <div key={p.label} className="rounded-xl p-3" style={{ background: p.bg, border: `1px solid ${p.color}22` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: p.color }}>{p.label}</p>
              <p className="text-xl font-black text-white">{fmt(p.orders)}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#7b7fa3" }}>pedidos</p>
              <p className="text-xs font-bold mt-2" style={{ color: p.color }}>{fmtMoney(p.revenue)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Funnel */}
        <div className="rounded-2xl p-4 space-y-4" style={CARD}>
          <div>
            <h2 className="text-sm font-bold text-white">Jornada do cliente</h2>
            <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>Onde estão os visitantes agora</p>
          </div>
          <div className="space-y-4">
            <FunnelRow label="Página inicial" value={stats?.onHome ?? 0} total={total} color="#60a5fa" />
            <FunnelRow label="Produto" value={stats?.onProduct ?? 0} total={total} color="#a78bfa" />
            <FunnelRow label="Carrinho" value={stats?.onCart ?? 0} total={total} color="#fb923c" />
            <FunnelRow label="Checkout" value={stats?.onCheckout ?? 0} total={total} color="#22d3a0" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(34,211,160,0.08)" }}>
              <p className="text-xl font-black" style={{ color: "#22d3a0" }}>{stats ? fmt(stats.purchasedToday) : "—"}</p>
              <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>Compraram hoje</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(108,82,255,0.08)" }}>
              <p className="text-xl font-black" style={{ color: "#a78bfa" }}>{stats ? fmt(stats.activeCarts) : "—"}</p>
              <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>Carrinhos ativos</p>
            </div>
          </div>
        </div>

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
              { label: "Pedidos hoje", value: stats ? fmt(stats.ordersToday) : "—", icon: ShoppingCart, color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
              { label: "Compraram hoje", value: stats ? fmt(stats.purchasedToday) : "—", icon: CreditCard, color: "#a78bfa", bg: "rgba(108,82,255,0.1)" },
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
