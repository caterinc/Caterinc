import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Users, Package, AlertTriangle, TrendingUp, Plus, FileDown, Palette } from "lucide-react";
import Link from "next/link";
import TestPixButton from "./TestPixButton";

export default async function AdminDashboard() {
  const [
    totalOrders,
    totalCustomers,
    totalProducts,
    lowStockCount,
    recentOrders,
    revenue,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { stock: { lt: 5 } } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } }, items: true },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID" },
    }),
  ]);

  const stats = [
    { label: "Receita", value: formatPrice(Number(revenue._sum.total || 0)), icon: TrendingUp, color: "bg-green-500", href: "/admin/pedidos" },
    { label: "Pedidos", value: totalOrders.toString(), icon: ShoppingBag, color: "bg-blue-500", href: "/admin/pedidos" },
    { label: "Clientes", value: totalCustomers.toString(), icon: Users, color: "bg-purple-500", href: "/admin/clientes" },
    { label: "Produtos", value: totalProducts.toString(), icon: Package, color: "bg-cat-black", href: "/admin/produtos" },
  ];

  const statusLabel: Record<string, string> = {
    PENDING: "Pendente", CONFIRMED: "Confirmado", PROCESSING: "Processando",
    SHIPPED: "Enviado", DELIVERED: "Entregue", CANCELLED: "Cancelado",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-cat-black">Dashboard</h1>

      {/* Stats — 2x2 on mobile, 4 columns on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow active:scale-[0.98]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <div className={`${stat.color} p-1.5 rounded-lg`}>
                <stat.icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className="text-xl font-black text-cat-black">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <Link href="/admin/estoque?lowStock=true"
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-semibold">
            {lowStockCount} variante{lowStockCount !== 1 ? "s" : ""} com estoque baixo
          </p>
        </Link>
      )}

      {/* Quick actions + Test PIX — side by side on mobile */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cat-yellow rounded-xl p-4">
          <p className="font-bold text-cat-black text-sm mb-3">Ações rápidas</p>
          <div className="space-y-2.5">
            <Link href="/admin/produtos/novo" className="flex items-center gap-2 text-sm font-medium text-cat-black hover:underline">
              <Plus className="w-4 h-4 flex-shrink-0" /> Novo produto
            </Link>
            <Link href="/admin/importar" className="flex items-center gap-2 text-sm font-medium text-cat-black hover:underline">
              <FileDown className="w-4 h-4 flex-shrink-0" /> Importar CSV
            </Link>
            <Link href="/admin/visual/editor" className="flex items-center gap-2 text-sm font-medium text-cat-black hover:underline">
              <Palette className="w-4 h-4 flex-shrink-0" /> Editor visual
            </Link>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="font-bold text-cat-black text-sm mb-1">Testar adquirente</p>
          <p className="text-xs text-gray-500 mb-3">Gera PIX R$5,50 para ver o beneficiário ativo.</p>
          <TestPixButton />
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-bold text-sm">Pedidos Recentes</h2>
          <Link href="/admin/pedidos" className="text-xs text-cat-black font-medium hover:underline">Ver todos</Link>
        </div>
        <div className="divide-y">
          {recentOrders.map((order) => (
            <Link key={order.id} href={`/admin/pedidos/${order.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cat-black truncate">{order.orderNumber}</p>
                <p className="text-xs text-gray-500 truncate">{order.user?.name || order.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold">{formatPrice(Number(order.total))}</p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {statusLabel[order.status] || order.status}
                </span>
              </div>
            </Link>
          ))}
          {recentOrders.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">Nenhum pedido ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}
