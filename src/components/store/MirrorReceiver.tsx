"use client";

import { useEffect } from "react";

// Only active inside the admin's live-session iframe (?__mirror=1).
// Listens for postMessage commands from LiveMirror to reproduce the
// customer's scroll position and photo swipes without polluting analytics.
export function MirrorReceiver() {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; pct?: number; index?: number } | null;
      if (!data || typeof data !== "object") return;

      if (data.type === "cs-mirror-scroll" && typeof data.pct === "number") {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight;
        if (scrollable > 0) {
          window.scrollTo({ top: (data.pct / 100) * scrollable, behavior: "smooth" });
        }
      }

      if (data.type === "cs-mirror-set-index" && typeof data.index === "number") {
        window.dispatchEvent(new CustomEvent("cs:mirror-index", { detail: { index: data.index } }));
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
