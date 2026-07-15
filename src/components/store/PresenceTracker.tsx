"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getPage(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/produtos")) return "product";
  if (pathname.startsWith("/carrinho")) return "cart";
  if (pathname.startsWith("/checkout")) return "checkout";
  if (pathname.startsWith("/rastreio") || pathname.startsWith("/conta/pedidos")) return "tracking";
  return "other";
}

function getSessionId(): string {
  try {
    let id = localStorage.getItem("_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("_sid", id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

function getSource(searchParams: URLSearchParams): string {
  try {
    // If this visit has the ad flag, save it to localStorage
    if (searchParams.get("_s") === "1") {
      localStorage.setItem("_src", "meta");
    }
    return localStorage.getItem("_src") || "direct";
  } catch {
    return "direct";
  }
}

function isReturningVisitor(): boolean {
  try {
    const been = localStorage.getItem("_vb");
    if (!been) {
      localStorage.setItem("_vb", "1");
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function PresenceTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sourceRef = useRef<string>("direct");
  const returningRef = useRef<boolean>(false);
  const scrollPctRef = useRef<number | null>(null);
  const photoIndexRef = useRef<number | null>(null);
  const typingRef = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    sourceRef.current = getSource(new URLSearchParams(searchParams.toString()));
    returningRef.current = isReturningVisitor();
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("__mirror") === "1") return;

    const sessionId = getSessionId();
    const page = getPage(pathname);
    scrollPctRef.current = null;
    photoIndexRef.current = null;
    typingRef.current = null;

    const ping = () => {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          page,
          path: pathname,
          scrollPct: scrollPctRef.current,
          photoIndex: photoIndexRef.current,
          typing: typingRef.current ?? undefined,
          source: sourceRef.current,
          returning: returningRef.current,
        }),
      }).catch(() => {});
    };

    // Baseline heartbeat — near real time
    ping();
    const interval = setInterval(ping, 2000);

    // Fire immediately (debounced) on scroll and photo swipes, for the live mirror
    let debounce: ReturnType<typeof setTimeout> | null = null;
    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      scrollPctRef.current = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 0;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(ping, 250);
    }
    function onGallery(e: Event) {
      const idx = (e as CustomEvent).detail?.index;
      if (typeof idx === "number") {
        photoIndexRef.current = idx;
        ping();
      }
    }
    function onTyping(e: Event) {
      typingRef.current = (e as CustomEvent).detail ?? null;
      ping();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("cs:gallery", onGallery as EventListener);
    window.addEventListener("cs:typing", onTyping as EventListener);

    return () => {
      clearInterval(interval);
      if (debounce) clearTimeout(debounce);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("cs:gallery", onGallery as EventListener);
      window.removeEventListener("cs:typing", onTyping as EventListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
