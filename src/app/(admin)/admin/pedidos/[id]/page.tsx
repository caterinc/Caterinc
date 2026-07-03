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
              {addr.phone && (
                <a
                  href={`https://wa.me/55${addr.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-green-600 font-semibold hover:underline"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {addr.phone}
                </a>
              )}
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
