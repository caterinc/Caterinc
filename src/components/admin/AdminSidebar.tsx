"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingBag, Users,
  BarChart3, FileDown, Palette, Star, Plug, Truck, X, Radio,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Live View", href: "/admin/live", icon: Radio },
  { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
  { label: "Produtos", href: "/admin/produtos", icon: Package },
  { label: "Coleções", href: "/admin/colecoes", icon: FolderOpen },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
  { label: "Estoque", href: "/admin/estoque", icon: BarChart3 },
  { label: "Avaliações", href: "/admin/avaliacoes", icon: Star },
  { label: "Frete", href: "/admin/frete", icon: Truck },
  { label: "Importar/Exportar", href: "/admin/importar", icon: FileDown },
  { label: "Integrações", href: "/admin/integracao", icon: Plug },
  { label: "Editor Visual", href: "/admin/visual/editor", icon: Palette },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function PlanetIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="8" fill="#6c52ff" />
      <ellipse cx="14" cy="14" rx="13" ry="5" stroke="#a78bfa" strokeWidth="1.5" fill="none" opacity="0.7" />
      <circle cx="11" cy="11" r="2" fill="#a78bfa" opacity="0.5" />
    </svg>
  );
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col flex-shrink-0 transition-transform duration-300 z-30",
        "fixed inset-y-0 left-0 w-64 lg:relative lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
      style={{ background: "#0f0c24", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <PlanetIcon />
          <span className="text-white font-black text-lg tracking-tight">dropfy</span>
        </div>
        <button
          onClick={onMobileClose}
          className="lg:hidden text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    active
                      ? "text-white shadow-lg"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                  style={active ? { background: "linear-gradient(135deg, #4c37e8, #6c52ff)" } : {}}
                >
                  <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-white" : "")} />
                  <span>{item.label}</span>
                  {item.label === "Live View" && (
                    <span className="ml-auto flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white/70 text-xs transition-colors rounded-lg hover:bg-white/5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver loja
        </Link>
      </div>
    </aside>
  );
}
