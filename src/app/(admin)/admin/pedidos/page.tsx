import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: { page?: string; status?: string };
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 20;
  const status = searchParams.status;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);
  const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-cat-black">Pedidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} pedidos</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <Link
          href="/admin/pedidos"
          className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors", !status ? "bg-cat-black text-white border-cat-black" : "border-gray-300 hover:border-cat-black")}
        >
          Todos ({total})
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/pedidos?status=${s}`}
            className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors", status === s ? "bg-cat-black text-white border-cat-black" : "border-gray-300 hover:border-cat-black")}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pedido</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Itens</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${order.id}`} className="font-bold text-cat-black hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.user?.name || order.email}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{order.items.length}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium", ORDER_STATUS_COLORS[order.status])}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">Nenhum pedido encontrado</div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/pedidos?page=${p}${status ? `&status=${status}` : ""}`}
              className={`w-9 h-9 flex items-center justify-center rounded border text-sm ${p === page ? "bg-cat-black text-white border-cat-black" : "border-gray-300 hover:border-cat-black"}`}
            >{p}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
