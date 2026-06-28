"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Truck, CheckCircle, XCircle, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

interface ShippingMethod {
  id?: string;
  name: string;
  description: string;
  price: string;
  minDays: string;
  maxDays: string;
  freeAbove: string;
  isActive: boolean;
  order: number;
}

const empty: ShippingMethod = {
  name: "", description: "", price: "", minDays: "", maxDays: "", freeAbove: "", isActive: true, order: 0,
};

export default function FretePage() {
  const [methods, setMethods] = useState<(ShippingMethod & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingMethod>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/shipping?all=1");
    if (r.ok) setMethods(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, order: methods.length });
    setShowForm(true);
  };

  const openEdit = (m: ShippingMethod & { id: string }) => {
    setEditing(m.id);
    setForm({
      name: m.name,
      description: m.description || "",
      price: String(m.price),
      minDays: m.minDays != null ? String(m.minDays) : "",
      maxDays: m.maxDays != null ? String(m.maxDays) : "",
      freeAbove: m.freeAbove != null ? String(m.freeAbove) : "",
      isActive: m.isActive,
      order: m.order,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const url  = editing ? `/api/shipping/${editing}` : "/api/shipping";
    const method = editing ? "PUT" : "POST";
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price) || 0,
      minDays: form.minDays ? parseInt(form.minDays) : null,
      maxDays: form.maxDays ? parseInt(form.maxDays) : null,
      freeAbove: form.freeAbove ? parseFloat(form.freeAbove) : null,
      isActive: form.isActive,
      order: form.order,
    };
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (r.ok) {
      toast({ title: editing ? "Frete atualizado!" : "Frete criado!" });
      setShowForm(false);
      setEditing(null);
      load();
    } else {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    const r = await fetch(`/api/shipping/${id}`, { method: "DELETE" });
    if (r.ok) { toast({ title: "Frete excluído" }); load(); }
    else toast({ title: "Erro ao excluir", variant: "destructive" });
  };

  const toggle = async (m: ShippingMethod & { id: string }) => {
    await fetch(`/api/shipping/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, price: Number(m.price), minDays: m.minDays || null, maxDays: m.maxDays || null, freeAbove: m.freeAbove || null, isActive: !m.isActive }),
    });
    load();
  };

  const daysLabel = (min: number | null | undefined, max: number | null | undefined) => {
    if (!min && !max) return null;
    if (min === max || !max) return `${min} dias úteis`;
    if (!min) return `até ${max} dias úteis`;
    return `${min}–${max} dias úteis`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Métodos de Frete</h1>
          <p className="text-sm text-gray-500 mt-0.5">Opções de entrega que aparecem no checkout</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-cat-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo método
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-black text-gray-900 mb-5">
              {editing ? "Editar método" : "Novo método de frete"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: PAC, SEDEX, Frete Grátis"
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm focus:border-gray-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Entrega em todo o Brasil"
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm focus:border-gray-800 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prazo mínimo (dias)</label>
                  <input
                    type="number" min="0" value={form.minDays}
                    onChange={(e) => setForm((f) => ({ ...f, minDays: e.target.value }))}
                    placeholder="3"
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm focus:border-gray-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prazo máximo (dias)</label>
                  <input
                    type="number" min="0" value={form.maxDays}
                    onChange={(e) => setForm((f) => ({ ...f, maxDays: e.target.value }))}
                    placeholder="8"
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm focus:border-gray-800 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Preço (R$)</label>
                  <input
                    type="number" min="0" step="0.01" value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="29.90"
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm focus:border-gray-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Grátis acima de (R$)
                    <span className="text-gray-400 font-normal"> opt.</span>
                  </label>
                  <input
                    type="number" min="0" step="0.01" value={form.freeAbove}
                    onChange={(e) => setForm((f) => ({ ...f, freeAbove: e.target.value }))}
                    placeholder="299.00"
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm focus:border-gray-800 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ordem</label>
                  <input
                    type="number" min="0" value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                    className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm focus:border-gray-800 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox" checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="w-5 h-5 rounded accent-cat-black"
                    />
                    <span className="text-sm font-semibold text-gray-700">Ativo (aparece no checkout)</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 h-11 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors">
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 h-11 bg-cat-black text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      ) : methods.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center">
          <Truck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">Nenhum método de frete cadastrado</p>
          <p className="text-xs text-gray-400 mt-1 mb-5">Adicione opções de entrega que os clientes vão ver no checkout</p>
          <button onClick={openNew} className="px-5 py-2.5 bg-cat-black text-white text-sm font-bold rounded-xl">
            Adicionar primeiro método
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id} className={`bg-white rounded-2xl border p-4 flex items-start gap-4 transition-opacity ${!m.isActive ? "opacity-60" : ""}`}>
              <div className="text-gray-300 mt-0.5 flex-shrink-0">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.isActive ? "bg-cat-yellow" : "bg-gray-100"}`}>
                <Truck className={`w-5 h-5 ${m.isActive ? "text-cat-black" : "text-gray-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{m.name}</span>
                  {m.isActive
                    ? <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ativo</span>
                    : <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inativo</span>
                  }
                </div>
                {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                  <span className="font-bold text-base text-gray-900">
                    {Number(m.price) === 0 ? "Grátis" : formatPrice(Number(m.price))}
                  </span>
                  {daysLabel(m.minDays as number | null, m.maxDays as number | null) && (
                    <span className="text-gray-400">· {daysLabel(m.minDays as number | null, m.maxDays as number | null)}</span>
                  )}
                  {m.freeAbove && (
                    <span className="text-green-600">· Grátis acima de {formatPrice(Number(m.freeAbove))}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggle(m)} title={m.isActive ? "Desativar" : "Ativar"}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  {m.isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(m)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(m.id, m.name)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700">
            <p className="font-bold mb-1">Como funciona</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Métodos ativos aparecem no checkout para o cliente escolher</li>
              <li>Se "Grátis acima de" estiver configurado, o frete é automático quando o pedido atingir o valor</li>
              <li>Use "Ordem" para definir qual aparece primeiro (menor ordem = primeiro)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
