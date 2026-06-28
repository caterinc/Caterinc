"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Save, RefreshCw } from "lucide-react";

const DEFAULT_COLORS = {
  primaryColor: "#FFCD11",
  secondaryColor: "#000000",
  accentColor: "#333333",
  storeName: "CAT Store",
  storeDescription: "Calçados robustos e duráveis para quem não para.",
  phone: "(11) 3000-0000",
  email: "contato@catstore.com.br",
  address: "Av. Paulista, 1000 - São Paulo, SP",
  shippingFee: "29.90",
  freeShippingThreshold: "299.00",
};

export default function CoresPage() {
  const [settings, setSettings] = useState(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({ ...DEFAULT_COLORS, ...data });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Configurações salvas!", variant: "success" });
    } else {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const reset = () => setSettings(DEFAULT_COLORS);

  if (loading) return <div className="text-gray-400 py-8 text-center">Carregando configurações...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <a href="/admin/visual" className="hover:text-cat-black">← Editor Visual</a>
      </div>
      <h1 className="text-2xl font-black text-cat-black mb-6">Cores e Configurações</h1>

      {/* Color preview */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-bold mb-4">Preview de Cores</h2>
        <div className="flex gap-4 mb-6">
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-xl border shadow-sm"
              style={{ backgroundColor: settings.primaryColor }}
            />
            <span className="text-xs text-gray-500">Primária</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-xl border shadow-sm"
              style={{ backgroundColor: settings.secondaryColor }}
            />
            <span className="text-xs text-gray-500">Secundária</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-xl border shadow-sm"
              style={{ backgroundColor: settings.accentColor }}
            />
            <span className="text-xs text-gray-500">Destaque</span>
          </div>
        </div>

        {/* Simulated header preview */}
        <div className="rounded-lg overflow-hidden border">
          <div
            className="px-4 py-2 flex items-center justify-between text-white"
            style={{ backgroundColor: settings.secondaryColor }}
          >
            <div
              className="font-black text-sm px-2 py-0.5"
              style={{ backgroundColor: settings.primaryColor, color: settings.secondaryColor }}
            >
              CAT
            </div>
            <div className="flex gap-4 text-xs opacity-70">
              <span>Produtos</span>
              <span>Botas</span>
              <span>Tênis</span>
            </div>
          </div>
          <div
            className="text-center text-xs py-1 font-semibold"
            style={{ backgroundColor: settings.primaryColor, color: settings.secondaryColor }}
          >
            Frete grátis acima de R$ 299
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="bg-white rounded-xl border p-6 mb-6 space-y-4">
        <h2 className="font-bold">Cores do Tema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Cor Primária</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="h-10 w-12 rounded border cursor-pointer"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <Label>Cor Secundária</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="h-10 w-12 rounded border cursor-pointer"
              />
              <Input
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <Label>Cor de Destaque</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="h-10 w-12 rounded border cursor-pointer"
              />
              <Input
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Store info */}
      <div className="bg-white rounded-xl border p-6 mb-6 space-y-4">
        <h2 className="font-bold">Informações da Loja</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Nome da Loja</Label>
            <Input value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Input value={settings.storeDescription} onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          </div>
          <div>
            <Label>Valor do Frete (R$)</Label>
            <Input type="number" step="0.01" value={settings.shippingFee} onChange={(e) => setSettings({ ...settings, shippingFee: e.target.value })} />
          </div>
          <div>
            <Label>Frete Grátis Acima de (R$)</Label>
            <Input type="number" step="0.01" value={settings.freeShippingThreshold} onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
        <Button variant="outline" size="lg" onClick={reset}>
          <RefreshCw className="w-4 h-4 mr-2" /> Restaurar Padrão
        </Button>
      </div>
    </div>
  );
}
