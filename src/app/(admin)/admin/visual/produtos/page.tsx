"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Save, GripVertical, Star, Package } from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  order: number;
  isFeatured: boolean;
  images: string[];
  category: { name: string } | null;
}

export default function ProductPositionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/produtos?adminAll=true&limit=100")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      });
  }, []);

  const handleDragStart = (i: number) => setDragIndex(i);

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;

    const newProducts = [...products];
    const [dragged] = newProducts.splice(dragIndex, 1);
    newProducts.splice(i, 0, dragged);
    setProducts(newProducts);
    setDragIndex(i);
  };

  const handleDragEnd = () => setDragIndex(null);

  const moveUp = (i: number) => {
    if (i === 0) return;
    const newProducts = [...products];
    [newProducts[i - 1], newProducts[i]] = [newProducts[i], newProducts[i - 1]];
    setProducts(newProducts);
  };

  const moveDown = (i: number) => {
    if (i === products.length - 1) return;
    const newProducts = [...products];
    [newProducts[i], newProducts[i + 1]] = [newProducts[i + 1], newProducts[i]];
    setProducts(newProducts);
  };

  const handleSave = async () => {
    setSaving(true);
    const order = products.map((p, i) => ({ id: p.id, order: i }));
    const res = await fetch("/api/produtos/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Ordem dos produtos salva!", variant: "success" });
    } else {
      toast({ title: "Erro ao salvar ordem", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-gray-400 py-8 text-center">Carregando produtos...</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <a href="/admin/visual" className="hover:text-cat-black">← Editor Visual</a>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-cat-black">Posição dos Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">Arraste para reordenar. A ordem aqui reflete na loja.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Ordem"}
        </Button>
      </div>

      <div className="space-y-2">
        {products.map((product, i) => (
          <div
            key={product.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className={`bg-white rounded-xl border p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all ${dragIndex === i ? "opacity-50 border-cat-yellow shadow-md" : "hover:border-gray-300"}`}
          >
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button onClick={() => moveUp(i)} className="text-gray-400 hover:text-cat-black text-xs leading-none">▲</button>
              <GripVertical className="w-4 h-4 text-gray-300" />
              <button onClick={() => moveDown(i)} className="text-gray-400 hover:text-cat-black text-xs leading-none">▼</button>
            </div>

            <span className="text-gray-400 text-sm w-7 text-center font-mono">{i + 1}</span>

            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {product.images[0] ? (
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              ) : (
                <Package className="w-6 h-6 text-gray-300 m-3" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-cat-black line-clamp-1">{product.name}</p>
              <p className="text-xs text-gray-400">{product.category?.name || "Sem categoria"}</p>
            </div>

            {product.isFeatured && (
              <span title="Destaque"><Star className="w-4 h-4 text-cat-yellow fill-cat-yellow flex-shrink-0" /></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
