"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, ShoppingCart, CreditCard, TrendingUp, ShoppingBag, Activity } from "lucide-react";

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
  updatedAt: string;
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function fmtMoney(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{typeof value === "number" ? fmt(value) : value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`${color} p-3 rounded-xl`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-800 w-8 text-right">{value}</span>
    </div>
  );
}

export default function LivePage() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [tick, setTick] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
      setTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const maxFunnel = Math.max(stats?.visitorsNow || 0, 1);

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Live View</h1>
          <p className="text-sm text-gray-500 mt-0.5">Atualiza automaticamente a cada 3 segundos</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-xs font-semibold text-gray-700">AO VIVO</span>
          {lastUpdate && <span className="text-xs text-gray-400">{lastUpdate}</span>}
        </div>
      </div>

      {!stats ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Activity className="w-6 h-6 animate-pulse mr-2" />
          Carregando...
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Visitantes agora" value={stats.visitorsNow} icon={Users} color="bg-blue-500" sub="tempo real" />
            <StatCard label="Carrinhos ativos" value={stats.activeCarts} icon={ShoppingCart} color="bg-orange-500" sub="tempo real" />
            <StatCard label="Pedidos hoje" value={stats.ordersToday} icon={ShoppingBag} color="bg-purple-500" />
            <StatCard label="Receita hoje" value={fmtMoney(stats.revenueToday)} icon={TrendingUp} color="bg-green-500" />
          </div>

          {/* Customer behavior */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Comportamento dos visitantes</h2>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                  <p className="text-2xl font-black text-orange-600">{fmt(stats.activeCarts)}</p>
                  <p className="text-xs text-gray-500 mt-1">Carrinhos ativos</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-black text-blue-600">{fmt(stats.onCheckout)}</p>
                  <p className="text-xs text-gray-500 mt-1">No checkout</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-black text-green-600">{fmt(stats.purchasedToday)}</p>
                  <p className="text-xs text-gray-500 mt-1">Compraram hoje</p>
                </div>
              </div>
              {/* Funnel */}
              <div className="space-y-3">
                <FunnelBar label="Página inicial" value={stats.onHome} max={maxFunnel} color="bg-blue-400" />
                <FunnelBar label="Produto" value={stats.onProduct} max={maxFunnel} color="bg-indigo-400" />
                <FunnelBar label="Carrinho" value={stats.onCart} max={maxFunnel} color="bg-orange-400" />
                <FunnelBar label="Checkout" value={stats.onCheckout} max={maxFunnel} color="bg-green-400" />
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Totais gerais</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">Total de pedidos</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{fmt(stats.totalOrders)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Receita total</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{fmtMoney(stats.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-sm text-gray-600">Carrinhos ativos agora</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{fmt(stats.activeCarts)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600">Compraram hoje</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{fmt(stats.purchasedToday)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tick indicator for visual confirmation of updates */}
          <p className="text-center text-xs text-gray-300">
            Atualização #{tick + 1}
          </p>
        </>
      )}
    </div>
  );
}
