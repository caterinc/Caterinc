"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Upload, ExternalLink } from "lucide-react";
import Image from "next/image";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  order: number;
  isActive: boolean;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", image: "", link: "" });

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    setLoading(true);
    const res = await fetch("/api/banners");
    if (res.ok) setBanners(await res.json());
    setLoading(false);
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement("img");
        img.onload = () => {
          const MAX = 1400;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await compressImage(file);
      setForm((f) => ({ ...f, image: url }));
    } catch {
      toast({ title: "Erro ao processar imagem", variant: "destructive" });
    }
    setUploadingImg(false);
    e.target.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/banners/${editing.id}` : "/api/banners";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, order: editing?.order ?? banners.length }),
    });
    if (res.ok) {
      toast({ title: editing ? "Banner atualizado!" : "Banner criado!", variant: "success" });
      setShowForm(false);
      setEditing(null);
      setForm({ title: "", subtitle: "", image: "", link: "" });
      loadBanners();
    } else {
      toast({ title: "Erro ao salvar banner", variant: "destructive" });
    }
  };

  const toggleActive = async (banner: Banner) => {
    const res = await fetch(`/api/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !banner.isActive }),
    });
    if (res.ok) loadBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este banner?")) return;
    const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Banner excluído", variant: "success" });
      loadBanners();
    }
  };

  const startEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image,
      link: banner.link || "",
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <a href="/admin/visual" className="text-gray-400 hover:text-cat-black text-sm">← Editor Visual</a>
        </div>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", subtitle: "", image: "", link: "" }); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Banner
        </Button>
      </div>

      <h1 className="text-2xl font-black text-cat-black mb-6">Gerenciar Banners</h1>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="font-bold mb-4">{editing ? "Editar" : "Novo"} Banner</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Título *</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div>
                <Label>Link (ao clicar)</Label>
                <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/produtos" />
              </div>
              <div>
                <Label>Imagem</Label>
                <div className="flex gap-2">
                  <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/uploads/banner.jpg" className="flex-1" />
                  <label className="cursor-pointer">
                    <div className="h-10 px-3 border rounded-md flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                      <Upload className="w-4 h-4 text-gray-500" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                  </label>
                </div>
              </div>
            </div>
            {form.image && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                <Image src={form.image} alt="Preview" fill className="object-cover" />
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit">Salvar</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Carregando...</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border text-gray-400">
            <p>Nenhum banner cadastrado</p>
          </div>
        ) : banners.map((banner) => (
          <div key={banner.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${!banner.isActive ? "opacity-60" : ""}`}>
            <GripVertical className="w-5 h-5 text-gray-300 cursor-grab flex-shrink-0" />
            <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {banner.image && <Image src={banner.image} alt={banner.title} fill className="object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-cat-black">{banner.title}</p>
              {banner.subtitle && <p className="text-sm text-gray-500 line-clamp-1">{banner.subtitle}</p>}
              {banner.link && (
                <p className="text-xs text-blue-500 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> {banner.link}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(banner)}
                className={`p-2 rounded-lg transition-colors ${banner.isActive ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                title={banner.isActive ? "Desativar" : "Ativar"}
              >
                {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => startEdit(banner)} className="p-2 rounded-lg text-gray-400 hover:text-cat-black hover:bg-gray-100 transition-colors">
                <span className="text-xs font-medium">Editar</span>
              </button>
              <button onClick={() => handleDelete(banner.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
