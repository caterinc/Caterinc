import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { BulkOrders } from "./BulkOrders";

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
        items: { select: { id: true } },
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

      <BulkOrders orders={orders} />

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
