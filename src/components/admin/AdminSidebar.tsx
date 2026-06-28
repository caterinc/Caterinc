"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingBag, Users,
  BarChart3, FileDown, Palette, Star, ChevronLeft, ChevronRight, Plug, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Produtos", href: "/admin/produtos", icon: Package },
  { label: "Coleções", href: "/admin/colecoes", icon: FolderOpen },
  { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
  { label: "Estoque", href: "/admin/estoque", icon: BarChart3 },
  { label: "Avaliações", href: "/admin/avaliacoes", icon: Star },
  { label: "Frete", href: "/admin/frete", icon: Truck },
  { label: "Importar/Exportar", href: "/admin/importar", icon: FileDown },
  { label: "Integração", href: "/admin/integracao", icon: Plug },
  { label: "Editor Visual", href: "/admin/visual/editor", icon: Palette },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-cat-black text-white flex flex-col transition-all duration-300 flex-shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-cat-yellow text-cat-black font-black text-sm px-2 py-0.5 tracking-widest rounded">dropfy</div>
            <span className="font-bold text-sm text-gray-300">Admin</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-cat-yellow text-cat-black"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Ver loja
          </Link>
        </div>
      )}
    </div>
  );
}
