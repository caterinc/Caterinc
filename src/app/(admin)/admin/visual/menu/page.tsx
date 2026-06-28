"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";

interface MenuItem {
  id?: string;
  label: string;
  url: string;
  order: number;
}

function MenuEditor({ location, title }: { location: string; title: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/menus/${location}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data?.items || []);
        setLoading(false);
      });
  }, [location]);

  const addItem = () => {
    setItems([...items, { label: "", url: "", order: items.length }]);
  };

  const removeItem = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, field: keyof MenuItem, value: string) => {
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/menus/${location}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((item, i) => ({ ...item, order: i })) }),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: `${title} salvo!`, variant: "success" });
    } else {
      toast({ title: "Erro ao salvar menu", variant: "destructive" });
    }
  };

  if (loading) return <div className="py-4 text-gray-400 text-sm">Carregando...</div>;

  return (
    <div className="bg-white rounded-xl border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">{title}</h2>
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar Item
        </Button>
      </div>

      <div className="space-y-2 mb-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nenhum item. Clique em "Adicionar Item".</p>
        ) : items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg border bg-gray-50">
            <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
            <Input
              value={item.label}
              onChange={(e) => updateItem(i, "label", e.target.value)}
              placeholder="Rótulo do link"
              className="h-8 flex-1"
            />
            <Input
              value={item.url}
              onChange={(e) => updateItem(i, "url", e.target.value)}
              placeholder="/url-do-link"
              className="h-8 flex-1"
            />
            <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Salvando..." : "Salvar Menu"}
      </Button>
    </div>
  );
}

export default function MenuPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <a href="/admin/visual" className="hover:text-cat-black">← Editor Visual</a>
      </div>
      <h1 className="text-2xl font-black text-cat-black mb-6">Editar Menus</h1>
      <MenuEditor location="header" title="Menu do Cabeçalho" />
      <MenuEditor location="footer" title="Menu do Rodapé" />
    </div>
  );
}
