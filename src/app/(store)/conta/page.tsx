import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignOutButton from "./SignOutButton";

export default async function ContaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/conta/login");

  const userId = (session.user as { id: string }).id;

  const [user, recentOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-cat-black uppercase">Minha Conta</h1>
        <SignOutButton />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cat-black rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-cat-yellow" />
            </div>
            <div>
              <p className="font-bold text-cat-black">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          {user?.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
          <p className="text-xs text-gray-400 mt-2">
            Cliente desde {formatDate(user!.createdAt)}
          </p>
        </div>

        {/* Quick links */}
        <div className="md:col-span-2 bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-cat-yellow" />
            Últimos Pedidos
          </h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>Você ainda não fez nenhum pedido.</p>
              <Button className="mt-3" asChild>
                <Link href="/produtos">Explorar Produtos</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/conta/pedidos/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-cat-yellow hover:bg-yellow-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)} · {order.items.length} item(s)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", ORDER_STATUS_COLORS[order.status])}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                      <span className="font-bold text-sm">{formatPrice(Number(order.total))}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {recentOrders.length > 0 && (
            <Link href="/conta/pedidos" className="text-sm text-cat-black font-semibold hover:underline mt-4 block text-right">
              Ver todos os pedidos →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
