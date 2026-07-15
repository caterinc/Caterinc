"use client";

import { useEffect, useState, useCallback } from "react";
import { MousePointer2, ShoppingCart, CreditCard, Home, Package, Truck, User, ArrowLeft, RefreshCw } from "lucide-react";

interface SessionEvent {
  sessionId: string;
  type: string;
  page: string;
  label: string | null;
  scrollPct: number | null;
  createdAt: string;
}

interface Session {
  sessionId: string;
  page: string;
  source: string;
  returning: boolean;
  activeFor: number;
  lastSeen: string;
  events: SessionEvent[];
}

const PAGE_ICONS: Record<string, React.ElementType> = {
  home: Home, product: Package, cart: ShoppingCart,
  checkout: CreditCard, tracking: Truck, account: User,
};

const PAGE_LABELS: Record<string, string> = {
  home: "Página inicial", product: "Produto", products: "Produtos",
  cart: "Carrinho", checkout: "Checkout", tracking: "Rastreio",
  account: "Conta", other: "Outra página",
};

const EVENT_ICONS: Record<string, string> = {
  pageview: "📍", click: "👆", scroll: "📜",
};

function fmt(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return "agora";
  if (diff < 60) return `${diff}s atrás`;
  return `${Math.floor(diff / 60)}m atrás`;
}

const CARD: React.CSSProperties = { background: "#16132e", border: "1px solid rgba(255,255,255,0.07)" };

export default function SessoesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sessions", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data.sessions || []);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
      // Keep selected session updated
      setSelected((prev) =>
        prev ? (data.sessions.find((s: Session) => s.sessionId === prev.sessionId) ?? prev) : null
      );
    } catch {}
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 3000);
    return () => clearInterval(t);
  }, [fetch_]);

  const PageIcon = selected ? (PAGE_ICONS[selected.page] ?? MousePointer2) : MousePointer2;

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-white">Sessões ao vivo</h1>
          <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>
            Veja o que cada lead está fazendo em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" style={{ color: "#7b7fa3" }} />
              <span className="text-xs" style={{ color: "#7b7fa3" }}>{lastUpdate}</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.25)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#22d3a0" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22d3a0" }} />
            </span>
            <span className="text-xs font-bold" style={{ color: "#22d3a0" }}>
              {sessions.length} ativo{sessions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={CARD}>
          <MousePointer2 className="w-8 h-8 mx-auto mb-3" style={{ color: "#7b7fa3" }} />
          <p className="text-white font-semibold">Nenhuma sessão ativa</p>
          <p className="text-xs mt-1" style={{ color: "#7b7fa3" }}>Aguardando visitantes na loja...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Session list */}
          <div className="lg:col-span-1 space-y-2">
            {sessions.map((s) => {
              const Icon = PAGE_ICONS[s.page] ?? MousePointer2;
              const isActive = selected?.sessionId === s.sessionId;
              return (
                <button
                  key={s.sessionId}
                  onClick={() => setSelected(isActive ? null : s)}
                  className="w-full text-left rounded-xl p-3.5 transition-all"
                  style={{
                    background: isActive ? "rgba(108,82,255,0.15)" : "rgba(255,255,255,0.03)",
                    border: isActive ? "1px solid rgba(108,82,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0"
                      style={{ background: isActive ? "rgba(108,82,255,0.2)" : "rgba(255,255,255,0.06)" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: isActive ? "#a78bfa" : "#7b7fa3" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold" style={{ color: isActive ? "white" : "rgba(255,255,255,0.8)" }}>
                          {PAGE_LABELS[s.page] ?? s.page}
                        </span>
                        {s.source === "meta" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                            Meta
                          </span>
                        )}
                        {s.returning && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                            Voltou
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: "#7b7fa3" }}>
                          há {fmt(s.activeFor)}
                        </span>
                        <span className="text-[10px]" style={{ color: "#7b7fa3" }}>·</span>
                        <span className="text-[10px]" style={{ color: "#7b7fa3" }}>
                          {s.events.length} eventos
                        </span>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#22d3a0" }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Event timeline */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center" style={CARD}>
                <MousePointer2 className="w-6 h-6 mb-3" style={{ color: "#7b7fa3" }} />
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Selecione uma sessão para ver o detalhamento
                </p>
              </div>
            ) : (
              <div className="rounded-2xl p-5" style={CARD}>
                {/* Session header */}
                <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(108,82,255,0.15)" }}>
                    <PageIcon className="w-4 h-4" style={{ color: "#a78bfa" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white">{PAGE_LABELS[selected.page] ?? selected.page}</p>
                      {selected.source === "meta" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                          Veio do anúncio
                        </span>
                      )}
                      {selected.returning && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                          Visitante que voltou
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>
                      Ativo há {fmt(selected.activeFor)} · última ação {timeAgo(selected.lastSeen)}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10">
                    <ArrowLeft className="w-3.5 h-3.5" style={{ color: "#7b7fa3" }} />
                  </button>
                </div>

                {/* Events */}
                {selected.events.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "#7b7fa3" }}>
                    Sem eventos registrados ainda
                  </p>
                ) : (
                  <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                    {[...selected.events].reverse().map((ev, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.02)" }}>
                        <span className="text-sm flex-shrink-0 mt-0.5">{EVENT_ICONS[ev.type] ?? "•"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{ev.label ?? ev.type}</p>
                          {ev.scrollPct !== null && (
                            <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width: `${ev.scrollPct}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] flex-shrink-0" style={{ color: "#7b7fa3" }}>
                          {timeAgo(ev.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
