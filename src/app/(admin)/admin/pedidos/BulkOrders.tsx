"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  createdAt: Date;
  total: number | string;
  status: string;
  user: { name: string | null } | null;
  items: { id: string }[];
}

const STATUS_OPTIONS = [
  { value: "CONFIRMED",  label: "Confirmado" },
  { value: "PROCESSING", label: "Em preparo" },
  { value: "SHIPPED",    label: "Enviado" },
  { value: "DELIVERED",  label: "Entregue" },
  { value: "CANCELLED",  label: "Cancelado" },
  { value: "PENDING",    label: "Pendente" },
];

export function BulkOrders({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("CONFIRMED");
  const [isPending, startTransition] = useTransition();

  const allSelected = orders.length > 0 && selected.size === orders.length;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(orders.map((o) => o.id)));
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const applyBulk = () => {
    if (!selected.size) return;
    startTransition(async () => {
      const res = await fetch("/api/admin/orders/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [...selected], status: bulkStatus }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) {
        toast({ title: `${selected.size} pedido(s) atualizados para "${STATUS_OPTIONS.find(s => s.value === bulkStatus)?.label}"` });
        setSelected(new Set());
        router.refresh();
      } else {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      }
    });
  };

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-cat-black text-white px-4 py-3 rounded-xl">
          <span className="text-sm font-semibold">{selected.size} selecionado(s)</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="text-sm rounded-lg px-3 py-1.5 text-cat-black font-semibold border-none outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={applyBulk}
            disabled={isPending}
            className="bg-cat-yellow text-cat-black text-sm font-black px-4 py-1.5 rounded-lg disabled:opacity-50"
          >
            {isPending ? "Salvando..." : "Aplicar"}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-300 hover:text-white">
            Cancelar
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                </th>
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
                <tr key={order.id} className={cn("hover:bg-gray-50", selected.has(order.id) && "bg-yellow-50")}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggle(order.id)} className="rounded" />
                  </td>
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
    </>
  );
}
