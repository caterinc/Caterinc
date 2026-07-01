import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Users, Package, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";
import CheckPaymentsButton from "./CheckPaymentsButton";

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
    {
      label: "Receita Total",
      value: formatPrice(Number(revenue._sum.total || 0)),
      icon: TrendingUp,
      color: "bg-green-500",
      href: "/admin/pedidos",
    },
    {
      label: "Pedidos",
      value: totalOrders.toString(),
      icon: ShoppingBag,
      color: "bg-blue-500",
      href: "/admin/pedidos",
    },
    {
      label: "Clientes",
      value: totalCustomers.toString(),
      icon: Users,
      color: "bg-purple-500",
      href: "/admin/clientes",
    },
    {
      label: "Produtos Ativos",
      value: totalProducts.toString(),
      icon: Package,
      color: "bg-cat-black",
      href: "/admin/produtos",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-cat-black mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-black text-cat-black">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Pedidos Recentes</h2>
            <Link href="/admin/pedidos" className="text-sm text-cat-black font-medium hover:underline">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-xs uppercase">
                  <th className="text-left pb-2 pr-4">Pedido</th>
                  <th className="text-left pb-2 pr-4">Cliente</th>
                  <th className="text-left pb-2 pr-4">Status</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/pedidos/${order.id}`} className="font-medium hover:underline text-cat-black">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{order.user?.name || order.email}</td>
                    <td className="py-3 pr-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold">{formatPrice(Number(order.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          {lowStockCount > 0 && (
            <Link href="/admin/estoque?lowStock=true" className="block bg-red-50 border border-red-200 rounded-xl p-5 hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <h3 className="font-bold text-red-700">Estoque Baixo</h3>
              </div>
              <p className="text-sm text-red-600">
                {lowStockCount} variante{lowStockCount !== 1 ? "s" : ""} com menos de 5 unidades
              </p>
            </Link>
          )}

          <div className="bg-cat-yellow rounded-xl p-5">
            <h3 className="font-bold text-cat-black mb-2">Ações Rápidas</h3>
            <div className="space-y-2">
              <Link href="/admin/produtos/novo" className="block text-sm font-medium text-cat-black hover:underline">
                + Novo produto
              </Link>
              <Link href="/admin/importar" className="block text-sm font-medium text-cat-black hover:underline">
                + Importar CSV
              </Link>
              <Link href="/admin/visual" className="block text-sm font-medium text-cat-black hover:underline">
                ✏️ Editor visual
              </Link>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-bold text-cat-black mb-3">Pagamentos MP</h3>
            <p className="text-xs text-gray-500 mb-3">Clique para checar se há vendas pagas no Mercado Pago que ainda não foram confirmadas.</p>
            <CheckPaymentsButton />
          </div>
        </div>
      </div>
    </div>
  );
}
