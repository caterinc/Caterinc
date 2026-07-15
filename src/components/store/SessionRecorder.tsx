"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  try {
    return localStorage.getItem("_sid") || "";
  } catch {
    return "";
  }
}

function getPageLabel(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/produtos/")) return "product";
  if (pathname.startsWith("/produtos")) return "products";
  if (pathname.startsWith("/carrinho")) return "cart";
  if (pathname.startsWith("/checkout")) return "checkout";
  if (pathname.startsWith("/rastreio")) return "tracking";
  if (pathname.startsWith("/conta")) return "account";
  return "other";
}

function getClickLabel(target: HTMLElement): string | null {
  // Walk up to find meaningful text
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
  // Fallback: any text near the click
  const fallback = (target.innerText || "").trim().slice(0, 40);
  return fallback ? `Clique: ${fallback}` : null;
}

export function SessionRecorder() {
  const pathname = usePathname();
  const queueRef = useRef<object[]>([]);
  const scrolledRef = useRef<Set<number>>(new Set());
  const pageRef = useRef<string>("");

  function enqueue(event: object) {
    queueRef.current.push(event);
  }

  function flush() {
    const sid = getSessionId();
    if (!sid || queueRef.current.length === 0) return;
    const events = queueRef.current.splice(0);
    fetch("/api/session-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid, events }),
    }).catch(() => {});
  }

  // Track page views
  useEffect(() => {
    const page = getPageLabel(pathname);
    pageRef.current = page;
    scrolledRef.current = new Set();
    enqueue({ type: "pageview", page, label: `Entrou em: ${pathname}` });
  }, [pathname]);

  // Track clicks + scroll milestones
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const label = getClickLabel(target);
      if (!label) return;
      enqueue({ type: "click", page: pageRef.current, label });
    }

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const pct = Math.round((window.scrollY / scrollable) * 100);
      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (pct >= m && !scrolledRef.current.has(m)) {
          scrolledRef.current.add(m);
          enqueue({ type: "scroll", page: pageRef.current, label: `Rolou ${m}% da página`, scrollPct: m });
        }
      }
    }

    document.addEventListener("click", onClick, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const interval = setInterval(flush, 5000);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      clearInterval(interval);
      flush();
    };
  }, []);

  return null;
}
