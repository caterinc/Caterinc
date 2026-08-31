"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Paperclip, Loader2 } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  createdAt: Date;
  total: number | string;
  status: string;
  paymentStatus: string;
  paymentProofUrl: string | null;
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
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const checkGateway = async (id: string) => {
    setCheckingId(id);
    try {
      const res = await fetch(`/api/admin/pedidos/${id}/verificar-gateway`, { method: "POST" });
      const data = await res.json() as { status?: string; confirmed?: boolean; error?: string };
      if (!res.ok) {
        toast({ title: data.error || "Erro ao consultar o gateway", variant: "destructive" });
      } else if (data.confirmed) {
        toast({ title: "Pagamento confirmado no gateway! Pedido atualizado." });
        router.refresh();
      } else {
        toast({ title: `Status no gateway: ${data.status}` });
      }
    } catch {
      toast({ title: "Erro ao consultar o gateway", variant: "destructive" });
    } finally {
      setCheckingId(null);
    }
  };

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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Comprovante</th>
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
                  <td className="px-4 py-3">
                    {order.paymentProofUrl ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={order.paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100"
                        >
                          <Paperclip className="w-3 h-3" /> Ver
                        </a>
                        {order.paymentStatus !== "PAID" && (
                          <button
                            onClick={() => checkGateway(order.id)}
                            disabled={checkingId === order.id}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 hover:bg-amber-100 disabled:opacity-50"
                            title="Consultar status real no gateway"
                          >
                            {checkingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "🔍"} Verificar
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
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
