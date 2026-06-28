"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft, Upload, Save, Plus, Trash2, Package,
  Search, CheckSquare, X,
} from "lucide-react";

interface ProductRow {
  id: string;
  name: string;
  images: string[];
  price: number;
  sku: string | null;
  stock: number;
}

interface CollectionEditorProps {
  collection: { id: string; name: string; slug: string; image: string | null };
  inCollection: ProductRow[];
  notInCollection: ProductRow[];
}

export function CollectionEditor({ collection, inCollection: initialIn, notInCollection: initialOut }: CollectionEditorProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Info state
  const [name, setName] = useState(collection.name);
  const [slug, setSlug] = useState(collection.slug);
  const [image, setImage] = useState(collection.image || "");
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Products state
  const [inCollection, setInCollection] = useState<ProductRow[]>(initialIn);
  const [notInCollection, setNotInCollection] = useState<ProductRow[]>(initialOut);
  const [selectedRemove, setSelectedRemove] = useState<Set<string>>(new Set());
  const [selectedAdd, setSelectedAdd] = useState<Set<string>>(new Set());
  const [searchIn, setSearchIn] = useState("");
  const [searchOut, setSearchOut] = useState("");
  const [busy, setBusy] = useState(false);

  // Filtered lists
  const filteredIn = inCollection.filter((p) =>
    !searchIn || p.name.toLowerCase().includes(searchIn.toLowerCase()) || (p.sku || "").toLowerCase().includes(searchIn.toLowerCase())
  );
  const filteredOut = notInCollection.filter((p) =>
    !searchOut || p.name.toLowerCase().includes(searchOut.toLowerCase()) || (p.sku || "").toLowerCase().includes(searchOut.toLowerCase())
  );

  // Select all helpers
  const allInSelected = filteredIn.length > 0 && filteredIn.every((p) => selectedRemove.has(p.id));
  const someInSelected = filteredIn.some((p) => selectedRemove.has(p.id)) && !allInSelected;
  const allOutSelected = filteredOut.length > 0 && filteredOut.every((p) => selectedAdd.has(p.id));
  const someOutSelected = filteredOut.some((p) => selectedAdd.has(p.id)) && !allOutSelected;

  const toggleRemove = (id: string) => {
    setSelectedRemove((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAdd = (id: string) => {
    setSelectedAdd((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAllIn = () => {
    setSelectedRemove(allInSelected ? new Set() : new Set(filteredIn.map((p) => p.id)));
  };
  const toggleAllOut = () => {
    setSelectedAdd(allOutSelected ? new Set() : new Set(filteredOut.map((p) => p.id)));
  };

  // Image upload
  const handleUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      setImage(url);
    } else {
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
    }
  };

  // Save info
  const saveInfo = async () => {
    setSavingInfo(true);
    const res = await fetch(`/api/categorias/${collection.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slug || name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""), image: image || null }),
    });
    setSavingInfo(false);
    if (res.ok) {
      toast({ title: "Coleção salva!", variant: "success" });
    } else {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  // Add products to collection
  const handleAdd = async () => {
    if (selectedAdd.size === 0) return;
    setBusy(true);
    const ids = Array.from(selectedAdd);
    const res = await fetch(`/api/categorias/${collection.id}/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ add: ids, remove: [] }),
    });
    setBusy(false);
    if (res.ok) {
      const moving = notInCollection.filter((p) => selectedAdd.has(p.id));
      setInCollection((prev) => [...prev, ...moving].sort((a, b) => a.name.localeCompare(b.name)));
      setNotInCollection((prev) => prev.filter((p) => !selectedAdd.has(p.id)));
      setSelectedAdd(new Set());
      toast({ title: `${ids.length} produto(s) adicionado(s) à coleção`, variant: "success" });
      startTransition(() => router.refresh());
    } else {
      toast({ title: "Erro ao adicionar produtos", variant: "destructive" });
    }
  };

  // Remove products from collection
  const handleRemove = async () => {
    if (selectedRemove.size === 0) return;
    setBusy(true);
    const ids = Array.from(selectedRemove);
    const res = await fetch(`/api/categorias/${collection.id}/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ add: [], remove: ids }),
    });
    setBusy(false);
    if (res.ok) {
      const moving = inCollection.filter((p) => selectedRemove.has(p.id));
      setNotInCollection((prev) => [...prev, ...moving].sort((a, b) => a.name.localeCompare(b.name)));
      setInCollection((prev) => prev.filter((p) => !selectedRemove.has(p.id)));
      setSelectedRemove(new Set());
      toast({ title: `${ids.length} produto(s) removido(s) da coleção`, variant: "success" });
      startTransition(() => router.refresh());
    } else {
      toast({ title: "Erro ao remover produtos", variant: "destructive" });
    }
  };

  // Single-product actions (don't rely on selection state)
  const addOne = async (product: ProductRow) => {
    setBusy(true);
    const res = await fetch(`/api/categorias/${collection.id}/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ add: [product.id], remove: [] }),
    });
    setBusy(false);
    if (res.ok) {
      setInCollection((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
      setNotInCollection((prev) => prev.filter((p) => p.id !== product.id));
      setSelectedAdd((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
      toast({ title: `"${product.name}" adicionado à coleção`, variant: "success" });
      startTransition(() => router.refresh());
    } else {
      toast({ title: "Erro ao adicionar produto", variant: "destructive" });
    }
  };

  const removeOne = async (product: ProductRow) => {
    setBusy(true);
    const res = await fetch(`/api/categorias/${collection.id}/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ add: [], remove: [product.id] }),
    });
    setBusy(false);
    if (res.ok) {
      setNotInCollection((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
      setInCollection((prev) => prev.filter((p) => p.id !== product.id));
      setSelectedRemove((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
      toast({ title: `"${product.name}" removido da coleção`, variant: "success" });
      startTransition(() => router.refresh());
    } else {
      toast({ title: "Erro ao remover produto", variant: "destructive" });
    }
  };

  const ProductThumb = ({ product }: { product: ProductRow }) => (
    <div className="relative w-9 h-9 rounded overflow-hidden bg-gray-100 flex-shrink-0">
      {product.images[0] ? (
        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
      ) : (
        <Package className="w-4 h-4 text-gray-300 m-2.5" />
      )}
    </div>
  );

  return (
    <div className="max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/colecoes" className="text-gray-400 hover:text-cat-black transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-cat-black">{name}</h1>
          <p className="text-gray-500 text-sm">{inCollection.length} produto(s) nesta coleção</p>
        </div>
      </div>

      {/* Info section */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-bold text-cat-black mb-4">Informações da coleção</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Slug (URL)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow font-mono"
            />
          </div>
        </div>

        {/* Image */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Imagem da coleção (opcional)</label>
          <div className="flex items-center gap-4">
            {image && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0">
                <Image src={image} alt="preview" fill className="object-cover" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-cat-yellow hover:text-cat-black transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Enviando..." : image ? "Trocar imagem" : "Enviar imagem"}
              </button>
              {image && (
                <button
                  onClick={() => setImage("")}
                  className="text-xs text-red-500 hover:underline text-left"
                >
                  Remover imagem
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={saveInfo}
            disabled={savingInfo}
            className="flex items-center gap-2 px-5 py-2 bg-cat-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {savingInfo ? "Salvando..." : "Salvar informações"}
          </button>
        </div>
      </div>

      {/* Products in collection */}
      <div className="bg-white rounded-xl border overflow-hidden mb-6">
        <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-cat-black">Produtos nesta coleção</h2>
          <span className="text-xs text-gray-500 font-medium bg-gray-200 px-2 py-0.5 rounded-full">{inCollection.length}</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchIn}
                onChange={(e) => setSearchIn(e.target.value)}
                placeholder="Filtrar..."
                className="pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cat-yellow w-40"
              />
            </div>
            {selectedRemove.size > 0 && (
              <button
                onClick={handleRemove}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Remover {selectedRemove.size} selecionado(s)
              </button>
            )}
          </div>
        </div>

        {inCollection.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Nenhum produto nesta coleção</p>
            <p className="text-xs mt-1">Adicione produtos na seção abaixo</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 w-10">
                  <input
                    type="checkbox"
                    checked={allInSelected}
                    ref={(el) => { if (el) el.indeterminate = someInSelected; }}
                    onChange={toggleAllIn}
                    className="w-4 h-4 accent-cat-yellow cursor-pointer"
                    title="Selecionar todos"
                  />
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase w-12">
                  <button
                    onClick={handleRemove}
                    disabled={selectedRemove.size === 0 || busy}
                    title="Remover selecionados"
                    className="text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredIn.map((p) => (
                <tr key={p.id} className={`transition-colors ${selectedRemove.has(p.id) ? "bg-red-50" : "hover:bg-gray-50"}`}>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedRemove.has(p.id)}
                      onChange={() => toggleRemove(p.id)}
                      className="w-4 h-4 accent-red-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <ProductThumb product={p} />
                      <span className="font-medium line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{p.sku || "—"}</td>
                  <td className="px-3 py-2.5 font-semibold text-cat-black">{formatPrice(p.price)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-semibold text-xs ${p.stock < 5 ? "text-red-500" : p.stock < 20 ? "text-yellow-600" : "text-green-600"}`}>
                      {p.stock} un.
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => removeOne(p)}
                      disabled={busy}
                      className="text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                      title="Remover da coleção"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add products */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-cat-black">Adicionar produtos</h2>
          <span className="text-xs text-gray-500 font-medium bg-gray-200 px-2 py-0.5 rounded-full">{notInCollection.length} disponíveis</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchOut}
                onChange={(e) => setSearchOut(e.target.value)}
                placeholder="Buscar produto..."
                className="pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cat-yellow w-48"
              />
            </div>
            {selectedAdd.size > 0 && (
              <button
                onClick={handleAdd}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cat-yellow text-cat-black text-xs font-bold rounded hover:bg-yellow-300 disabled:opacity-60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar {selectedAdd.size} selecionado(s)
              </button>
            )}
          </div>
        </div>

        {notInCollection.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Todos os produtos já estão nesta coleção</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 w-10">
                  <input
                    type="checkbox"
                    checked={allOutSelected}
                    ref={(el) => { if (el) el.indeterminate = someOutSelected; }}
                    onChange={toggleAllOut}
                    className="w-4 h-4 accent-cat-yellow cursor-pointer"
                    title="Selecionar todos"
                  />
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase w-12">
                  <button
                    onClick={handleAdd}
                    disabled={selectedAdd.size === 0 || busy}
                    title="Adicionar selecionados"
                    className="text-gray-300 hover:text-cat-yellow disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOut.map((p) => (
                <tr key={p.id} className={`transition-colors ${selectedAdd.has(p.id) ? "bg-yellow-50" : "hover:bg-gray-50"}`}>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedAdd.has(p.id)}
                      onChange={() => toggleAdd(p.id)}
                      className="w-4 h-4 accent-cat-yellow cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <ProductThumb product={p} />
                      <span className="font-medium line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{p.sku || "—"}</td>
                  <td className="px-3 py-2.5 font-semibold text-cat-black">{formatPrice(p.price)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-semibold text-xs ${p.stock < 5 ? "text-red-500" : p.stock < 20 ? "text-yellow-600" : "text-green-600"}`}>
                      {p.stock} un.
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => addOne(p)}
                      disabled={busy}
                      className="text-gray-300 hover:text-cat-yellow disabled:opacity-30 transition-colors"
                      title="Adicionar à coleção"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
