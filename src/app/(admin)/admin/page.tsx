import { prisma } from "@/lib/prisma";
import { formatPrice, brazilDayStart, brazilDayEnd, brazilMonthStart } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, ShoppingBag, Users, Clock, Plus, FileDown, Palette, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import TestPixButton from "./TestPixButton";
import DashboardFilter from "./DashboardFilter";
import AdSpendInput from "./AdSpendInput";
import { FunnelCard } from "@/components/admin/FunnelCard";
import { Suspense } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateRange(period: string, from?: string, to?: string) {
  const now = new Date();
  switch (period) {
    case "yesterday":
      return { start: brazilDayStart(1), end: brazilDayEnd(1), label: "Ontem" };
    case "7d":
      return { start: brazilDayStart(6), end: now, label: "Últimos 7 dias" };
    case "month":
      return { start: brazilMonthStart(0), end: now, label: "Este mês" };
    case "lastmonth":
      return { start: brazilMonthStart(1), end: new Date(brazilMonthStart(0).getTime() - 1), label: "Mês passado" };
    case "custom": {
      const s = from ? new Date(`${from}T00:00:00-03:00`) : brazilMonthStart(0);
      const e = to ? new Date(`${to}T23:59:59-03:00`) : now;
      return { start: s, end: e, label: "Personalizado" };
    }
    default:
      return { start: brazilDayStart(0), end: now, label: "Hoje" };
  }
}

