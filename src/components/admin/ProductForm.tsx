"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import type { Category } from "@/types";

interface SizeVariant {
  id?: string;
  size: string;
  sku: string;
  stock: number;
  price: string;
}

interface ColorGroup {
  color: string;
  image: string;
  expanded: boolean;
  sizes: SizeVariant[];
}

interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  comparePrice: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  tags: string;
  images: string[];
  colorGroups: ColorGroup[];
}

interface Props {
  categories: Category[];
  initialData?: {
    id?: string;
    name?: string;
    slug?: string;
    sku?: string;
    price?: string;
    comparePrice?: string;
    description?: string;
    categoryId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    tags?: string;
    images?: string[];
    variants?: { id?: string; size: string; color: string; sku: string; stock: number; price: string; image?: string }[];
  };
}

function groupVariants(variants: NonNullable<Props["initialData"]>["variants"] = []): ColorGroup[] {
  const map = new Map<string, ColorGroup>();
  for (const v of variants) {
    const color = v.color || "";
    if (!map.has(color)) {
      map.set(color, { color, image: v.image || "", expanded: true, sizes: [] });
    }
    const g = map.get(color)!;
    if (!g.image && v.image) g.image = v.image;
    g.sizes.push({ id: v.id, size: v.size, sku: v.sku, stock: v.stock, price: v.price });
  }
  // Sort sizes numerically within each group
  for (const g of map.values()) {
    g.sizes.sort((a, b) => {
      const na = parseFloat(a.size), nb = parseFloat(b.size);
      return isNaN(na) || isNaN(nb) ? a.size.localeCompare(b.size) : na - nb;
    });
  }
  if (map.size === 0) {
    map.set("", { color: "", image: "", expanded: true, sizes: [{ size: "", sku: "", stock: 0, price: "" }] });
  }
  return Array.from(map.values());
}

