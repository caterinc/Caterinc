"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

interface Props {
  order: { id: string; status: string; trackingCode: string | null };
}

export function OrderActions({ order }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [trackingCode, setTrackingCode] = useState(order.trackingCode || "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    const res = await fetch(`/api/pedidos/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, trackingCode, note }),
    });
    setLoading(false);

    if (res.ok) {
      toast({ title: "Pedido atualizado!", variant: "success" });
      router.refresh();
      setNote("");
    } else {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <h3 className="font-bold">Atualizar Pedido</h3>
      <div>
        <Label>Status</Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Código de Rastreio</Label>
        <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="BR123456789BR" className="mt-1" />
      </div>
      <div>
        <Label>Nota interna</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: enviado via Sedex" className="mt-1" />
      </div>
      <Button className="w-full" onClick={handleUpdate} disabled={loading}>
        {loading ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  );
}
