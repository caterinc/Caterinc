"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { Search, Package, Clock, Truck, MapPin, CheckCircle2, Loader2, ChevronRight } from "lucide-react";

interface TrackItem {
  name: string;
  image: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
}

interface TrackResult {
  orderNumber: string;
  createdAt: string;
  firstName: string;
  city: string;
  state: string;
  items: TrackItem[];
}

const STAGES = [
  {
    id: 0,
    label: "Pedido recebido",
    sublabel: "Confirmamos o seu pedido",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    ring: "ring-emerald-400",
    daysStart: 0,
    daysEnd: 0,
  },
  {
    id: 1,
    label: "Preparando seu pedido",
    sublabel: "Nossa equipe está separando seus produtos",
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-50",
    ring: "ring-blue-400",
    daysStart: 0,
    daysEnd: 1,
  },
  {
    id: 2,
    label: "Aguardando envio",
    sublabel: "Seu pedido está embalado e aguarda coleta",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    ring: "ring-amber-400",
    daysStart: 1,
    daysEnd: 3,
  },
  {
    id: 3,
    label: "Enviado",
    sublabel: "Seu pedido saiu para entrega",
    icon: Truck,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    ring: "ring-indigo-400",
    daysStart: 3,
    daysEnd: 6,
  },
  {
    id: 4,
    label: "A caminho da sua casa",
    sublabel: "O entregador está a caminho",
    icon: MapPin,
    color: "text-orange-500",
    bg: "bg-orange-50",
    ring: "ring-orange-400",
    daysStart: 6,
    daysEnd: 13,
  },
  {
    id: 5,
    label: "Entregue!",
    sublabel: "Seu pedido foi entregue com sucesso",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-500",
    daysStart: 13,
    daysEnd: 999,
  },
];

function getStage(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = ms / 1000 / 3600;
  const days = hours / 24;

  if (days >= 13) return 5;
  if (days >= 6) return 4;
  if (days >= 3) return 3;
  if (days >= 1) return 2;
  return 1;
}

