"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Globe, Zap, Upload, Loader2, CheckCircle, XCircle, ExternalLink, Webhook, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

interface GeneralSettings {
  siteTitle: string;
  siteDescription: string;
  favicon: string;
}

interface PixSettings {
  pixDiscountPct: string;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement("img");
      img.onload = () => {
        const SIZE = 64;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE; canvas.height = SIZE;
        canvas.getContext("2d")!.drawImage(img, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function IntegracaoPage() {
  const [general, setGeneral] = useState<GeneralSettings>({ siteTitle: "", siteDescription: "", favicon: "" });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const faviconRef = useRef<HTMLInputElement>(null);
  const [testingUtm, setTestingUtm] = useState(false);
  const [pix, setPix] = useState<PixSettings>({ pixDiscountPct: "5" });
  const [savingPix, setSavingPix] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Record<string, unknown>) => {
        setGeneral({
          siteTitle: (data.siteTitle as string) || "",
          siteDescription: (data.siteDescription as string) || "",
          favicon: (data.favicon as string) || "",
        });
        setPix({
          pixDiscountPct: data.pixDiscountPct !== undefined ? String(data.pixDiscountPct) : "5",
        });
      })
      .catch(() => {});
  }, []);

  const savePix = async () => {
    const pct = parseFloat(pix.pixDiscountPct.replace(",", "."));
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      toast({ title: "Digite um percentual válido (0 a 100)", variant: "destructive" });
      return;
    }
    setSavingPix(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pixDiscountPct: pct }),
    });
    setSavingPix(false);
    if (res.ok) toast({ title: "Desconto do PIX salvo!", variant: "success" as never });
    else toast({ title: "Erro ao salvar", variant: "destructive" });
  };

  const handleFaviconUpload = async (file: File) => {
    setUploadingFavicon(true);
    try {
      const url = await compressImage(file);
      setGeneral((g) => ({ ...g, favicon: url }));
    } catch {
      toast({ title: "Erro ao processar favicon", variant: "destructive" });
    }
    setUploadingFavicon(false);
  };

  const saveGeneral = async () => {
    setSavingGeneral(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(general),
    });
    setSavingGeneral(false);
    if (res.ok) toast({ title: "Informações salvas!", variant: "success" as never });
    else toast({ title: "Erro ao salvar", variant: "destructive" });
  };

  const testUtmify = async () => {
    setTestingUtm(true);
    try {
      const res = await fetch("/api/utmify/test", { method: "POST" });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (res.ok && data.success) {
        toast({ title: "Conexão OK!", description: data.message || "Evento de teste enviado com sucesso.", variant: "success" as never });
      } else {
        toast({ title: "Falha no teste", description: data.error || "Erro desconhecido", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de rede", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    } finally {
      setTestingUtm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Configurações &amp; Integrações</h1>
        <p className="text-sm text-gray-500 mt-1">Informações gerais da loja e integrações externas</p>
      </div>

      {/* ─── Informações Gerais ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-cat-black" />
          <h2 className="text-lg font-black text-cat-black">Informações Gerais</h2>
        </div>
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Título do site (aba do navegador)</label>
            <input
              value={general.siteTitle}
              onChange={(e) => setGeneral((g) => ({ ...g, siteTitle: e.target.value }))}
              placeholder="Ex: Minha Loja — Calçados Caterpillar"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição (SEO / compartilhamento)</label>
            <textarea
              value={general.siteDescription}
              onChange={(e) => setGeneral((g) => ({ ...g, siteDescription: e.target.value }))}
              placeholder="Descrição curta da loja para mecanismos de busca..."
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow resize-none"
            />
          </div>

          {/* Favicon */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Favicon (ícone da aba)</label>
            <div className="flex items-center gap-3">
              {general.favicon ? (
                <div className="w-10 h-10 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                  <Image src={general.favicon} alt="favicon" width={32} height={32} className="object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                  ?
                </div>
              )}
              <button
                onClick={() => faviconRef.current?.click()}
                disabled={uploadingFavicon}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {uploadingFavicon ? "Processando..." : general.favicon ? "Trocar" : "Enviar imagem"}
              </button>
              {general.favicon && (
                <button
                  onClick={() => setGeneral((g) => ({ ...g, favicon: "" }))}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remover
                </button>
              )}
              <input
                ref={faviconRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFaviconUpload(f); e.target.value = ""; }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">PNG, JPG ou SVG — redimensionado para 64×64 px automaticamente.</p>
          </div>

          <button onClick={saveGeneral} disabled={savingGeneral}
            className="flex items-center gap-2 px-4 py-2 bg-cat-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" />
            {savingGeneral ? "Salvando..." : "Salvar Informações"}
          </button>
        </div>
      </div>

      {/* ─── Desconto PIX ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-cat-black" />
          <h2 className="text-lg font-black text-cat-black">Desconto no PIX</h2>
        </div>
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Percentual de desconto aplicado quando o cliente escolhe pagar via PIX — aparece na página
            do produto e é descontado de verdade do valor cobrado no checkout.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Desconto (%)</label>
            <div className="flex items-center gap-2">
              <input
                value={pix.pixDiscountPct}
                onChange={(e) => setPix({ pixDiscountPct: e.target.value })}
                placeholder="5"
                inputMode="decimal"
                className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
          <button onClick={savePix} disabled={savingPix}
            className="flex items-center gap-2 px-4 py-2 bg-cat-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" />
            {savingPix ? "Salvando..." : "Salvar Desconto"}
          </button>
        </div>
      </div>

      {/* ─── UTMify ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-cat-black" />
          <h2 className="text-lg font-black text-cat-black">UTMify</h2>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Ativo</span>
        </div>
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-800">Chave configurada na Vercel</p>
              <p className="text-xs text-green-700 mt-0.5">
                A <strong>UTMIFY_API_KEY</strong> está armazenada como variável de ambiente na Vercel —
                nunca exposta ao banco de dados ou ao navegador.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Envia automaticamente eventos de <strong>pedido criado</strong>, <strong>pagamento pendente</strong> e{" "}
            <strong>pedido pago</strong> para a UTMify, permitindo rastrear conversões por canal.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={testUtmify} disabled={testingUtm}
              className="flex items-center gap-2 px-4 py-2 bg-cat-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-colors">
              {testingUtm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {testingUtm ? "Testando..." : "Testar Conexão"}
            </button>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 underline"
            >
              Gerenciar na Vercel <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-gray-400">
            Para alterar a chave: acesse <strong>Vercel → Settings → Environment Variables → UTMIFY_API_KEY</strong>
            {" "}e redeploy.
          </p>
        </div>
      </div>

      {/* ─── Mercado Pago ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-cat-black" />
          <h2 className="text-lg font-black text-cat-black">Mercado Pago</h2>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Ativo</span>
        </div>
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-800">Credenciais configuradas na Vercel</p>
              <p className="text-xs text-green-700 mt-0.5">
                As chaves do Mercado Pago estão armazenadas como variáveis de ambiente na Vercel —
                isoladas do banco de dados e nunca expostas ao navegador.
              </p>
            </div>
          </div>

          {/* Env vars table */}
          <div className="border rounded-xl overflow-hidden">
            {[
              { name: "MP_ACCESS_TOKEN", label: "Access Token (Chave Privada)", note: "Usado no servidor — nunca vai ao front-end" },
              { name: "MP_PUBLIC_KEY",   label: "Chave Pública",                note: "Enviada ao navegador para tokenizar cartão" },
              { name: "MP_WEBHOOK_SECRET", label: "Webhook Secret",             note: "Verifica assinatura dos eventos do MP" },
            ].map((v, i) => (
              <div key={v.name} className={`flex items-start gap-3 p-3 ${i > 0 ? "border-t" : ""}`}>
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                <div className="min-w-0">
                  <code className="text-xs font-mono font-bold text-gray-800">{v.name}</code>
                  <p className="text-xs text-gray-500 mt-0.5">{v.label} — {v.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* How to update */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-blue-800">Como obter ou atualizar as credenciais</p>
            <ol className="text-xs text-blue-700 space-y-1.5 list-decimal pl-4">
              <li>
                Acesse{" "}
                <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer"
                  className="underline font-bold inline-flex items-center gap-0.5">
                  Mercado Pago Developers <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Crie ou selecione um aplicativo → <strong>Credenciais</strong></li>
              <li>Copie o Access Token e a Chave Pública</li>
              <li>
                Acesse{" "}
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
                  className="underline font-bold inline-flex items-center gap-0.5">
                  Vercel <ExternalLink className="w-3 h-3" />
                </a>{" "}
                → seu projeto → <strong>Settings → Environment Variables</strong>
              </li>
              <li>Atualize os valores e clique em <strong>Redeploy</strong> para aplicar</li>
            </ol>
          </div>

          {/* Webhook info */}
          <div className="bg-gray-50 border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Webhook className="w-4 h-4 text-gray-500" />
              <p className="text-xs font-bold text-gray-700">URL do Webhook (MP → Webhooks)</p>
            </div>
            <code className="text-xs text-gray-600 break-all">https://seu-dominio.vercel.app/api/payments/webhook</code>
            <p className="text-xs text-gray-400 mt-1">Configure com evento <strong>Pagamentos</strong> no painel MP.</p>
          </div>

          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 underline"
          >
            Gerenciar variáveis na Vercel <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
