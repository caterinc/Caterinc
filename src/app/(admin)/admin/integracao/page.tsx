"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Eye, EyeOff, ExternalLink, CheckCircle, XCircle, Loader2, Webhook, Globe, Zap, Upload, HelpCircle, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

interface MpSettings {
  mp_access_token: string;
  mp_public_key: string;
  mp_webhook_secret: string;
}

interface GeneralSettings {
  siteTitle: string;
  siteDescription: string;
  favicon: string;
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
  const [settings, setSettings] = useState<MpSettings>({
    mp_access_token: "",
    mp_public_key: "",
    mp_webhook_secret: "",
  });
  const [general, setGeneral] = useState<GeneralSettings>({ siteTitle: "", siteDescription: "", favicon: "" });
  const [utmifyKey, setUtmifyKey] = useState("");
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingUtm, setSavingUtm] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const faviconRef = useRef<HTMLInputElement>(null);
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [testInfo,   setTestInfo]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setSettings({
          mp_access_token:   data.mp_access_token   || "",
          mp_public_key:     data.mp_public_key     || "",
          mp_webhook_secret: data.mp_webhook_secret || "",
        });
        setGeneral({
          siteTitle: data.siteTitle || "",
          siteDescription: data.siteDescription || "",
          favicon: data.favicon || "",
        });
        setUtmifyKey(data.utmify_api_key || "");
      })
      .catch(() => {});
  }, []);

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

  const saveUtmify = async () => {
    setSavingUtm(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utmify_api_key: utmifyKey }),
    });
    setSavingUtm(false);
    if (res.ok) toast({ title: "Chave UTMify salva!", variant: "success" as never });
    else toast({ title: "Erro ao salvar", variant: "destructive" });
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast({ title: "Configurações salvas!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setTestInfo(null);
    try {
      const token = settings.mp_access_token.trim();
      if (!token) { setTestResult("fail"); setTestInfo("Cole o Access Token antes de testar."); return; }

      const r = await fetch("/api/settings/test-mp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await r.json()) as { ok: boolean; email?: string; site?: string; error?: string };

      if (data.ok) {
        setTestResult("ok");
        setTestInfo(data.email ? `Conta: ${data.email}` : "Token válido!");
      } else {
        setTestResult("fail");
        setTestInfo(data.error || "Token inválido. Verifique se copiou completo.");
      }
    } catch {
      setTestResult("fail");
      setTestInfo("Erro de rede. Verifique sua conexão.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Configurações &amp; Integrações</h1>
        <p className="text-sm text-gray-500 mt-1">Informações gerais, favicon, UTMify e Mercado Pago</p>
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Favicon (ícone da aba do navegador)</label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg border bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {general.favicon
                  ? <Image src={general.favicon} alt="favicon" width={32} height={32} className="object-contain" />
                  : <span className="text-[10px] text-gray-300 text-center leading-tight">sem favicon</span>
                }
              </div>
              <div className="flex flex-col gap-1.5">
                <input ref={faviconRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFaviconUpload(f); }} />
                <button onClick={() => faviconRef.current?.click()} disabled={uploadingFavicon}
                  className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-cat-yellow hover:text-cat-black transition-colors disabled:opacity-50">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingFavicon ? "Processando..." : general.favicon ? "Trocar" : "Enviar favicon"}
                </button>
                {general.favicon && (
                  <button onClick={() => setGeneral((g) => ({ ...g, favicon: "" }))} className="text-xs text-red-500 hover:underline text-left">
                    Remover
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 leading-tight">PNG quadrado<br />mínimo 32×32 px</p>
            </div>
          </div>
          <button onClick={saveGeneral} disabled={savingGeneral}
            className="flex items-center gap-2 px-4 py-2 bg-cat-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" />
            {savingGeneral ? "Salvando..." : "Salvar Informações"}
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
          <p className="text-xs text-gray-500 leading-relaxed">
            Quando configurado, envia automaticamente os eventos de pedido criado, pagamento pendente e pedido pago
            para o UTMify — permitindo rastrear conversões por canal.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Chave de API
              <a href="https://app.utmify.com.br/credentials" target="_blank" rel="noopener noreferrer"
                className="ml-2 text-blue-600 underline inline-flex items-center gap-0.5">
                Encontrar no painel UTMify <HelpCircle className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              value={utmifyKey}
              onChange={(e) => setUtmifyKey(e.target.value)}
              placeholder="Cole sua chave de API aqui..."
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cat-yellow"
              autoComplete="off"
            />
            <p className="text-xs text-gray-400 mt-1">Armazenada com segurança — nunca exposta ao navegador.</p>
          </div>
          <button onClick={saveUtmify} disabled={savingUtm}
            className="flex items-center gap-2 px-4 py-2 bg-cat-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" />
            {savingUtm ? "Salvando..." : "Salvar Chave UTMify"}
          </button>
        </div>
      </div>

      {/* ─── Mercado Pago ─── */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-black text-gray-900">Mercado Pago</h2>
          <p className="text-sm text-gray-500">Configure o gateway de pagamento da loja</p>
        </div>

        {/* Security notice */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-green-800">Suas credenciais são protegidas</p>
          <p className="text-xs text-green-700 mt-0.5">
            O <strong>Access Token</strong> fica no banco de dados com acesso restrito ao servidor — nunca é enviado ao navegador.
            Somente a <strong>Chave Pública</strong> vai ao cliente (esse é o design oficial do MP).
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Access Token */}
        <div className="bg-white rounded-2xl border p-5">
          <label className="block text-sm font-bold text-gray-800 mb-1">
            Access Token (Chave Privada) *
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Começa com <code className="bg-gray-100 px-1 rounded">APP_USR-</code> ou <code className="bg-gray-100 px-1 rounded">TEST-</code>.
            Nunca compartilhe. Nunca vai para o front-end.
          </p>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={settings.mp_access_token}
              onChange={(e) => setSettings((s) => ({ ...s, mp_access_token: e.target.value }))}
              placeholder="APP_USR-000000000000000-000000-..."
              className="w-full h-11 pl-4 pr-12 border-2 border-gray-200 rounded-xl text-sm font-mono focus:border-gray-800 focus:outline-none"
              autoComplete="off"
            />
            <button type="button" onClick={() => setShowToken((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Public Key */}
        <div className="bg-white rounded-2xl border p-5">
          <label className="block text-sm font-bold text-gray-800 mb-1">
            Chave Pública (Public Key) *
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Enviada ao navegador para tokenização do cartão (seguro por design do MP).
          </p>
          <input
            type="text"
            value={settings.mp_public_key}
            onChange={(e) => setSettings((s) => ({ ...s, mp_public_key: e.target.value }))}
            placeholder="APP_USR-00000000-0000-0000-0000-000000000000"
            className="w-full h-11 px-4 border-2 border-gray-200 rounded-xl text-sm font-mono focus:border-gray-800 focus:outline-none"
          />
        </div>

        {/* Webhook Secret */}
        <div className="bg-white rounded-2xl border p-5">
          <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
            <Webhook className="w-4 h-4" /> Secret do Webhook (recomendado)
          </label>
          <p className="text-xs text-gray-400 mb-3">
            URL do webhook:{" "}
            <code className="bg-gray-100 px-1 rounded text-[11px]">https://seu-dominio.com/api/payments/webhook</code>
            <br />Configure no painel MP → Webhooks → evento <strong>Pagamentos</strong>.
          </p>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={settings.mp_webhook_secret}
              onChange={(e) => setSettings((s) => ({ ...s, mp_webhook_secret: e.target.value }))}
              placeholder="Gerado pelo Mercado Pago no painel de webhooks"
              className="w-full h-11 pl-4 pr-12 border-2 border-gray-200 rounded-xl text-sm font-mono focus:border-gray-800 focus:outline-none"
              autoComplete="off"
            />
            <button type="button" onClick={() => setShowSecret((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Test + Save */}
        <div className="flex gap-3">
          <button onClick={testConnection} disabled={testing || !settings.mp_access_token}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold hover:border-gray-400 disabled:opacity-50 transition-colors">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> :
              testResult === "ok"   ? <CheckCircle className="w-4 h-4 text-green-500" /> :
              testResult === "fail" ? <XCircle className="w-4 h-4 text-red-500" />      : null}
            Testar conexão
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-cat-black text-white font-bold rounded-xl disabled:opacity-60">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar configurações"}
          </button>
        </div>

        {testResult === "ok" && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Conexão bem-sucedida! {testInfo}</span>
          </div>
        )}
        {testResult === "fail" && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Falha na conexão</p>
              {testInfo && <p className="text-xs mt-0.5">{testInfo}</p>}
              <ul className="text-xs mt-1.5 space-y-0.5 list-disc pl-3 text-red-600">
                <li>Copie o token completo (começa com <code>APP_USR-</code> ou <code>TEST-</code>)</li>
                <li>Verifique se não tem espaço no início ou fim</li>
                <li>Token de teste e produção são diferentes — use o correto</li>
              </ul>
            </div>
          </div>
        )}

        {/* Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-blue-800 mb-3">Como obter as credenciais</p>
          <ol className="text-xs text-blue-700 space-y-2 list-decimal pl-4">
            <li>Acesse{" "}
              <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer"
                className="underline font-bold inline-flex items-center gap-0.5">
                Mercado Pago Developers <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Crie ou selecione um aplicativo</li>
            <li>Vá em <strong>Credenciais</strong> → copie o Access Token e a Chave Pública</li>
            <li>Use credenciais de <strong>teste</strong> para validar, <strong>produção</strong> quando for ao ar</li>
            <li>Para webhook: crie com evento <strong>Pagamentos</strong> e copie o secret gerado</li>
          </ol>
        </div>

        {/* Security reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-800 mb-2">Boas práticas de segurança</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
            <li>Nunca compartilhe o Access Token por mensagem, e-mail ou código</li>
            <li>Em produção, prefira variáveis de ambiente no servidor (Vercel, Railway) ao banco de dados</li>
            <li>Rotacione as credenciais se suspeitar de vazamento</li>
            <li>Use credenciais de teste durante o desenvolvimento</li>
          </ul>
        </div>
      </div>
    </div>
    </div>
  );
}