function getEstimatedDelivery(createdAt: string) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 13);
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function getStageDate(createdAt: string, daysOffset: number) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + daysOffset);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / (total - 1)) * 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-cat-yellow to-amber-400 rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function RastreioPage() {
  const [numero, setNumero] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const n = numero.trim().toUpperCase();
    if (!n) return;
    setError("");
    setResult(null);
    startTransition(async () => {
      const res = await fetch(`/api/rastreio?numero=${encodeURIComponent(n)}`);
      if (res.ok) {
        setResult(await res.json());
      } else {
        const d = await res.json();
        setError(d.error || "Pedido não encontrado");
      }
    });
  };

  const currentStage = result ? getStage(result.createdAt) : 0;
  const currentStageData = STAGES[currentStage];
  const StageIcon = currentStageData?.icon || Package;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="bg-cat-black text-white py-14 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-cat-yellow rounded-2xl mb-5">
            <Truck className="w-7 h-7 text-cat-black" />
          </div>
          <h1 className="text-3xl font-black mb-2">Rastrear Pedido</h1>
          <p className="text-gray-400 text-sm mb-8">
            Digite o número do seu pedido para acompanhar a entrega em tempo real
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={numero}
                onChange={(e) => setNumero(e.target.value.toUpperCase())}
                placeholder="Ex: CAT-A7B3-X2Q9"
                className="w-full px-4 py-3.5 pr-10 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cat-yellow focus:border-transparent text-sm font-mono tracking-wider"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={isPending || !numero.trim()}
              className="px-5 py-3.5 bg-cat-yellow text-cat-black font-black rounded-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rastrear"}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div ref={resultRef} className="max-w-2xl mx-auto px-4 py-8 space-y-5">

          {/* Greeting card */}
          <div className={`rounded-2xl p-5 border-2 ${currentStageData.bg} border-transparent`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentStageData.bg} ring-2 ${currentStageData.ring} flex-shrink-0`}>
                <StageIcon className={`w-6 h-6 ${currentStageData.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5">Pedido {result.orderNumber}</p>
                <h2 className="text-lg font-black text-gray-900 leading-tight">
                  {currentStage === 5
                    ? `Entregue! Aproveite, ${result.firstName}!`
                    : `${currentStageData.label}`
                  }
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">{currentStageData.sublabel}</p>
              </div>
            </div>

            {currentStage < 5 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Progresso da entrega</span>
                  <span className="font-semibold">{Math.round((currentStage / 5) * 100)}%</span>
                </div>
                <ProgressBar current={currentStage} total={6} />
                <p className="text-xs text-gray-500 mt-2 text-right">
                  Entrega estimada:{" "}
                  <span className="font-semibold text-gray-800">{getEstimatedDelivery(result.createdAt)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wide">
              Histórico do rastreio
            </h3>
            <ol className="space-y-0">
              {STAGES.slice(0, 6).map((stage, i) => {
                const Icon = stage.icon;
                const done = i <= currentStage;
                const active = i === currentStage;
                const isLast = i === STAGES.length - 1;

                return (
                  <li key={stage.id} className="flex gap-4">
                    {/* Left: line + circle */}
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                        ${active ? `${stage.bg} ring-2 ${stage.ring} shadow-md` : done ? "bg-emerald-50" : "bg-gray-50"}
                      `}>
                        <Icon className={`w-4 h-4 ${active ? stage.color : done ? "text-emerald-500" : "text-gray-300"}`} />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 min-h-[28px] my-1 rounded-full ${done && i < currentStage ? "bg-emerald-300" : "bg-gray-100"}`} />
                      )}
                    </div>

                    {/* Right: text */}
                    <div className={`pb-5 ${isLast ? "pb-0" : ""} flex-1 min-w-0`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold text-sm ${active ? "text-gray-900" : done ? "text-gray-700" : "text-gray-300"}`}>
                          {stage.label}
                          {active && (
                            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.color}`}>
                              agora
                            </span>
                          )}
                        </p>
                        {done && stage.daysStart !== undefined && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {stage.daysStart === 0 && i === 0
                              ? new Date(result.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                              : getStageDate(result.createdAt, stage.daysStart)
                            }
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${done ? "text-gray-500" : "text-gray-300"}`}>
                        {stage.sublabel}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Delivery destination */}
          {(result.city || result.state) && (
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Destino</p>
                <p className="font-semibold text-sm text-gray-800">
                  {[result.city, result.state].filter(Boolean).join(" — ")}
                </p>
              </div>
            </div>
          )}

          {/* Items */}
          {result.items.length > 0 && (
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                Itens do pedido
              </h3>
              <ul className="space-y-3">
                {result.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border bg-gray-50 flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[item.size && `Tam: ${item.size}`, item.color && `Cor: ${item.color}`].filter(Boolean).join(" · ")}
                        {item.quantity > 1 && ` · Qtd: ${item.quantity}`}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Search again */}
          <button
            onClick={() => { setResult(null); setNumero(""); setTimeout(() => inputRef.current?.focus(), 100); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
          >
            ← Rastrear outro pedido
          </button>
        </div>
      )}

      {/* Empty state when no search yet */}
      {!result && !isPending && !error && (
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Package, label: "Pedido recebido", color: "text-blue-400", bg: "bg-blue-50" },
              { icon: Truck, label: "Em trânsito", color: "text-indigo-400", bg: "bg-indigo-50" },
              { icon: CheckCircle2, label: "Entregue", color: "text-emerald-400", bg: "bg-emerald-50" },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border p-4 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <span className="text-xs text-gray-500 font-medium text-center leading-tight">{card.label}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            Acompanhe cada etapa do seu pedido em tempo real.<br />
            O código de rastreio está na página de confirmação do seu pedido.
          </p>
        </div>
      )}
    </div>
  );
}
