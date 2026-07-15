"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getPage(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/produtos")) return "product";
  if (pathname.startsWith("/carrinho")) return "cart";
  if (pathname.startsWith("/checkout")) return "checkout";
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

export function PresenceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getSessionId();
    const page = getPage(pathname);

    const ping = () => {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, page }),
      }).catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 10_000);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
