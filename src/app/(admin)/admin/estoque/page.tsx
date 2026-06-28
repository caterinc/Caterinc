"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Save, AlertTriangle, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  product: { id: string; name: string; slug: string; images: string[] };
}

export default function EstoquePage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const load = async (low = false) => {
    setLoading(true);
    const res = await fetch(`/api/estoque${low ? "?lowStock=true" : ""}`);
    const data = await res.json();
    setVariants(data);
    setEdits({});
    setLoading(false);
  };

  useEffect(() => { load(lowStockOnly); }, [lowStockOnly]);

  const handleSave = async () => {
    const updates = Object.entries(edits).map(([id, stock]) => ({ id, stock }));
    if (updates.length === 0) return;

    setSaving(true);
    const res = await fetch("/api/estoque", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    setSaving(false);

    if (res.ok) {
      toast({ title: `${updates.length} variante(s) atualizada(s)!`, variant: "success" });
      load(lowStockOnly);
    } else {
      toast({ title: "Erro ao salvar estoque", variant: "destructive" });
    }
  };

  const lowCount = variants.filter((v) => v.stock < 5).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-cat-black">Controle de Estoque</h1>
          {lowCount > 0 && (
            <p className="text-red-500 text-sm flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-4 h-4" /> {lowCount} variante(s) com estoque baixo
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="accent-red-500 w-4 h-4"
            />
            Apenas estoque baixo
          </label>
          {Object.keys(edits).length > 0 && (
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : `Salvar (${Object.keys(edits).length})`}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tamanho</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              ) : variants.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum dado</td></tr>
              ) : variants.map((v) => {
                const currentStock = edits[v.id] ?? v.stock;
                const isLow = currentStock < 5;
                return (
                  <tr key={v.id} className={`hover:bg-gray-50 ${isLow ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {v.product.images[0] ? (
                            <Image src={v.product.images[0]} alt="" fill className="object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400 m-2.5" />
                          )}
                        </div>
                        <Link href={`/admin/produtos/${v.product.id}`} className="font-medium hover:underline line-clamp-1 text-cat-black">
                          {v.product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-center">{v.size}</td>
                    <td className="px-4 py-3 text-gray-600">{v.color || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${isLow ? "text-red-500" : currentStock < 20 ? "text-yellow-600" : "text-green-600"}`}>
                        {v.stock}
                      </span>
                      {isLow && <AlertTriangle className="inline w-3 h-3 text-red-500 ml-1" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={currentStock}
                        onChange={(e) => setEdits({ ...edits, [v.id]: parseInt(e.target.value) || 0 })}
                        className="h-8 w-20 mx-auto text-center"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
