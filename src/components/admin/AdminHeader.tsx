"use client";

import { signOut } from "next-auth/react";
import { Bell, Menu, LogOut, Search, MousePointer2, Users } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface AdminHeaderProps {
  user: { name?: string | null; email?: string | null };
  onMenuClick?: () => void;
}

function Avatar({ name }: { name?: string | null }) {
  const initials = (name || "A").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #4c37e8, #9333ea)" }}>
      {initials}
    </div>
  );
}

function VisitorsWidget() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/admin/live-stats", { cache: "no-store" });
        if (res.ok) {
          const d = await res.json();
          if (alive) setCount(d.visitorsNow ?? 0);
        }
      } catch {}
    }
    poll();
    const t = setInterval(poll, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const hasVisitors = (count ?? 0) > 0;

  return (
    <Link
      href="/admin/live"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all hover:opacity-90"
      style={{
        background: hasVisitors ? "rgba(34,211,160,0.12)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${hasVisitors ? "rgba(34,211,160,0.35)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {hasVisitors && (
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#22d3a0" }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#22d3a0" }} />
        </span>
      )}
      <Users className="w-3 h-3 flex-shrink-0" style={{ color: hasVisitors ? "#22d3a0" : "#7b7fa3" }} />
      <span
        className="text-[10px] font-black tabular-nums"
        style={{ color: hasVisitors ? "#22d3a0" : "#7b7fa3" }}
      >
        {count ?? "—"}
      </span>
      <span className="text-[10px] hidden sm:inline" style={{ color: hasVisitors ? "#6ee7b7" : "#7b7fa3" }}>
        agora
      </span>
    </Link>
  );
}

export function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  return (
    <header
      className="flex items-center gap-2 px-4 lg:px-6 py-3 flex-shrink-0"
      style={{ background: "#0f0c24", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-white/50 hover:text-white transition-colors flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-xs hidden sm:block">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/40"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Buscar...</span>
          <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)" }}>⌘K</span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Visitors now — links to Live View */}
        <VisitorsWidget />

        {/* Sessions shortcut */}
        <Link
          href="/admin/sessoes"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all hover:opacity-90"
          style={{
            background: "rgba(108,82,255,0.14)",
            border: "1px solid rgba(108,82,255,0.3)",
          }}
        >
          <MousePointer2 className="w-3 h-3" style={{ color: "#a78bfa" }} />
          <span className="text-[10px] font-bold hidden sm:inline" style={{ color: "#a78bfa" }}>Sessões</span>
        </Link>

        {/* Bell */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <Bell className="w-4 h-4" />
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          <Avatar name={user.name} />
          <div className="hidden md:block">
            <p className="text-white text-sm font-semibold leading-none">{user.name || "Admin"}</p>
            <p className="text-white/40 text-xs mt-0.5 truncate max-w-[140px]">{user.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-red-400 transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
