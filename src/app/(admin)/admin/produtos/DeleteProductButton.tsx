"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;

    const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({
        title: data.softDeleted
          ? "Produto desativado (possui pedidos associados)"
          : "Produto excluído com sucesso",
        variant: "success",
      });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error || "Erro ao excluir produto", variant: "destructive" });
    }
  };

  return (
    <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
