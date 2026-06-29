"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FolderOpen, Upload, Layers } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  order: number;
  isActive: boolean;
  _count?: { products: number };
}

export default function ColecoesPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", image: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch("/api/categorias");
    const data = await res.json();
    setCollections(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement("img");
        img.onload = () => {
          const MAX = 1200;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await compressImage(file);
      setForm((f) => ({ ...f, image: url }));
    } catch {
      toast({ title: "Erro ao processar imagem", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/categorias/${editing.id}` : "/api/categorias";
    const method = editing ? "PUT" : "POST";
    const slug = form.slug || form.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug }),
    });
    if (res.ok) {
      toast({ title: editing ? "Coleção atualizada!" : "Coleção criada!", variant: "success" });
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", slug: "", image: "" });
      load();
    } else {
      toast({ title: "Erro ao salvar coleção", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Desativar coleção "${name}"?`)) return;
    const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Coleção desativada", variant: "success" });
      load();
    }
  };

  const startEdit = (col: Collection) => {
    setEditing(col);
    setForm({ name: col.name, slug: col.slug, image: col.image || "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-cat-black">Coleções</h1>
          <p className="text-gray-500 text-sm mt-0.5">{collections.length} coleções cadastradas</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", slug: "", image: "" }); }}>
          <Plus className="w-4 h-4 mr-2" /> Nova Coleção
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="font-bold mb-4">{editing ? "Editar" : "Nova"} Coleção</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Botas"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="gerado-automaticamente"
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <Label>Imagem da coleção</Label>
              <div className="flex items-center gap-4 mt-1">
                {form.image && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0">
                    <Image src={form.image} alt="preview" fill className="object-cover" />
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-cat-yellow hover:text-cat-black transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Enviando..." : form.image ? "Trocar imagem" : "Escolher imagem"}
                </button>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image: "" })}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit">Salvar Coleção</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Coleção</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Slug</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produtos</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Carregando...</td></tr>
            ) : collections.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhuma coleção cadastrada</td></tr>
            ) : (
              collections.map((col) => (
                <tr key={col.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {col.image ? (
                          <Image src={col.image} alt={col.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <FolderOpen className="w-5 h-5 text-gray-300 m-2.5" />
                        )}
                      </div>
                      <span className="font-medium">{col.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{col.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-cat-black">{col._count?.products || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/colecoes/${col.id}`}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-cat-yellow text-cat-black font-semibold rounded hover:bg-yellow-300 transition-colors"
                        title="Gerenciar produtos"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Gerenciar
                      </Link>
                      <button
                        onClick={() => startEdit(col)}
                        className="text-gray-400 hover:text-cat-black transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(col.id, col.name)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
