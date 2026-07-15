import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, ShoppingBag, Users, Plus, FileDown, Palette, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import TestPixButton from "./TestPixButton";

function Sparkline({ points, color }: { points: string; color: string }) {
  return (
    <svg viewBox="0 0 100 40" className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CARD = "rounded-2xl p-5 flex flex-col gap-3";
const CARD_BG = { background: "#16132e", border: "1px solid rgba(255,255,255,0.07)" };

const statusLabel: Record<string, string> = {
  PENDING: "Pendente", CONFIRMED: "Confirmado", PROCESSING: "Processando",
  SHIPPED: "Enviado", DELIVERED: "Entregue", CANCELLED: "Cancelado", REFUNDED: "Reembolsado",
};

const statusColor: Record<string, string> = {
  PENDING: "#f59e0b", CONFIRMED: "#3b82f6", PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4", DELIVERED: "#22c55e", CANCELLED: "#ef4444", REFUNDED: "#6b7280",
};

export default async function AdminDashboard() {
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0,0,0,0);
  const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(weekStart.getDate() - 7);

  const [
    totalOrders, totalCustomers, lowStockCount, recentOrders,
    revenue, ordersThisWeek, ordersPrevWeek, revenueThisWeek, revenuePrevWeek,
    customersThisWeek, customersPrevWeek,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.productVariant.count({ where: { stock: { lt: 5 } } }),
    prisma.order.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } }, items: true },
    }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.count({ where: { createdAt: { gte: prevWeekStart, lt: weekStart } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID", createdAt: { gte: weekStart } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID", createdAt: { gte: prevWeekStart, lt: weekStart } } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: prevWeekStart, lt: weekStart } } }),
  ]);

  function pct(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  const revCurr = Number(revenueThisWeek._sum.total || 0);
  const revPrev = Number(revenuePrevWeek._sum.total || 0);

  const stats = [
    {
      label: "Receita", value: formatPrice(Number(revenue._sum.total || 0)),
      change: pct(revCurr, revPrev), href: "/admin/pedidos",
      icon: TrendingUp, iconBg: "#1a3a2e", iconColor: "#22d3a0",
      sparkColor: "#22d3a0",
      points: "0,35 10,30 20,32 30,24 40,27 50,18 60,22 70,13 80,16 90,8 100,6",
    },
    {
      label: "Pedidos", value: totalOrders.toLocaleString("pt-BR"),
      change: pct(ordersThisWeek, ordersPrevWeek), href: "/admin/pedidos",
      icon: ShoppingBag, iconBg: "#1a2a3e", iconColor: "#60a5fa",
      sparkColor: "#60a5fa",
      points: "0,28 10,22 20,30 30,20 40,16 50,24 60,12 70,20 80,10 90,18 100,14",
    },
    {
      label: "Clientes", value: totalCustomers.toLocaleString("pt-BR"),
      change: pct(customersThisWeek, customersPrevWeek), href: "/admin/clientes",
      icon: Users, iconBg: "#2a1a3e", iconColor: "#c084fc",
      sparkColor: "#c084fc",
      points: "0,30 10,28 20,32 30,24 40,26 50,20 60,22 70,16 80,18 90,14 100,16",
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "#7b7fa3" }}>Bem-vindo de volta, Dropper! 👋</p>
      </div>

      {/* Low stock */}
      {lowStockCount > 0 && (
        <Link href="/admin/estoque?lowStock=true"
          className="flex items-center gap-3 rounded-xl px-4 py-3 transition-opacity hover:opacity-90"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300 font-medium">
            {lowStockCount} variante{lowStockCount !== 1 ? "s" : ""} com estoque baixo
          </p>
          <ChevronRight className="w-4 h-4 text-red-400 ml-auto" />
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <Link key={s.label} href={s.href}
            className={`${CARD} hover:opacity-90 transition-opacity active:scale-[0.98]${i === 0 ? " col-span-2" : ""}`}
            style={CARD_BG}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "#7b7fa3" }}>{s.label}</p>
                <p className="text-xl lg:text-2xl font-black text-white">{s.value}</p>
              </div>
              <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: s.iconBg }}>
                <s.icon className="w-4 h-4" style={{ color: s.iconColor }} />
              </div>
            </div>
            <div className="-mx-1">
              <Sparkline points={s.points} color={s.sparkColor} />
            </div>
            <p className="text-xs font-semibold" style={{ color: s.change >= 0 ? "#22d3a0" : "#f87171" }}>
              {s.change >= 0 ? "↗" : "↘"} {Math.abs(s.change)}% vs último período
            </p>
          </Link>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Quick actions */}
        <div className={CARD} style={CARD_BG}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(108,82,255,0.2)" }}>
              <span className="text-sm">🚀</span>
            </div>
            <h2 className="text-sm font-bold text-white">Ações rápidas</h2>
          </div>
          <div className="space-y-1">
            {[
              { label: "Novo produto", href: "/admin/produtos/novo", icon: Plus },
              { label: "Importar CSV", href: "/admin/importar", icon: FileDown },
              { label: "Editor visual", href: "/admin/visual/editor", icon: Palette },
            ].map((a) => (
              <Link key={a.href} href={a.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors group"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-2.5">
                  <a.icon className="w-4 h-4" style={{ color: "#7b7fa3" }} />
                  <span className="text-sm text-white/80 group-hover:text-white transition-colors">{a.label}</span>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: "#7b7fa3" }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Test PIX */}
        <div className={CARD} style={CARD_BG}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,211,160,0.15)" }}>
              <span className="text-sm">⚡</span>
            </div>
            <h2 className="text-sm font-bold text-white">Testar adquirente</h2>
          </div>
          <p className="text-xs mb-3" style={{ color: "#7b7fa3" }}>
            Gere um PIX de teste de R$5,50 para verificar o beneficiário ativo.
          </p>
          <TestPixButton />
        </div>

        {/* Recent orders — on mobile this goes full width */}
        <div className={`${CARD} sm:col-span-2 lg:col-span-1`} style={CARD_BG}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-white">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-xs font-medium transition-colors" style={{ color: "#6c52ff" }}>
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 && (
              <p className="text-center text-sm py-4" style={{ color: "#7b7fa3" }}>Nenhum pedido ainda</p>
            )}
            {recentOrders.map((order) => (
              <Link key={order.id} href={`/admin/pedidos/${order.id}`}
                className="flex items-center justify-between py-2 rounded-lg px-2 transition-colors hover:bg-white/5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{order.orderNumber}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "#7b7fa3" }}>{order.user?.name || order.email}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs font-bold text-white">{formatPrice(Number(order.total))}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-medium mt-0.5 inline-block"
                    style={{ background: `${statusColor[order.status] || "#6b7280"}22`, color: statusColor[order.status] || "#9ca3af" }}>
                    {statusLabel[order.status] || order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Welcome banner */}
      <div className="rounded-2xl p-5 lg:p-6 flex items-center justify-between overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #1a1350 0%, #2a1a6e 50%, #0f1a3e 100%)", border: "1px solid rgba(108,82,255,0.3)" }}>
        <div className="relative z-10">
          <p className="text-lg font-black text-white mb-1">Bem-vindo de volta, Dropper! 👋</p>
          <p className="text-sm" style={{ color: "#a78bfa" }}>Acompanhe o desempenho da sua loja em tempo real.</p>
          <Link href="/admin/live"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#6c52ff" }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Ver Live View
          </Link>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-40 lg:w-64 flex items-center justify-center opacity-20 pointer-events-none select-none" aria-hidden>
          <span className="text-8xl lg:text-9xl">🪐</span>
        </div>
      </div>
    </div>
  );
}