export function ProductForm({ categories, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData?.id;
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [form, setForm] = useState<ProductFormData>({
    id: initialData?.id,
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    sku: initialData?.sku || "",
    price: initialData?.price || "",
    comparePrice: initialData?.comparePrice || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "",
    isActive: initialData?.isActive ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    tags: initialData?.tags || "",
    images: initialData?.images || [],
    colorGroups: groupVariants(initialData?.variants),
  });

  // ── Image compression helper ─────────────────────────────────────────────────

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

  // ── Product images ────────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const urls = await Promise.all(Array.from(files).map(compressImage));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch {
      toast({ title: "Erro ao processar imagem", variant: "destructive" });
    }
    setUploadingImage(false);
    e.target.value = "";
  };

  // ── Color group helpers ───────────────────────────────────────────────────────

  const updateGroup = (gi: number, fn: (g: ColorGroup) => ColorGroup) => {
    setForm((f) => ({ ...f, colorGroups: f.colorGroups.map((g, i) => i === gi ? fn(g) : g) }));
  };

  const addColorGroup = () => {
    setForm((f) => ({
      ...f,
      colorGroups: [...f.colorGroups, { color: "", image: "", expanded: true, sizes: [{ size: "", sku: "", stock: 0, price: "" }] }],
    }));
  };

  const removeColorGroup = (gi: number) => {
    setForm((f) => ({ ...f, colorGroups: f.colorGroups.filter((_, i) => i !== gi) }));
  };

  const uploadVariantImage = async (gi: number, file: File) => {
    try {
      const url = await compressImage(file);
      updateGroup(gi, (g) => ({ ...g, image: url }));
    } catch {
      toast({ title: "Erro ao processar imagem da cor", variant: "destructive" });
    }
  };

  const addSize = (gi: number) => {
    updateGroup(gi, (g) => ({ ...g, sizes: [...g.sizes, { size: "", sku: "", stock: 0, price: "" }] }));
  };

  const removeSize = (gi: number, si: number) => {
    updateGroup(gi, (g) => ({ ...g, sizes: g.sizes.filter((_, i) => i !== si) }));
  };

  const updateSize = (gi: number, si: number, field: keyof SizeVariant, value: string | number) => {
    updateGroup(gi, (g) => ({
      ...g,
      sizes: g.sizes.map((s, i) => i === si ? { ...s, [field]: value } : s),
    }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const variants = form.colorGroups.flatMap((cg) =>
      cg.sizes
        .filter((s) => s.size)
        .map((s) => ({
          id: s.id,
          size: s.size,
          color: cg.color || null,
          image: cg.image || null,
          sku: s.sku || null,
          stock: s.stock,
          price: s.price || null,
        }))
    );

    const body = {
      ...form,
      colorGroups: undefined,
      variants,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const url = isEdit ? `/api/produtos/${form.id}` : "/api/produtos";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      toast({ title: isEdit ? "Produto atualizado!" : "Produto criado!", variant: "success" });
      router.push("/admin/produtos");
      router.refresh();
    } else {
      toast({ title: "Erro ao salvar produto", variant: "destructive" });
    }
  };

  // ── Size range summary ────────────────────────────────────────────────────────

  const sizeRangeSummary = (sizes: SizeVariant[]) => {
    const filled = sizes.map((s) => s.size).filter(Boolean);
    if (filled.length === 0) return "Nenhum tamanho";
    if (filled.length === 1) return `Tamanho: ${filled[0]}`;
    const nums = filled.map((s) => parseFloat(s)).filter((n) => !isNaN(n)).sort((a, b) => a - b);
    if (nums.length === filled.length) return `Tamanhos: ${nums[0]} ao ${nums[nums.length - 1]}`;
    return `Tamanhos: ${filled.join(", ")}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Basic info */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-bold text-lg">Informações Básicas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="gerado-automaticamente" />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="price">Preço *</Label>
            <Input id="price" required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <Label htmlFor="comparePrice">Preço Original (riscado)</Label>
            <Input id="comparePrice" type="number" step="0.01" min="0" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="bota, couro, impermeável" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-cat-yellow" />
              <span className="text-sm font-medium">Produto ativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 accent-cat-yellow" />
              <span className="text-sm font-medium">Destaque na home</span>
            </label>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-bold text-lg">Imagens do Produto</h2>
        <div className="flex flex-wrap gap-3">
          {form.images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border group bg-white">
              <Image src={img} alt="" fill className="object-contain" />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
          <label className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cat-yellow transition-colors ${uploadingImage ? "opacity-50" : ""}`}>
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Upload</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
          </label>
        </div>
      </div>

      {/* Variants — grouped by color */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Variantes</h2>
            <p className="text-xs text-gray-500 mt-0.5">Agrupe por cor. Cada cor pode ter uma imagem e múltiplos tamanhos.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addColorGroup}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar Cor
          </Button>
        </div>

        <div className="space-y-3">
          {form.colorGroups.map((group, gi) => (
            <div key={gi} className="border rounded-xl overflow-hidden">
              {/* Color group header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                {/* Color image thumbnail */}
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border bg-white">
                  {group.image ? (
                    <img src={group.image} alt={group.color} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100 bg-black/40 flex items-center justify-center transition-opacity" title="Upload imagem da cor">
                    <Upload className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadVariantImage(gi, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {/* Color name */}
                <input
                  type="text"
                  value={group.color}
                  onChange={(e) => updateGroup(gi, (g) => ({ ...g, color: e.target.value }))}
                  placeholder="Nome da cor (ex: Preto)"
                  className="flex-1 min-w-0 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-cat-yellow bg-white"
                />

                {/* Summary when collapsed */}
                {!group.expanded && (
                  <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">
                    {sizeRangeSummary(group.sizes)}
                  </span>
                )}

                {/* Expand/collapse + delete */}
                <button
                  type="button"
                  onClick={() => updateGroup(gi, (g) => ({ ...g, expanded: !g.expanded }))}
                  className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                  title={group.expanded ? "Recolher" : "Expandir"}
                >
                  {group.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {form.colorGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColorGroup(gi)}
                    className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                    title="Remover cor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Size rows (expanded) */}
              {group.expanded && (
                <div className="px-4 py-3 space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-gray-400 uppercase border-b">
                        <tr>
                          <th className="text-left pb-2 pr-3">Tamanho *</th>
                          <th className="text-left pb-2 pr-3">SKU</th>
                          <th className="text-left pb-2 pr-3">Estoque</th>
                          <th className="text-left pb-2 pr-3">Preço especial</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.sizes.map((sv, si) => (
                          <tr key={si} className="border-b last:border-0">
                            <td className="py-1.5 pr-3">
                              <Input
                                value={sv.size}
                                onChange={(e) => updateSize(gi, si, "size", e.target.value)}
                                placeholder="38"
                                className="h-8 w-16"
                              />
                            </td>
                            <td className="py-1.5 pr-3">
                              <Input
                                value={sv.sku}
                                onChange={(e) => updateSize(gi, si, "sku", e.target.value)}
                                placeholder="SKU-38P"
                                className="h-8 w-28"
                              />
                            </td>
                            <td className="py-1.5 pr-3">
                              <Input
                                type="number"
                                min="0"
                                value={sv.stock}
                                onChange={(e) => updateSize(gi, si, "stock", parseInt(e.target.value) || 0)}
                                className="h-8 w-20"
                              />
                            </td>
                            <td className="py-1.5 pr-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sv.price}
                                onChange={(e) => updateSize(gi, si, "price", e.target.value)}
                                placeholder="Padrão"
                                className="h-8 w-28"
                              />
                            </td>
                            <td className="py-1.5">
                              {group.sizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSize(gi, si)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => addSize(gi)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-cat-black transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Adicionar tamanho
                  </button>
                </div>
              )}

              {/* Collapsed summary */}
              {!group.expanded && (
                <div className="px-4 py-2 text-xs text-gray-400 border-t bg-gray-50 sm:hidden">
                  {sizeRangeSummary(group.sizes)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Produto"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
