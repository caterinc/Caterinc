import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { OrderActions } from "./OrderActions";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: params.id }, { orderNumber: params.id }] },
    include: {
      items: { include: { product: true, variant: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!order) notFound();

  const addr = order.shippingAddress as Record<string, string>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/pedidos" className="hover:text-cat-black">← Pedidos</Link>
        <span>/</span>
        <span className="text-cat-black font-medium">{order.orderNumber}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-cat-black">{order.orderNumber}</h1>
          <p className="text-gray-500 text-sm">{formatDateTime(order.createdAt)}</p>
        </div>
        <span className={cn("text-sm px-3 py-1.5 rounded-full font-medium", ORDER_STATUS_COLORS[order.status])}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold mb-4">Itens do Pedido</h2>
            <ul className="space-y-4">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0">
                    <Image src={item.image || "/placeholder-product.jpg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.size && `Tam: ${item.size}`} {item.color && `· Cor: ${item.color}`}</p>
                    <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-sm">{formatPrice(Number(item.price) * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span></div>
              <div className="flex justify-between text-gray-600"><span>Frete</span><span>{Number(order.shipping) === 0 ? "Grátis" : formatPrice(Number(order.shipping))}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>{formatPrice(Number(order.total))}</span></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold mb-4">Histórico de Status</h2>
            <ol className="relative border-l-2 border-gray-200 ml-3 space-y-4">
              {order.statusHistory.map((h, i) => (
                <li key={h.id} className="ml-5">
                  <span className={cn(
                    "absolute -left-2.5 w-5 h-5 rounded-full ring-2 ring-white flex items-center justify-center",
                    i === order.statusHistory.length - 1 ? "bg-cat-yellow" : "bg-gray-200"
                  )}>
                    <span className={cn("w-2 h-2 rounded-full", i === order.statusHistory.length - 1 ? "bg-cat-black" : "bg-gray-400")} />
                  </span>
                  <p className="font-semibold text-sm">{ORDER_STATUS_LABELS[h.status]}</p>
                  {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                  <p className="text-xs text-gray-400">{formatDateTime(h.createdAt)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          {/* Actions */}
          <OrderActions order={{ id: order.id, status: order.status, trackingCode: order.trackingCode }} />

          {/* Customer */}
          {order.user && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-bold mb-3">Cliente</h3>
              <p className="font-medium text-sm">{order.user.name}</p>
              <p className="text-xs text-gray-500">{order.user.email}</p>
              {order.user.phone && <p className="text-xs text-gray-500">{order.user.phone}</p>}
            </div>
          )}

          {/* Address */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-bold mb-3">Entrega</h3>
            <address className="not-italic text-sm text-gray-600 space-y-1">
              <p className="font-semibold">{addr.name}</p>
              <p>{addr.street}, {addr.number}</p>
              {addr.complement && <p>{addr.complement}</p>}
              <p>{addr.district} — {addr.city}/{addr.state}</p>
              <p>CEP: {addr.zipCode}</p>
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}
