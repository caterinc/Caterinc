"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MousePointer2, ShoppingCart, CreditCard, Home, Package,
  Truck, User, Navigation, MousePointerClick, ChevronsDown,
  Coffee, Eye, Star, RefreshCw, X, ArrowLeft, Clock,
} from "lucide-react";

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
  active: boolean;
  activeFor: number;
  lastSeen: string;
  events: SessionEvent[];
}

const PAGE_ICONS: Record<string, React.ElementType> = {
  home: Home, product: Package, cart: ShoppingCart,
  checkout: CreditCard, tracking: Truck, account: User,
};

const PAGE_LABELS: Record<string, string> = {
  home: "Página inicial", product: "Produto", products: "Lista de produtos",
  cart: "Carrinho", checkout: "Checkout", tracking: "Rastreio",
  account: "Conta", other: "Outra página",
};

const PAGE_DOT: Record<string, string> = {
  home: "#60a5fa", product: "#a78bfa", products: "#a78bfa",
  cart: "#34d399", checkout: "#22d3a0", tracking: "#f97316",
  account: "#c084fc", other: "#7b7fa3",
};

// ── Event formatting helpers ──────────────────────────────────────────────────

function eventIcon(type: string, label: string | null) {
  if (type === "pageview") return { Icon: Navigation, color: "#60a5fa", bg: "rgba(96,165,250,0.15)" };
  if (type === "scroll") return { Icon: ChevronsDown, color: "#34d399", bg: "rgba(52,211,153,0.15)" };
  if (type === "idle") return { Icon: Coffee, color: "#7b7fa3", bg: "rgba(123,127,163,0.12)" };
  if (type === "section") {
    if (label?.toLowerCase().includes("avalia")) return { Icon: Star, color: "#fbbf24", bg: "rgba(251,191,36,0.15)" };
    return { Icon: Eye, color: "#a78bfa", bg: "rgba(167,139,250,0.15)" };
  }
  // click
  return { Icon: MousePointerClick, color: "#a78bfa", bg: "rgba(167,139,250,0.15)" };
}

function formatLabel(event: SessionEvent): string {
  const { type, label, scrollPct, page } = event;

  if (type === "idle") {
    return label || "Ficou parado";
  }
  if (type === "section") {
    if (label?.toLowerCase().includes("avalia")) return "Lendo avaliações do produto";
    return label || "Visualizando seção";
  }
  if (type === "scroll") {
    return label || `Rolou ${scrollPct ?? "?"}% da página`;
  }
  if (type === "pageview") {
    if (label?.startsWith("Produto: ")) return label;
    const map: Record<string, string> = {
      home: "Entrou na página inicial",
      cart: "Abriu o carrinho",
      checkout: "Iniciou o checkout",
      tracking: "Acessou rastreamento do pedido",
      account: "Entrou na conta",
      products: "Navegando em produtos",
    };
    return map[page] || label || `Visitou: ${page}`;
  }
  if (type === "click") {
    // "Botão: Comprar Agora" → "Clicou em Comprar Agora"
    if (label?.startsWith("Botão: ")) return `Clicou em "${label.slice(7)}"`;
    if (label?.startsWith("Link: ")) return `Clicou no link "${label.slice(6)}"`;
    if (label?.startsWith("Clique: ")) return `Clicou em "${label.slice(8)}"`;
    return label || "Clique";
  }
  return label || type;
}

function fmt(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return "agora";
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

function timeBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000);
}

