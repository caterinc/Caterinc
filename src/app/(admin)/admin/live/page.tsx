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
  purchasedToday: number;
  revenueToday: number;
  totalOrders: number;
  totalRevenue: number;
}

const CARD = { background: "#16132e", border: "1px solid rgba(255,255,255,0.07)" };

function fmt(n: number) { return n.toLocaleString("pt-BR"); }
function fmtMoney(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function MetricCard({ label, value, icon: Icon, iconBg, iconColor, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  iconBg: string; iconColor: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl p-5 flex items-center justify-between" style={CARD}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "#7b7fa3" }}>{label}</p>
        <p className="text-3xl font-black text-white">{typeof value === "number" ? fmt(value) : value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: "#7b7fa3" }}>{sub}</p>}
      </div>
      <div className="p-3 rounded-xl flex-shrink-0" style={{ background: iconBg }}>
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
    </div>
  );
}

function FunnelRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const convPct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "#7b7fa3" }}>{convPct}%</span>
          <span className="text-sm font-bold text-white w-6 text-right">{value}</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
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
    <div className="space-y-5 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Live View</h1>
          <p className="text-sm mt-0.5" style={{ color: "#7b7fa3" }}>Atividade em tempo real na sua loja</p>
        </div>
        <div className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.25)" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#22d3a0" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22d3a0" }} />
          </span>
          <span className="text-xs font-bold" style={{ color: "#22d3a0" }}>AO VIVO</span>
          {lastUpdate && <span className="text-xs" style={{ color: "#7b7fa3" }}>{lastUpdate}</span>}
        </div>
      </div>

      {/* Hero — visitors right now */}
      <div className="rounded-2xl p-6 lg:p-8 relative overflow-hidden" style={CARD}>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4" style={{ color: "#7b7fa3" }} />
          <span className="text-sm font-medium uppercase tracking-wider" style={{ color: "#7b7fa3" }}>Visitantes agora</span>
        </div>
        <div className="flex items-end gap-4">
          <p className="text-7xl lg:text-8xl font-black text-white leading-none">
            {stats ? fmt(stats.visitorsNow) : "—"}
          </p>
          <div className="mb-2 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#6c52ff" }} />
              <span className="text-xs" style={{ color: "#7b7fa3" }}>{stats ? fmt(stats.onProduct) : "—"} em produto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#22d3a0" }} />
              <span className="text-xs" style={{ color: "#7b7fa3" }}>{stats ? fmt(stats.onCheckout) : "—"} no checkout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#60a5fa" }} />
              <span className="text-xs" style={{ color: "#7b7fa3" }}>{stats ? fmt(stats.onHome) : "—"} na home</span>
            </div>
          </div>
        </div>
        {/* decorative pulse */}
        <div className="absolute right-6 top-6 w-24 h-24 rounded-full opacity-10 animate-pulse"
          style={{ background: "radial-gradient(circle, #6c52ff, transparent)" }} />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Carrinhos ativos" value={stats?.activeCarts ?? "—"} icon={ShoppingCart}
          iconBg="rgba(251,146,60,0.15)" iconColor="#fb923c" sub="tempo real" />
        <MetricCard label="No checkout" value={stats?.onCheckout ?? "—"} icon={CreditCard}
          iconBg="rgba(108,82,255,0.15)" iconColor="#a78bfa" sub="tempo real" />
        <MetricCard label="Pedidos hoje" value={stats?.ordersToday ?? "—"} icon={ShoppingBag}
          iconBg="rgba(96,165,250,0.15)" iconColor="#60a5fa" />
        <MetricCard label="Receita hoje" value={stats ? fmtMoney(stats.revenueToday) : "—"} icon={TrendingUp}
          iconBg="rgba(34,211,160,0.15)" iconColor="#22d3a0" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Funnel */}
        <div className="rounded-2xl p-5 space-y-5" style={CARD}>
          <div>
            <h2 className="text-sm font-bold text-white">Jornada do cliente</h2>
            <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>Onde estão os visitantes agora</p>
          </div>
          <div className="space-y-4">
            <FunnelRow label="🏠 Página inicial" value={stats?.onHome ?? 0} total={total} color="#60a5fa" />
            <FunnelRow label="👟 Produto" value={stats?.onProduct ?? 0} total={total} color="#a78bfa" />
            <FunnelRow label="🛒 Carrinho" value={stats?.onCart ?? 0} total={total} color="#fb923c" />
            <FunnelRow label="💳 Checkout" value={stats?.onCheckout ?? 0} total={total} color="#22d3a0" />
          </div>
          {/* Mini legend */}
          <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="grid grid-cols-2 gap-2">
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
        </div>

        {/* Totals */}
        <div className="rounded-2xl p-5" style={CARD}>
          <div className="mb-5">
            <h2 className="text-sm font-bold text-white">Totais gerais</h2>
            <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>Acumulado de todos os tempos</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Total de pedidos", value: stats ? fmt(stats.totalOrders) : "—", icon: ShoppingBag, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
              { label: "Receita total", value: stats ? fmtMoney(stats.totalRevenue) : "—", icon: TrendingUp, color: "#22d3a0", bg: "rgba(34,211,160,0.1)" },
              { label: "Pedidos hoje", value: stats ? fmt(stats.ordersToday) : "—", icon: ShoppingCart, color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
              { label: "Compraram hoje", value: stats ? fmt(stats.purchasedToday) : "—", icon: CreditCard, color: "#a78bfa", bg: "rgba(108,82,255,0.1)" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 rounded-xl px-3"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: row.bg }}>
                    <row.icon className="w-4 h-4" style={{ color: row.color }} />
                  </div>
                  <span className="text-sm" style={{ color: "#7b7fa3" }}>{row.label}</span>
                </div>
                <span className="text-base font-black text-white">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
