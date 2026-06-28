import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { Users } from "lucide-react";

interface PageProps {
  searchParams: { page?: string; search?: string };
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 20;
  const search = searchParams.search;

  const where = search
    ? {
        role: "CUSTOMER" as const,
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : { role: "CUSTOMER" as const };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: { total: true },
          where: { paymentStatus: "PAID" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-cat-black">Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} clientes cadastrados</p>
        </div>
      </div>

      <form className="bg-white rounded-xl border p-4 mb-4 flex gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por nome ou email..."
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow flex-1"
        />
        <button type="submit" className="bg-cat-black text-white px-4 py-1.5 rounded-lg text-sm hover:bg-cat-gray transition-colors">
          Buscar
        </button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Telefone</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pedidos</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Gasto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Desde</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((c) => {
              const totalSpent = c.orders.reduce((s, o) => s + Number(o.total), 0);
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cat-black rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-cat-yellow text-xs font-bold">
                          {c.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-center font-semibold">{c._count.orders}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{formatPrice(totalSpent)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
