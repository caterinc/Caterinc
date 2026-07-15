"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, Smartphone, User, Mail, Phone, MapPin } from "lucide-react";

interface TypingData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface MirrorState {
  path: string | null;
  photoIndex: number | null;
  scrollPct: number | null;
  typing: TypingData | null;
}

const GLASS: React.CSSProperties = {
  background: "rgba(22,19,46,0.9)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
};

const LIVE_POLL_MS = 1000;

export function LiveMirror({ sessionId, active }: { sessionId: string; active: boolean }) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [typing, setTyping] = useState<TypingData | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadedPathRef = useRef<string | null>(null);
  const lastPhotoRef = useRef<number | null>(null);
  const lastScrollRef = useRef<number | null>(null);

  useEffect(() => {
    loadedPathRef.current = null;
    lastPhotoRef.current = null;
    lastScrollRef.current = null;
    setIframeSrc(null);
    setTyping(null);
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(`/api/admin/sessions/mirror?sessionId=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { ok: boolean } & Partial<MirrorState>;
        if (!data.ok) return;

        // Reload the iframe only when the customer actually navigated
        if (data.path && data.path !== loadedPathRef.current) {
          loadedPathRef.current = data.path;
          lastPhotoRef.current = null;
          lastScrollRef.current = null;
          setIframeSrc(`${data.path}${data.path.includes("?") ? "&" : "?"}__mirror=1`);
          return;
        }

        const win = iframeRef.current?.contentWindow;
        if (!win) return;

        if (typeof data.photoIndex === "number" && data.photoIndex !== lastPhotoRef.current) {
          lastPhotoRef.current = data.photoIndex;
          win.postMessage({ type: "cs-mirror-set-index", index: data.photoIndex }, window.location.origin);
        }

        if (typeof data.scrollPct === "number" && data.scrollPct !== lastScrollRef.current) {
          lastScrollRef.current = data.scrollPct;
          win.postMessage({ type: "cs-mirror-scroll", pct: data.scrollPct }, window.location.origin);
        }

        setTyping(data.typing ?? null);
      } catch {}
    }

    tick();
    if (!active) return () => { cancelled = true; };
    const t = setInterval(tick, LIVE_POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [sessionId, active]);

  return (
    <div className="rounded-2xl p-4" style={GLASS}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#ef4444" }} />}
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: active ? "#ef4444" : "#7b7fa3" }} />
          </span>
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" style={{ color: active ? "#ef4444" : "#7b7fa3" }} />
            {active ? "Ao vivo — espelho da loja" : "Última posição conhecida (sessão encerrada)"}
          </span>
        </div>
      </div>

      <div
        className="mx-auto rounded-2xl overflow-hidden relative"
        style={{
          width: "min(100%, 320px)",
          aspectRatio: "9 / 18.5",
          background: "#0b0a1e",
          border: "6px solid rgba(255,255,255,0.08)",
        }}
      >
        {iframeSrc ? (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
            <Smartphone className="w-6 h-6" style={{ color: "#4a4870" }} />
            <p className="text-[11px]" style={{ color: "#7b7fa3" }}>
              Aguardando página do cliente…
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center mt-2" style={{ color: "#4a4870" }}>
        {active ? "Tempo real — reflete a página, foto e rolagem reais da sessão" : "Sessão encerrada — sem atualizações"}
      </p>

      {/* What the customer is typing at checkout (name/email/phone/address — never card data) */}
      {typing && (typing.name || typing.email || typing.phone || typing.address) && (
        <div className="mt-3 rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#7b7fa3" }}>
            Digitando no checkout
          </p>
          {typing.name && (
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 flex-shrink-0" style={{ color: "#a78bfa" }} />
              <span className="text-xs text-white truncate">{typing.name}</span>
            </div>
          )}
          {typing.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 flex-shrink-0" style={{ color: "#60a5fa" }} />
              <span className="text-xs text-white truncate">{typing.email}</span>
            </div>
          )}
          {typing.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 flex-shrink-0" style={{ color: "#34d399" }} />
              <span className="text-xs text-white truncate">{typing.phone}</span>
            </div>
          )}
          {typing.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#f472b6" }} />
              <span className="text-xs text-white truncate">{typing.address}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
