"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Eye, EyeOff, ExternalLink, CheckCircle, XCircle, Loader2, Webhook } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MpSettings {
  mp_access_token: string;
  mp_public_key: string;
  mp_webhook_secret: string;
}

export default function IntegracaoPage() {
  const [settings, setSettings] = useState<MpSettings>({
    mp_access_token: "",
    mp_public_key: "",
    mp_webhook_secret: "",
  });
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
      })
      .catch(() => {});
  }, []);

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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Integração — Mercado Pago</h1>
        <p className="text-sm text-gray-500 mt-1">Configure o gateway de pagamento da loja</p>
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
  );
}
