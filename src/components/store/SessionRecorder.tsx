"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getSessionId(): string {
  try { return localStorage.getItem("_sid") || ""; } catch { return ""; }
}

function getPageKey(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/produtos/")) return "product";
  if (pathname.startsWith("/produtos")) return "products";
  if (pathname.startsWith("/carrinho")) return "cart";
  if (pathname.startsWith("/checkout")) return "checkout";
  if (pathname.startsWith("/rastreio")) return "tracking";
  if (pathname.startsWith("/conta")) return "account";
  return "other";
}

function getPageLabel(page: string, pathname: string): string {
  switch (page) {
    case "home": return "Página inicial";
    case "products": return "Lista de produtos";
    case "cart": return "Carrinho";
    case "checkout": return "Checkout";
    case "tracking": return "Rastreamento de pedido";
    case "account": return "Conta do cliente";
    case "product": {
      // Try to get the product name from the page H1
      const h1 = document.querySelector("h1");
      const title = h1?.innerText?.trim();
      return title ? `Produto: ${title}` : `Produto (${pathname.split("/").pop()})`;
    }
    default: return `Página: ${pathname}`;
  }
}

function getClickLabel(target: HTMLElement): string | null {
  let el: HTMLElement | null = target;
  for (let i = 0; i < 5; i++) {
    if (!el) break;
    const tag = el.tagName.toLowerCase();
    const text = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").trim().slice(0, 60);
    if (text && (tag === "button" || tag === "a" || el.getAttribute("role") === "button")) {
      return `${tag === "a" ? "Link" : "Botão"}: ${text}`;
    }
    el = el.parentElement;
  }
  const fallback = (target.innerText || "").trim().slice(0, 40);
  return fallback ? `Clique: ${fallback}` : null;
}

export function SessionRecorder() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMirror = searchParams.get("__mirror") === "1";
  const queueRef = useRef<object[]>([]);
  const scrolledRef = useRef<Set<number>>(new Set());
  const pageRef = useRef<string>("");
  const pathRef = useRef<string>("");
  const lastInteractionRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setInterval>>();
  const reviewsObserverRef = useRef<IntersectionObserver | null>(null);
  const reviewsSeenRef = useRef(false);

  function enqueue(event: object) {
    queueRef.current.push(event);
  }

  function flush() {
    if (isMirror) return;
    const sid = getSessionId();
    if (!sid || queueRef.current.length === 0) return;
    const events = queueRef.current.splice(0);
    fetch("/api/session-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid, events }),
    }).catch(() => {});
  }

  // Track page views — delayed slightly to let H1 render
  useEffect(() => {
    if (isMirror) return;
    const page = getPageKey(pathname);
    pageRef.current = page;
    pathRef.current = pathname;
    scrolledRef.current = new Set();
    reviewsSeenRef.current = false;

    // Small delay for product pages to let H1 render
    const delay = page === "product" ? 300 : 0;
    const t = setTimeout(() => {
      const label = getPageLabel(page, pathname);
      enqueue({ type: "pageview", page, path: pathname, label });
    }, delay);

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Clicks + scroll + idle detection
  useEffect(() => {
    if (isMirror) return;

    function markInteraction() {
      lastInteractionRef.current = Date.now();
    }

    function onClick(e: MouseEvent) {
      markInteraction();
      const target = e.target as HTMLElement;
      const label = getClickLabel(target);
      if (!label) return;
      enqueue({ type: "click", page: pageRef.current, path: pathRef.current, label });
    }

    function onScroll() {
      markInteraction();
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const pct = Math.round((window.scrollY / scrollable) * 100);
      for (const m of [25, 50, 75, 100]) {
        if (pct >= m && !scrolledRef.current.has(m)) {
          scrolledRef.current.add(m);
          enqueue({ type: "scroll", page: pageRef.current, path: pathRef.current, label: `Rolou ${m}% da página`, scrollPct: m });
        }
      }
    }

    function onGallery(e: Event) {
      markInteraction();
      const detail = (e as CustomEvent).detail as { index: number; total: number; productName?: string } | undefined;
      if (!detail) return;
      enqueue({
        type: "gallery",
        page: pageRef.current,
        path: pathRef.current,
        label: `Passou a foto (${detail.index + 1}/${detail.total})`,
        meta: { photoIndex: detail.index, total: detail.total },
      });
      flush();
    }

    // Idle detection: check every 30s if no interaction in 30s
    idleTimerRef.current = setInterval(() => {
      const idleSec = Math.round((Date.now() - lastInteractionRef.current) / 1000);
      if (idleSec >= 30) {
        enqueue({ type: "idle", page: pageRef.current, path: pathRef.current, label: `Parado por ${idleSec}s` });
        // Reset so we don't spam idle events
        lastInteractionRef.current = Date.now();
      }
    }, 30000);

    document.addEventListener("click", onClick, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("cs:gallery", onGallery as EventListener);
    document.addEventListener("mousemove", markInteraction, { passive: true });
    document.addEventListener("touchstart", markInteraction, { passive: true });
    document.addEventListener("keydown", markInteraction, { passive: true });

    const flushInterval = setInterval(flush, 2000);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("cs:gallery", onGallery as EventListener);
      document.removeEventListener("mousemove", markInteraction);
      document.removeEventListener("touchstart", markInteraction);
      document.removeEventListener("keydown", markInteraction);
      clearInterval(flushInterval);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      flush();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reviews section observer (product pages only)
  useEffect(() => {
    if (reviewsObserverRef.current) {
      reviewsObserverRef.current.disconnect();
      reviewsObserverRef.current = null;
    }
    if (isMirror || pageRef.current !== "product") return;

    // Observe after a short delay to allow page render
    const timer = setTimeout(() => {
      const target = document.querySelector(
        "#avaliacoes, [data-section='reviews'], [id*='review'], [id*='avaliacao'], section[aria-label*='Avalia']"
      );
      if (!target) return;

      reviewsObserverRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !reviewsSeenRef.current) {
            reviewsSeenRef.current = true;
            enqueue({ type: "section", page: "product", path: pathRef.current, label: "Avaliações do produto" });
          }
        },
        { threshold: 0.3 }
      );
      reviewsObserverRef.current.observe(target);
    }, 800);

    return () => {
      clearTimeout(timer);
      reviewsObserverRef.current?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
