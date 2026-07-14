"use client";
import { useEffect } from "react";

export function MetaPageView({ fbc, fbp }: { fbc?: string; fbp?: string }) {
  useEffect(() => {
    try {
      const stored_fbc = fbc || localStorage.getItem("_fbc") || undefined;
      const stored_fbp = fbp || localStorage.getItem("_fbp") || undefined;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "PageView", fbc: stored_fbc, fbp: stored_fbp }),
      }).catch(() => {});
    } catch {}
  }, [fbc, fbp]);
  return null;
}
