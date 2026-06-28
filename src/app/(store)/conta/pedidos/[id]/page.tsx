import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Truck, Package, Home, AlertCircle } from "lucide-react";

const STATUS_ICONS = {
  PENDING: Circle,
  CONFIRMED: CheckCircle2,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: Home,
  CANCELLED: AlertCircle,
  REFUNDED: AlertCircle,
};

export default async function PedidoDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/conta/login");

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: params.id }, { orderNumber: params.id }] },
    include: {
      items: { include: { product: true, variant: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  const userId = (session.user as { id: string }).id;
  const isAdmin = (session.user as { role: string }).role === "ADMIN";
  if (!isAdmin && order.userId !== userId) notFound();

  const addr = order.shippingAddress as Record<string, string>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/conta/pedidos" className="hover:text-cat-black transition-colors">← Meus Pedidos</Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-cat-black">Pedido {order.orderNumber}</h1>
        <span className={cn("text-sm px-3 py-1.5 rounded-full font-medium", ORDER_STATUS_COLORS[order.status])}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-bold mb-4">Rastreamento do Pedido</h2>
        {order.trackingCode && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 text-sm text-indigo-700 font-medium">
            Código de rastreio: <span className="font-black">{order.trackingCode}</span>
          </div>
        )}
        <ol className="relative border-l-2 border-gray-200 ml-4 space-y-6">
          {order.statusHistory.map((history, i) => {
            const Icon = STATUS_ICONS[history.status] || Circle;
            const isLast = i === order.statusHistory.length - 1;
            return (
              <li key={history.id} className="ml-6">
                <span className={cn(
                  "absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white",
                  isLast ? "bg-cat-yellow" : "bg-gray-200"
                )}>
                  <Icon className={cn("w-3.5 h-3.5", isLast ? "text-cat-black" : "text-gray-500")} />
                </span>
                <div className={cn("font-semibold text-sm", isLast ? "text-cat-black" : "text-gray-500")}>
                  {ORDER_STATUS_LABELS[history.status]}
                </div>
                {history.note && <p className="text-xs text-gray-500 mt-0.5">{history.note}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(history.createdAt)}</p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-bold mb-4">Itens do Pedido</h2>
        <ul className="space-y-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0">
                <Image src={item.image || "/placeholder-product.jpg"} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.size && `Tamanho: ${item.size}`} {item.color && `· Cor: ${item.color}`}
                </p>
                <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
              </div>
              <span className="font-bold text-sm">{formatPrice(Number(item.price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span></div>
          <div className="flex justify-between text-gray-600">
            <span>Frete</span>
            <span className={Number(order.shipping) === 0 ? "text-green-600" : ""}>{Number(order.shipping) === 0 ? "Grátis" : formatPrice(Number(order.shipping))}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Total</span><span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-3">Endereço de Entrega</h2>
        <address className="not-italic text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-cat-black">{addr.name}</p>
          <p>{addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}</p>
          <p>{addr.district} — {addr.city}/{addr.state}</p>
          <p>CEP: {addr.zipCode}</p>
        </address>
      </div>
    </div>
  );
}
