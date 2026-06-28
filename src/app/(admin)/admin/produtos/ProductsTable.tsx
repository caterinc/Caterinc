"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface Variant { id: string; stock: number; }
interface Category { name: string; }
interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number | string | { toNumber?: () => number };
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  category: Category | null;
  variants: Variant[];
}

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const allSelected = products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteOne = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting((prev) => new Set(prev).add(id));
    const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    setDeleting((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({
        title: data.softDeleted
          ? `"${name}" desativado (possui pedidos vinculados)`
          : `"${name}" excluído com sucesso`,
        variant: "success",
      });
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      startTransition(() => router.refresh());
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error || "Erro ao excluir", variant: "destructive" });
    }
  };

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    if (!confirm(`Excluir ${ids.length} produto(s) selecionado(s)? Esta ação não pode ser desfeita.`)) return;
    setDeleting(new Set(ids));
    const results = await Promise.all(
      ids.map((id) => fetch(`/api/produtos/${id}`, { method: "DELETE" }).then((r) => r.json().then((d) => ({ id, ok: r.ok, ...d }))))
    );
    setDeleting(new Set());
    const deleted = results.filter((r) => r.ok && !r.softDeleted).length;
    const deactivated = results.filter((r) => r.ok && r.softDeleted).length;
    const failed = results.filter((r) => !r.ok).length;
    const parts = [];
    if (deleted) parts.push(`${deleted} excluído(s)`);
    if (deactivated) parts.push(`${deactivated} desativado(s) (com pedidos)`);
    if (failed) parts.push(`${failed} com erro`);
    toast({ title: parts.join(", "), variant: failed ? "destructive" : "success" });
    setSelected(new Set());
    startTransition(() => router.refresh());
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-cat-yellow border-b">
          <span className="text-sm font-bold text-cat-black">
            {selected.size} produto(s) selecionado(s)
          </span>
          <button
            onClick={deleteSelected}
            disabled={deleting.size > 0}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting.size > 0 ? "Excluindo..." : "Excluir selecionados"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-cat-black/60 hover:text-cat-black"
          >
            Limpar
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-cat-yellow cursor-pointer"
                  title="Selecionar todos"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Preço</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => {
              const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
              const isSelected = selected.has(product.id);
              const isDeleting = deleting.has(product.id);
              return (
                <tr
                  key={product.id}
                  className={`transition-colors ${isSelected ? "bg-yellow-50" : "hover:bg-gray-50"} ${isDeleting ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(product.id)}
                      className="w-4 h-4 accent-cat-yellow cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-gray-400 m-2.5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-cat-black line-clamp-1">{product.name}</p>
                        {product.isFeatured && (
                          <span className="text-xs text-cat-yellow font-semibold">★ Destaque</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{product.sku || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category?.name || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(Number(product.price))}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${totalStock < 5 ? "text-red-500" : totalStock < 20 ? "text-yellow-600" : "text-green-600"}`}>
                      {totalStock} un.
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.isActive ? "success" : "secondary"}>
                      {product.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/produtos/${product.id}`} className="text-gray-400 hover:text-cat-black transition-colors" title="Editar">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteOne(product.id, product.name)}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum produto encontrado</p>
        </div>
      )}
    </div>
  );
}