function buildSparkPoints(
  orders: { total: number; createdAt: Date }[],
  start: Date,
  end: Date,
  buckets = 28
): string {
  const duration = end.getTime() - start.getTime();
  if (duration <= 0 || orders.length === 0) {
    return Array.from({ length: buckets }, (_, i) => `${(i / (buckets - 1) * 100).toFixed(1)},38`).join(" ");
  }

  const bucketMs = duration / buckets;
  const data = Array(buckets).fill(0);
  for (const o of orders) {
    const idx = Math.min(Math.floor((o.createdAt.getTime() - start.getTime()) / bucketMs), buckets - 1);
    if (idx >= 0) data[idx] += o.total;
  }

  let cum = 0;
  const cumulative = data.map((v) => { cum += v; return cum; });
  const max = Math.max(...cumulative, 0.01);

  return cumulative
    .map((v, i) => {
      const x = (i / (buckets - 1)) * 100;
      const y = 38 - (v / max) * 34;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function TradingSparkline({ points, color }: { points: string; color: string }) {
  const pts = points.split(" ");
  const firstX = pts[0].split(",")[0];
  const lastX = pts[pts.length - 1].split(",")[0];
  const fillPoints = `${firstX},40 ${points} ${lastX},40`;
  const id = `sp-${color.replace("#", "")}`;
  return (
    <svg viewBox="0 0 100 40" className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${id})`} />
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
const CARD_BG = {
  background: "rgba(22,19,46,0.9)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendente", CONFIRMED: "Confirmado", PROCESSING: "Processando",
  SHIPPED: "Enviado", DELIVERED: "Entregue", CANCELLED: "Cancelado", REFUNDED: "Reembolsado",
};
const statusColor: Record<string, string> = {
  PENDING: "#f59e0b", CONFIRMED: "#3b82f6", PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4", DELIVERED: "#22c55e", CANCELLED: "#ef4444", REFUNDED: "#6b7280",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const { period = "today", from, to } = searchParams;
  const { start, end, label } = getDateRange(period, from, to);

  const [
    lowStockCount,
    totalCustomers,
    recentOrders,
    paidOrders,
    pendingAgg,
    periodOrders,
    adSpendAgg,
    todayRevenueAgg,
  ] = await Promise.all([
    prisma.productVariant.count({ where: { stock: { lt: 5 } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } }, items: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: start, lte: end } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PENDING", createdAt: { gte: start, lte: end } },
    }),
    prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.adSpend.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID", createdAt: { gte: brazilDayStart(0) } },
    }),
  ]);

  const paidTotal = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const pendingTotal = Number(pendingAgg._sum.total || 0);
  const adSpendTotal = Number(adSpendAgg._sum.amount || 0);
  const profitTotal = paidTotal - adSpendTotal;
  const todayRevenue = Number(todayRevenueAgg._sum.total || 0);
  const sparkPoints = buildSparkPoints(
    paidOrders.map((o) => ({ total: Number(o.total), createdAt: o.createdAt })),
    start,
    end
  );

  return (
    <div className="space-y-4 max-w-7xl">

      {/* Header + Filter */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>Bem-vindo de volta, Dropper!</p>
        </div>
        <Suspense fallback={null}>
          <DashboardFilter />
        </Suspense>
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

      {/* Pagos — full width with real sparkline */}
      <Link href="/admin/pedidos"
        className="block rounded-2xl p-5 hover:opacity-90 transition-opacity active:scale-[0.99]"
        style={CARD_BG}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7b7fa3" }}>
              Pagos — {label}
            </p>
            <p className="text-3xl lg:text-4xl font-black text-white mt-1">
              {formatPrice(paidTotal)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "#1a3a2e" }}>
            <TrendingUp className="w-4 h-4" style={{ color: "#22d3a0" }} />
          </div>
        </div>
        <div className="-mx-1 mt-1">
          <TradingSparkline points={sparkPoints} color="#22d3a0" />
        </div>
      </Link>

      {/* Gasto com anúncio + Lucro */}
      <div className="grid grid-cols-2 gap-3">
        <div className={CARD} style={CARD_BG}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7b7fa3" }}>Gasto c/ anúncio</p>
              <p className="text-xl font-black mt-1" style={{ color: "#f87171" }}>{formatPrice(adSpendTotal)}</p>
            </div>
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
              <Wallet className="w-4 h-4" style={{ color: "#f87171" }} />
            </div>
          </div>
          <p className="text-xs" style={{ color: "#7b7fa3" }}>Lançado manualmente — {label}</p>
        </div>

        <div className={CARD} style={CARD_BG}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7b7fa3" }}>Lucro líquido</p>
              <p className="text-xl font-black mt-1" style={{ color: profitTotal >= 0 ? "#22d3a0" : "#f87171" }}>
                {formatPrice(profitTotal)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: profitTotal >= 0 ? "rgba(34,211,160,0.1)" : "rgba(239,68,68,0.1)" }}>
              {profitTotal >= 0
                ? <TrendingUp className="w-4 h-4" style={{ color: "#22d3a0" }} />
                : <TrendingDown className="w-4 h-4" style={{ color: "#f87171" }} />}
            </div>
          </div>
          <p className="text-xs" style={{ color: "#7b7fa3" }}>Faturamento − gasto de anúncio</p>
        </div>
      </div>

      <AdSpendInput todayRevenue={todayRevenue} />

      {/* Small cards: Pendente + Pedidos + Clientes */}
      <div className="grid grid-cols-2 gap-3">
        {/* Pendente */}
        <div className={CARD} style={CARD_BG}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7b7fa3" }}>Pendente</p>
              <p className="text-xl font-black mt-1" style={{ color: "#fbbf24" }}>{formatPrice(pendingTotal)}</p>
            </div>
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "rgba(251,191,36,0.1)" }}>
              <Clock className="w-4 h-4" style={{ color: "#fbbf24" }} />
            </div>
          </div>
          <p className="text-xs" style={{ color: "#7b7fa3" }}>Aguardando pagamento</p>
        </div>

        {/* Pedidos */}
        <Link href="/admin/pedidos" className={`${CARD} hover:opacity-90 transition-opacity`} style={CARD_BG}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7b7fa3" }}>Pedidos</p>
              <p className="text-xl font-black text-white mt-1">{periodOrders.toLocaleString("pt-BR")}</p>
            </div>
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "#1a2a3e" }}>
              <ShoppingBag className="w-4 h-4" style={{ color: "#60a5fa" }} />
            </div>
          </div>
          <p className="text-xs" style={{ color: "#7b7fa3" }}>{label}</p>
        </Link>

        {/* Clientes — full width on mobile (col-span-2), half on desktop */}
        <Link href="/admin/clientes" className={`${CARD} col-span-2 sm:col-span-1 hover:opacity-90 transition-opacity`} style={CARD_BG}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7b7fa3" }}>Clientes</p>
              <p className="text-xl font-black text-white mt-1">{totalCustomers.toLocaleString("pt-BR")}</p>
            </div>
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "#2a1a3e" }}>
              <Users className="w-4 h-4" style={{ color: "#c084fc" }} />
            </div>
          </div>
          <p className="text-xs" style={{ color: "#7b7fa3" }}>Total cadastrados</p>
        </Link>
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
                style={{ background: "rgba(255,255,255,0.04)" }}>
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

        {/* Recent orders */}
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

      {/* Conversion Funnel */}
      <FunnelCard />

      {/* Live View banner */}
      <div className="rounded-2xl p-5 lg:p-6 flex items-center justify-between overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #1a1350 0%, #2a1a6e 50%, #0f1a3e 100%)", border: "1px solid rgba(108,82,255,0.3)" }}>
        <div className="relative z-10">
          <p className="text-lg font-black text-white mb-1">Bem-vindo de volta, Dropper!</p>
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