const GLASS: React.CSSProperties = {
  background: "rgba(22,19,46,0.75)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const activeSessions = sessions.filter((s) => s.active);
  const recentSessions = sessions.filter((s) => !s.active);

  const PageIcon = selected ? (PAGE_ICONS[selected.page] ?? MousePointer2) : MousePointer2;

  return (
    <div className="space-y-4 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-white">Sessões</h1>
          <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>
            Ativas agora + últimos 10 minutos
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
              {activeSessions.length} ativ{activeSessions.length !== 1 ? "os" : "o"} agora
            </span>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={GLASS}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(108,82,255,0.15)" }}>
            <MousePointer2 className="w-6 h-6" style={{ color: "#a78bfa" }} />
          </div>
          <p className="text-white font-semibold">Sem sessões recentes</p>
          <p className="text-xs mt-1" style={{ color: "#7b7fa3" }}>Aguardando visitantes na loja…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Session list */}
          <div className="lg:col-span-1 space-y-2">
            {/* Active now */}
            {activeSessions.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: "#22d3a0" }}>
                  Agora
                </p>
                {activeSessions.map((s) => <SessionCard key={s.sessionId} s={s} selected={selected} onSelect={setSelected} />)}
              </>
            )}

            {/* Recent (last 10 min) */}
            {recentSessions.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest px-1 mt-3" style={{ color: "#7b7fa3" }}>
                  Últimos 10 min
                </p>
                {recentSessions.map((s) => <SessionCard key={s.sessionId} s={s} selected={selected} onSelect={setSelected} />)}
              </>
            )}
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center" style={GLASS}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(108,82,255,0.12)" }}>
                  <Eye className="w-5 h-5" style={{ color: "#6c52ff" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Selecione uma sessão para ver o trajeto
                </p>
              </div>
            ) : (
              <div className="rounded-2xl p-5" style={GLASS}>
                {/* Session header */}
                <div className="flex items-center gap-3 mb-5 pb-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "rgba(108,82,255,0.15)" }}>
                    <PageIcon className="w-4 h-4" style={{ color: "#a78bfa" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white">{PAGE_LABELS[selected.page] ?? selected.page}</p>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={
                          selected.active
                            ? { background: "rgba(34,211,160,0.15)", color: "#22d3a0" }
                            : { background: "rgba(123,127,163,0.12)", color: "#7b7fa3" }
                        }
                      >
                        {selected.active ? "Ativo agora" : `Há ${fmt(selected.activeFor)}`}
                      </span>
                      {selected.source === "meta" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                          Veio do anúncio
                        </span>
                      )}
                      {selected.returning && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                          Voltou à loja
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>
                      Última atividade {timeAgo(selected.lastSeen)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" style={{ color: "#7b7fa3" }} />
                  </button>
                </div>

                {/* Event stats bar */}
                {selected.events.length > 0 && (
                  <EventStats events={selected.events} />
                )}

                {/* Events timeline */}
                {selected.events.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "#7b7fa3" }}>
                    Sem eventos registrados ainda
                  </p>
                ) : (
                  <div className="space-y-0 max-h-[460px] overflow-y-auto pr-1 mt-3">
                    <EventTimeline events={selected.events} />
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function SessionCard({
  s,
  selected,
  onSelect,
}: {
  s: Session;
  selected: Session | null;
  onSelect: (s: Session | null) => void;
}) {
  const Icon = PAGE_ICONS[s.page] ?? MousePointer2;
  const isActive = selected?.sessionId === s.sessionId;
  const dotColor = PAGE_DOT[s.page] ?? "#7b7fa3";

  // Show last meaningful event label
  const lastEvent = [...s.events].reverse()[0];
  const lastLabel = lastEvent ? formatLabel(lastEvent) : null;

  return (
    <button
      onClick={() => onSelect(isActive ? null : s)}
      className="w-full text-left rounded-xl p-3.5 transition-all"
      style={{
        background: isActive ? "rgba(108,82,255,0.15)" : "rgba(255,255,255,0.03)",
        border: isActive ? "1px solid rgba(108,82,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div
            className="p-2 rounded-xl"
            style={{ background: isActive ? "rgba(108,82,255,0.2)" : "rgba(255,255,255,0.06)" }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: isActive ? "#a78bfa" : "#7b7fa3" }} />
          </div>
          {s.active && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0b0a1e] animate-pulse"
              style={{ background: "#22d3a0" }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs font-bold"
              style={{ color: isActive ? "white" : "rgba(255,255,255,0.8)" }}
            >
              {PAGE_LABELS[s.page] ?? s.page}
            </span>
            {s.source === "meta" && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}
              >
                Meta
              </span>
            )}
            {s.returning && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}
              >
                Voltou
              </span>
            )}
          </div>
          {lastLabel && (
            <p className="text-[10px] mt-0.5 truncate max-w-[180px]" style={{ color: "#7b7fa3" }}>
              {lastLabel}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px]" style={{ color: "#7b7fa3" }}>
              {s.active ? "Ativo agora" : `há ${fmt(s.activeFor)}`}
            </span>
            <span className="text-[10px]" style={{ color: "#4a4870" }}>·</span>
            <span
              className="text-[10px] flex items-center gap-0.5"
              style={{ color: "#7b7fa3" }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: dotColor }}
              />
              {s.events.length} eventos
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function EventStats({ events }: { events: SessionEvent[] }) {
  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className="flex items-center gap-4 px-3 py-2.5 rounded-xl flex-wrap"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      {[
        { type: "pageview", Icon: Navigation, label: "páginas", color: "#60a5fa" },
        { type: "click", Icon: MousePointerClick, label: "cliques", color: "#a78bfa" },
        { type: "scroll", Icon: ChevronsDown, label: "rolagens", color: "#34d399" },
        { type: "idle", Icon: Coffee, label: "pausas", color: "#7b7fa3" },
      ].map(({ type, Icon, label, color }) => (
        counts[type] ? (
          <div key={type} className="flex items-center gap-1.5">
            <Icon className="w-3 h-3" style={{ color }} />
            <span className="text-xs font-semibold" style={{ color }}>
              {counts[type]}
            </span>
            <span className="text-xs" style={{ color: "#7b7fa3" }}>{label}</span>
          </div>
        ) : null
      ))}
      <div className="ml-auto flex items-center gap-1" style={{ color: "#7b7fa3" }}>
        <Clock className="w-3 h-3" />
        <span className="text-[10px]">
          {timeAgo(events[0]?.createdAt ?? "")} – {timeAgo(events[events.length - 1]?.createdAt ?? "")}
        </span>
      </div>
    </div>
  );
}

function EventTimeline({ events }: { events: SessionEvent[] }) {
  const reversed = [...events].reverse();

  return (
    <div className="space-y-1">
      {reversed.map((ev, i) => {
        const prev = reversed[i - 1];
        const gap = prev ? timeBetween(prev.createdAt, ev.createdAt) : 0;
        const showGap = gap >= 30 && i > 0;

        const { Icon, color, bg } = eventIcon(ev.type, ev.label);
        const label = formatLabel(ev);
        const isIdle = ev.type === "idle";

        return (
          <div key={i}>
            {/* Time gap separator */}
            {showGap && (
              <div className="flex items-center gap-2 my-2 px-1">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                <span className="text-[9px]" style={{ color: "#4a4870" }}>
                  {gap >= 60 ? `${Math.round(gap / 60)}m` : `${gap}s`} sem atividade
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
              </div>
            )}

            {/* Event row */}
            <div
              className="flex items-start gap-3 py-2 px-3 rounded-xl transition-colors"
              style={{
                background: isIdle ? "transparent" : "rgba(255,255,255,0.02)",
                opacity: isIdle ? 0.55 : 1,
              }}
            >
              <div
                className="p-1.5 rounded-lg flex-shrink-0 mt-0.5"
                style={{ background: bg }}
              >
                <Icon className="w-3 h-3" style={{ color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-white leading-snug">{label}</p>

                {/* Scroll progress bar */}
                {ev.type === "scroll" && ev.scrollPct !== null && (
                  <div
                    className="mt-1.5 h-1 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${ev.scrollPct}%`,
                        background: "linear-gradient(90deg, #34d399, #22d3a0)",
                      }}
                    />
                  </div>
                )}
              </div>

              <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "#7b7fa3" }}>
                {timeAgo(ev.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
