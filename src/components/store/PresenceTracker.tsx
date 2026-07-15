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

  useEffect(() => {
    sourceRef.current = getSource(new URLSearchParams(searchParams.toString()));
    returningRef.current = isReturningVisitor();
  }, [searchParams]);

  useEffect(() => {
    const sessionId = getSessionId();
    const page = getPage(pathname);

    const ping = () => {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          page,
          source: sourceRef.current,
          returning: returningRef.current,
        }),
      }).catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 10_000);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
