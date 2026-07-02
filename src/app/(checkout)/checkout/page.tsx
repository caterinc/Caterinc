"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Loader2, Copy, Check, ChevronDown, ChevronUp,
  ShoppingBag, Truck, CreditCard, Smartphone, User,
  Minus, Plus, ArrowLeft,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

function PixIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,50 L32,23 Q50,4 68,23 Z"/>
      <path d="M50,50 L77,32 Q96,50 77,68 Z"/>
      <path d="M50,50 L68,77 Q50,96 32,77 Z"/>
      <path d="M50,50 L23,68 Q4,50 23,32 Z"/>
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "dados" | "endereco" | "pagamento" | "pix";
type PayMethod = "pix" | "card";

interface ShippingMethod {
  id: string; name: string; description: string | null;
  price: number; minDays: number | null; maxDays: number | null; freeAbove: number | null;
}
interface PixResult    { orderId: string; orderNumber: string; qrCode: string; qrCodeBase64: string; total: number }

const STEP_COLOR = "var(--vep-checkout-step-active-bg, #16c789)";
const STEP_TEXT  = "var(--vep-checkout-step-active-text, #fff)";
const DONE_COLOR = "var(--vep-checkout-step-done-bg, #16c789)";

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [left]);
  const m = Math.floor(left / 60);
  const s = left % 60;
  return (
    <span className="font-mono font-black text-sm" style={{ color: STEP_COLOR }}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepBar({ step }: { step: 0 | 1 | 2 }) {
  const steps = [
    { label: "Informações pessoais", icon: User },
    { label: "Entrega",              icon: Truck },
    { label: "Pagamento",            icon: CreditCard },
  ];
  return (
    <div className="flex items-start justify-between w-full mb-6">
      {steps.map(({ label, icon: Icon }, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <div key={i} className="flex flex-col items-center flex-1 relative">
            {/* connector line left */}
            {i > 0 && (
              <div
                className="absolute left-0 top-5 h-0.5 w-1/2 -translate-y-1/2"
                style={{ backgroundColor: i <= step ? DONE_COLOR : "#E5E7EB" }}
              />
            )}
            {/* connector line right */}
            {i < 2 && (
              <div
                className="absolute right-0 top-5 h-0.5 w-1/2 -translate-y-1/2"
                style={{ backgroundColor: i < step ? DONE_COLOR : "#E5E7EB" }}
              />
            )}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center z-10 border-2 transition-all"
              style={
                done || active
                  ? { backgroundColor: STEP_COLOR, borderColor: STEP_COLOR, color: STEP_TEXT }
                  : { backgroundColor: "#fff", borderColor: "#D1D5DB", color: "#9CA3AF" }
              }
            >
              {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span
              className="text-[10px] font-semibold mt-1 text-center leading-tight"
              style={{ color: active || done ? DONE_COLOR : "#9CA3AF" }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

const inp = "w-full h-12 px-4 pr-10 border rounded-lg text-[16px] focus:outline-none transition-colors bg-white";

function ValidatedInput({
  label, required = false, valid = false, type = "text", value, onChange, placeholder, inputMode, maxLength, autoComplete,
}: {
  label: string; required?: boolean; valid?: boolean; type?: string;
  value: string; onChange: (v: string) => void; placeholder?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number; autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} inputMode={inputMode} maxLength={maxLength}
          autoComplete={autoComplete}
          className={`${inp} border-2 border-gray-200 focus:border-gray-400`}
        />
        {valid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: STEP_COLOR }}>
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
        style={{ backgroundColor: STEP_COLOR, color: STEP_TEXT }}>
        {num}
      </div>
      <h2 className="text-lg font-black text-gray-900">{title}</h2>
    </div>
  );
}

// ─── CPF mask ─────────────────────────────────────────────────────────────────

function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}
function maskCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0,5)}-${d.slice(5)}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { state, total, isHydrated, dispatch } = useCart();
  const { items } = state;
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("dados");
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  // consent removed — hardcoded true in payload
  const [payMethod, setPayMethod] = useState<PayMethod>("pix");

  const [personal, setPersonal] = useState({ name: "", email: "", cpf: "", phone: "" });
  const [address, setAddress] = useState({ zipCode: "", street: "", number: "", complement: "", district: "", city: "", state: "" });

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);

  const [pixResult,    setPixResult]    = useState<PixResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [pixTimer, setPixTimer] = useState(600);
  const [pixPaid,  setPixPaid]  = useState(false);

  // Restaura PIX do sessionStorage se o cliente recarregar a página
  // Só restaura se o carrinho estiver vazio (pedido já foi gerado)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (items.length > 0) {
        // Novo checkout — descarta qualquer PIX salvo anteriormente
        sessionStorage.removeItem("_pix_result");
        return;
      }
      const saved = sessionStorage.getItem("_pix_result");
      if (saved) {
        const parsed = JSON.parse(saved) as PixResult & { savedAt: number; timerLeft: number };
        const elapsed = Math.floor((Date.now() - parsed.savedAt) / 1000);
        const remaining = (parsed.timerLeft || 600) - elapsed;
        if (remaining > 0) {
          setPixResult(parsed);
          setStage("pix");
          setPixTimer(remaining);
        } else {
          sessionStorage.removeItem("_pix_result");
        }
      }
    } catch {}
  }, [isHydrated, items.length]);

  const shippingCost = selectedShipping
    ? (selectedShipping.freeAbove !== null && total >= selectedShipping.freeAbove ? 0 : selectedShipping.price)
    : 0;
  const orderTotal = total + shippingCost;

  // Load shipping
  useEffect(() => {
    fetch("/api/shipping").then((r) => r.json()).then((data: ShippingMethod[]) => {
      setShippingMethods(data);
      if (data.length > 0) setSelectedShipping(data[0]);
    }).catch(() => {});
  }, []);

  // PIX countdown
  useEffect(() => {
    if (stage !== "pix" || pixPaid) return;
    const t = setInterval(() => setPixTimer((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [stage, pixPaid]);

  // PIX polling
  useEffect(() => {
    if (stage !== "pix" || !pixResult || pixPaid) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/payments/status?orderId=${pixResult.orderId}`);
        const d = (await r.json()) as { paid: boolean };
        if (d.paid) { setPixPaid(true); clearInterval(t); try { sessionStorage.removeItem("_pix_result"); } catch {} setTimeout(() => router.push(`/pedido-confirmado/${pixResult.orderNumber}`), 1800); }
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [stage, pixResult, pixPaid, router]);

  // CEP lookup
  const lookupCep = useCallback(async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = (await r.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (!d.erro) setAddress((a) => ({ ...a, street: d.logradouro || a.street, district: d.bairro || a.district, city: d.localidade || a.city, state: d.uf || a.state }));
    } catch {}
    setCepLoading(false);
  }, []);

  // Submit
  const submit = useCallback(async (cardFormData?: unknown) => {
    setLoading(true);
    try {
      // Read UTMs captured by the layout script
      const utmKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck'];
      const utmData: Record<string, string> = {};
      try { utmKeys.forEach((k) => { const v = localStorage.getItem('_utm_' + k); if (v) utmData[k] = v; }); } catch {}

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personal, address, paymentMethod: payMethod, cardFormData: cardFormData || null,
          consent: true, shippingMethodId: selectedShipping?.id || null,
          utmData: Object.keys(utmData).length > 0 ? utmData : null,
          cartItems: items.map((i) => ({
            productId: i.productId, variantId: i.variantId || null, name: i.name,
            price: i.price, quantity: i.quantity, size: i.size || null, color: i.color || null, image: i.image || null,
          })),
        }),
      });
      const data = (await res.json()) as { error?: string; orderId?: string; orderNumber?: string; total?: number; qrCode?: string; qrCodeBase64?: string; barcode?: string; pdfUrl?: string | null; status?: string; statusDetail?: string };
      if (!res.ok) throw new Error(data.error || "Erro ao processar pedido");
      dispatch({ type: "CLEAR" });
      if (payMethod === "pix") {
        const pr: PixResult = { orderId: data.orderId!, orderNumber: data.orderNumber!, qrCode: data.qrCode!, qrCodeBase64: data.qrCodeBase64!, total: data.total! };
        setPixResult(pr);
        setStage("pix");
        try { sessionStorage.setItem("_pix_result", JSON.stringify({ ...pr, savedAt: Date.now(), timerLeft: 600 })); } catch {}
      } else {
        if (data.status === "rejected") {
          toast({ title: "Cartão recusado", description: data.statusDetail || "Verifique os dados.", variant: "destructive" });
        } else {
          router.push(`/pedido-confirmado/${data.orderNumber}`);
        }
      }
    } catch (err: unknown) {
      toast({ title: "Erro ao processar pedido", description: err instanceof Error ? err.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [personal, address, payMethod, items, dispatch, router, selectedShipping]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 3000);
  };

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (!isHydrated) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
    </div>
  );

  if (items.length === 0 && stage !== "pix") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-gray-50">
      <ShoppingBag className="w-16 h-16 text-gray-200" />
      <h2 className="text-xl font-bold text-gray-700">Carrinho vazio</h2>
      <Link href="/produtos" className="text-sm font-bold underline" style={{ color: STEP_COLOR }}>Ver produtos</Link>
    </div>
  );

  // ── PIX ─────────────────────────────────────────────────────────────────────

  if (stage === "pix" && pixResult) {
    const pm = Math.floor(pixTimer / 60); const ps = pixTimer % 60;
    const timerPct = Math.round((pixTimer / 600) * 100);
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F5F5F5" }}>

  
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">

          {pixPaid ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#16c789" }}>
                <Check className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900">Pagamento confirmado!</h1>
              <p className="text-gray-500 text-sm mt-2">Redirecionando para seu pedido...</p>
            </div>
          ) : (
            <>
              {/* Card principal */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Topo verde */}
                <div className="px-5 py-4" style={{ backgroundColor: "#16c789" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <PixIcon size={22} />
                    </div>
                    <div>
                      <p className="text-white font-black text-base leading-tight">Pague com PIX</p>
                      <p className="text-white/80 text-xs">Aprovação em segundos · Sem taxas</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-5 space-y-5">

                  {/* Valor */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Pedido #{pixResult.orderNumber}</p>
                      <p className="text-2xl font-black text-gray-900 mt-0.5">{formatPrice(pixResult.total)}</p>
                    </div>
                    <div className="text-right">
                      {pixTimer > 0 ? (
                        <>
                          <p className="text-xs text-gray-400">Expira em</p>
                          <p className="font-black text-base" style={{ color: pixTimer < 60 ? "#ef4444" : "#111" }}>
                            {String(pm).padStart(2,"0")}:{String(ps).padStart(2,"0")}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-red-500 font-bold">Expirado</p>
                      )}
                    </div>
                  </div>

                  {/* Barra de progresso do timer */}
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timerPct}%`, backgroundColor: pixTimer < 60 ? "#ef4444" : "#16c789" }} />
                  </div>

                  {/* QR Code */}
                  {pixResult.qrCodeBase64 && (
                    <div className="flex flex-col items-center">
                      <div className="p-3 border-2 border-gray-100 rounded-2xl inline-block">
                        <img src={`data:image/png;base64,${pixResult.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48" />
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-center">Abra o app do seu banco e escaneie</p>
                    </div>
                  )}

                  {/* Divisor */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400 font-semibold">ou copie o código</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Copia e cola */}
                  <div>
                    <p className="text-[11px] font-mono text-gray-400 break-all mb-3 bg-gray-50 rounded-lg p-3 line-clamp-2">{pixResult.qrCode}</p>
                    <button onClick={() => copy(pixResult.qrCode)}
                      className="w-full h-12 flex items-center justify-center gap-2 font-black text-sm rounded-xl transition-all active:scale-[0.98]"
                      style={{ backgroundColor: "#16c789", color: "#fff" }}>
                      {copied ? <><Check className="w-4 h-4" /> Código copiado!</> : <><Copy className="w-4 h-4" /> Copiar código PIX</>}
                    </button>
                  </div>

                  {/* Verificando */}
                  {pixTimer > 0 && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Aguardando confirmação do pagamento...
                    </div>
                  )}
                  {pixTimer === 0 && (
                    <p className="text-center text-sm text-red-500">
                      PIX expirado.{" "}
                      <Link href="/checkout" className="underline font-bold">Tentar novamente</Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Como pagar */}
              <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Como pagar</p>
                <div className="space-y-3">
                  {[
                    { n: "1", t: "Abra o app do seu banco ou carteira digital" },
                    { n: "2", t: "Escolha pagar via PIX com QR Code ou Copia e Cola" },
                    { n: "3", t: "Confirme o valor e finalize o pagamento" },
                  ].map(({ n, t }) => (
                    <div key={n} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: "#16c789" }}>{n}</div>
                      <p className="text-sm text-gray-600 pt-0.5">{t}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CNPJ / identidade do beneficiário */}
              <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#16c789" }} />
                  <div>
                    <p className="text-xs font-black text-gray-700">Beneficiário do pagamento</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">ZENYX INTERMEDIAÇÕES LTDA</p>
                    <p className="text-xs text-gray-400 mt-0.5">Os pagamentos são processados exclusivamente em nome deste CNPJ. Verifique no app do seu banco antes de confirmar.</p>
                  </div>
                </div>
              </div>

              {/* Rodapé de segurança */}
              <div className="text-center pb-2">
                <p className="text-[11px] text-gray-400">
                  Ambiente seguro · Processado pelo <span className="font-bold">Mercado Pago</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Boleto ───────────────────────────────────────────────────────────────────

  // ── Steps ────────────────────────────────────────────────────────────────────

  const stepIdx = stage === "dados" ? 0 : stage === "endereco" ? 1 : 2;

  // Validation booleans
  const vName  = personal.name.trim().split(" ").length >= 2;
  const vEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email);
  const vCpf   = personal.cpf.replace(/\D/g,"").length === 11;
  const vPhone = personal.phone.replace(/\D/g,"").length >= 10;
  const vZip   = address.zipCode.replace(/\D/g,"").length === 8;
  const vStreet = address.street.trim().length > 0;
  const vNum   = address.number.trim().length > 0;
  const vDist  = address.district.trim().length > 0;
  const vCity  = address.city.trim().length > 0;
  const vState = address.state.trim().length === 2;

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: "var(--vep-checkout-page-bg,#F5F5F5)" }}>

      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <div className="border-b flex-shrink-0" style={{ backgroundColor: "var(--vep-checkout-header-bg,#fff)" }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-end">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
            <ShieldCheck className="w-4 h-4" style={{ color: "var(--vep-checkout-step-done-bg,#16c789)" }} />
            <span className="uppercase tracking-wide text-[10px] leading-tight">PAGAMENTO<br/>100% SEGURO</span>
          </div>
        </div>
      </div>

      {/* ── Urgency banner ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 text-center">
          <p className="font-black text-base text-gray-900">
            Desconto e Frete grátis apenas hoje!
          </p>
          <p className="text-sm text-gray-600 mt-0.5 flex items-center justify-center gap-2 flex-wrap">
            Você tem <CountdownTimer seconds={300} /> para finalizar seu pedido
          </p>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-6">

          {/* Step bar */}
          <StepBar step={stepIdx as 0 | 1 | 2} />

          {/* ── RESUMO accordion ──────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border mb-4 overflow-hidden">
            <button
              onClick={() => setSummaryOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-black tracking-widest text-gray-500 uppercase"
            >
              <span>Resumo</span>
              {summaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {summaryOpen && (
              <div className="px-4 pb-4 border-t">
                <div className="space-y-4 pt-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border bg-white">
                        <Image src={item.image || "/placeholder-product.jpg"} alt={item.name} fill className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 leading-tight">{item.name}</p>
                        {(item.color || item.size) && (
                          <p className="text-xs text-gray-500 mt-0.5 font-semibold">
                            {[item.color, item.size].filter(Boolean).join(" / ")}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Qtd.: {item.quantity} &nbsp;{formatPrice(item.price * item.quantity)}</p>
                        {/* Qty controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button
                              onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: item.quantity - 1 } })}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            ><Minus className="w-3 h-3" /></button>
                            <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                            <button
                              onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: item.quantity + 1 } })}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            ><Plus className="w-3 h-3" /></button>
                          </div>
                          <button
                            onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
                            className="text-xs text-gray-400 underline hover:text-red-500 transition-colors"
                          >Remover produto</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Produto</span><span>{formatPrice(total)}</span>
                  </div>
                  {selectedShipping && stage !== "dados" && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Frete</span>
                      <span>{shippingCost === 0 ? <span style={{ color: STEP_COLOR }}>Grátis</span> : formatPrice(shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-base">
                    <span>Total</span>
                    <span className="text-gray-900">{formatPrice(orderTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Step 1: Dados ──────────────────────────────────────────────── */}
          {stage === "dados" && (
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-1">
                <SectionHeader num={1} title="Identificação" />
                <Link href="/carrinho" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar ao carrinho
                </Link>
              </div>
              <p className="text-xs text-gray-500 mb-4 -mt-2 leading-relaxed">
                Utilizaremos seu e-mail para: identificar seu perfil, histórico de compra, notificação de pedidos e carrinho de compras.
              </p>
              <div className="space-y-3">
                <ValidatedInput label="Nome completo" required valid={vName}
                  value={personal.name} onChange={(v) => setPersonal((p) => ({ ...p, name: v }))}
                  placeholder="João da Silva" autoComplete="name" />
                <ValidatedInput label="E-mail" required valid={vEmail} type="email"
                  value={personal.email} onChange={(v) => setPersonal((p) => ({ ...p, email: v }))}
                  placeholder="joao@email.com" inputMode="email" autoComplete="email" />
                <ValidatedInput label="CPF" required valid={vCpf}
                  value={personal.cpf} onChange={(v) => setPersonal((p) => ({ ...p, cpf: maskCPF(v) }))}
                  placeholder="000.000.000-00" inputMode="numeric" />
                <ValidatedInput label="Celular / WhatsApp" required valid={vPhone} type="tel"
                  value={personal.phone} onChange={(v) => setPersonal((p) => ({ ...p, phone: maskPhone(v) }))}
                  placeholder="(11) 99999-9999" inputMode="tel" autoComplete="tel" />
              </div>
            </div>
          )}

          {/* ── Step 2: Entrega ────────────────────────────────────────────── */}
          {stage === "endereco" && (
            <div className="bg-white rounded-xl border p-4">
              <SectionHeader num={2} title="Entrega" />
              <div className="space-y-3">
                <div className="relative">
                  <ValidatedInput label="CEP" required valid={vZip}
                    value={address.zipCode}
                    onChange={(v) => { const m = maskCEP(v); setAddress((a) => ({ ...a, zipCode: m })); if (m.replace(/\D/g,"").length === 8) lookupCep(m); }}
                    placeholder="00000-000" inputMode="numeric" maxLength={9} />
                  {cepLoading && <div className="absolute right-3 bottom-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>}
                </div>
                <ValidatedInput label="Rua / Avenida" required valid={vStreet}
                  value={address.street} onChange={(v) => setAddress((a) => ({ ...a, street: v }))}
                  placeholder="Rua das Flores" autoComplete="address-line1" />
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2">
                    <ValidatedInput label="Número" required valid={vNum}
                      value={address.number} onChange={(v) => setAddress((a) => ({ ...a, number: v }))}
                      placeholder="123" inputMode="numeric" />
                  </div>
                  <div className="col-span-3">
                    <ValidatedInput label="Complemento"
                      value={address.complement} onChange={(v) => setAddress((a) => ({ ...a, complement: v }))}
                      placeholder="Apto, bloco..." />
                  </div>
                </div>
                <ValidatedInput label="Bairro" required valid={vDist}
                  value={address.district} onChange={(v) => setAddress((a) => ({ ...a, district: v }))}
                  placeholder="Centro" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <ValidatedInput label="Cidade" required valid={vCity}
                      value={address.city} onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
                      placeholder="São Paulo" autoComplete="address-level2" />
                  </div>
                  <div>
                    <ValidatedInput label="UF" required valid={vState}
                      value={address.state} onChange={(v) => setAddress((a) => ({ ...a, state: v.toUpperCase() }))}
                      placeholder="SP" maxLength={2} autoComplete="address-level1" />
                  </div>
                </div>

                {/* Shipping options */}
                {shippingMethods.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-bold text-gray-700 mb-2">Método de entrega</p>
                    <div className="space-y-2">
                      {shippingMethods.map((m) => {
                        const effectivePrice = m.freeAbove !== null && total >= m.freeAbove ? 0 : m.price;
                        const isSelected = selectedShipping?.id === m.id;
                        return (
                          <button key={m.id} onClick={() => setSelectedShipping(m)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all"
                            style={{ borderColor: isSelected ? STEP_COLOR : "#E5E7EB", backgroundColor: isSelected ? "rgba(22,199,137,0.05)" : "#fff" }}>
                            <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                              style={{ borderColor: isSelected ? STEP_COLOR : "#D1D5DB" }}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STEP_COLOR }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-gray-900">{m.name}</p>
                              {(m.minDays || m.maxDays) && (
                                <p className="text-xs text-gray-500">
                                  {m.minDays === m.maxDays || !m.maxDays ? `${m.minDays} dias úteis` : `${m.minDays}–${m.maxDays} dias úteis`}
                                </p>
                              )}
                            </div>
                            <span className="font-black text-sm flex-shrink-0"
                              style={{ color: effectivePrice === 0 ? STEP_COLOR : "#111" }}>
                              {effectivePrice === 0 ? "Grátis" : formatPrice(effectivePrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Pagamento ──────────────────────────────────────────── */}
          {stage === "pagamento" && (
            <div className="bg-white rounded-xl border p-4 space-y-4">
              <SectionHeader num={3} title="Pagamento" />
              <div className="space-y-2">
                {([
                  { id: "pix",  label: "PIX",               desc: "Aprovação instantânea · Sem taxas", badge: "Recomendado" },
                  { id: "card", label: "Cartão de crédito", desc: "Parcelamento em até 12x",           badge: null },
                ] as { id: PayMethod; label: string; desc: string; badge: string | null }[]).map((m) => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all"
                    style={{ borderColor: payMethod === m.id ? "#111" : "#E5E7EB", backgroundColor: payMethod === m.id ? "#F9FAFB" : "#fff" }}>
                    <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                      style={{ borderColor: payMethod === m.id ? "#111" : "#D1D5DB" }}>
                      {payMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ backgroundColor: m.id === "pix" ? (payMethod === "pix" ? "#32BCAD" : "#E8F8F6") : (payMethod === "card" ? "#111" : "#F3F4F6"), color: m.id === "pix" ? (payMethod === "pix" ? "#fff" : "#32BCAD") : (payMethod === "card" ? "#fff" : "#6B7280") }}>
                      {m.id === "pix" ? <PixIcon size={20} /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900">{m.label}</span>
                        {m.badge && <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#16c789" }}>{m.badge}</span>}
                      </div>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {payMethod === "card" && (
                <div className="border-2 border-gray-100 rounded-xl p-5 text-center space-y-2 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-700">Pagamento por cartão indisponível</p>
                  <p className="text-sm text-gray-500">Use o <strong>PIX</strong> para finalizar seu pedido agora mesmo.</p>
                </div>
              )}

              {/* Order summary inline */}
              <div className="border-t pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600"><span>Produto</span><span>{formatPrice(total)}</span></div>
                {selectedShipping && (
                  <div className="flex justify-between text-gray-600">
                    <span>Frete ({selectedShipping.name})</span>
                    <span>{shippingCost === 0 ? <span style={{ color: STEP_COLOR }}>Grátis</span> : formatPrice(shippingCost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base">
                  <span>Total</span><span className="text-gray-900">{formatPrice(orderTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky CTA footer ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t shadow-lg">
        <div className="max-w-lg mx-auto p-4 space-y-2">
          {stage === "dados" && (
            <button
              onClick={() => {
                if (!vName || !vEmail || !vCpf || !vPhone) {
                  toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
                  return;
                }
                setStage("endereco");
              }}
              className="w-full h-14 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
              style={{ backgroundColor: "var(--vep-checkout-continue-bg,#16c789)", color: "var(--vep-checkout-continue-text,#fff)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.01em" }}
            >
              Ir para a entrega &nbsp;→
            </button>
          )}
          {stage === "endereco" && (
            <>
              <button
                onClick={() => {
                  if (!vZip || !vStreet || !vNum || !vDist || !vCity || !vState) {
                    toast({ title: "Preencha o endereço completo", variant: "destructive" }); return;
                  }
                  if (shippingMethods.length > 0 && !selectedShipping) {
                    toast({ title: "Selecione um método de entrega", variant: "destructive" }); return;
                  }
                  setStage("pagamento");
                }}
                className="w-full h-14 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
                style={{ backgroundColor: "var(--vep-checkout-continue-bg,#16c789)", color: "var(--vep-checkout-continue-text,#fff)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.01em" }}
              >
                Ir para o pagamento &nbsp;→
              </button>
              <button
                onClick={() => setStage("dados")}
                className="w-full h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Voltar para identificação
              </button>
            </>
          )}
          {stage === "pagamento" && (
            <>
              <button
                onClick={() => submit()}
                disabled={loading}
                className="w-full h-14 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] shadow-md"
                style={{ backgroundColor: "var(--vep-checkout-cta-bg,#16c789)", color: "var(--vep-checkout-cta-text,#fff)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.01em" }}
              >
                {loading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                  : <>Finalizar pedido &nbsp;→</>}
              </button>
              <button
                onClick={() => setStage("endereco")}
                disabled={loading}
                className="w-full h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors"
              >
                ← Voltar para entrega
              </button>
            </>
          )}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: STEP_COLOR }} />
            Pagamento 100% seguro · Mercado Pago
          </div>
        </div>
      </div>
    </div>
  );
}
