import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

export default async function PedidosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/conta/login");

  const userId = (session.user as { id: string }).id;
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/conta" className="text-gray-400 hover:text-cat-black transition-colors text-sm">← Minha Conta</Link>
      </div>
      <h1 className="text-3xl font-black text-cat-black uppercase mb-6">Meus Pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Você ainda não fez nenhum pedido</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/conta/pedidos/${order.id}`}
              className="block bg-white rounded-xl border p-5 hover:border-cat-yellow hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-bold text-cat-black">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", ORDER_STATUS_COLORS[order.status])}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="font-bold">{formatPrice(Number(order.total))}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {order.items.map((item) => (
                  <span key={item.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {item.name} {item.size && `(${item.size})`} x{item.quantity}
                  </span>
                ))}
              </div>
              {order.trackingCode && (
                <p className="text-xs text-indigo-600 mt-2 font-medium">
                  Rastreio: {order.trackingCode}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
