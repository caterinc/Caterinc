"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Search, X, ChevronRight, Truck } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { CartDrawer } from "./CartDrawer";

interface MenuItem {
  id: string;
  label: string;
  url: string;
}

export interface HeaderProps {
  menuItems?: MenuItem[];
  storeName?: string;
  logoImage?: string;
  logoDesktopHeight?: number;
  logoMobileHeight?: number;
  headerBgColor?: string;
  headerLinkColor?: string;
  announcementText?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
}

export function Header({
  menuItems = [],
  storeName = "CAT Store",
  logoImage,
  logoDesktopHeight = 40,
  logoMobileHeight = 32,
  headerBgColor,
  headerLinkColor,
  announcementText = "Frete grátis acima de R$ 299 | Entrega em todo o Brasil",
  announcementBgColor = "#FFCD11",
  announcementTextColor = "#000000",
}: HeaderProps) {
  const { itemCount, dispatch } = useCart();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems: MenuItem[] =
    menuItems.length > 0
      ? menuItems
      : [
          { id: "1", label: "Produtos", url: "/produtos" },
          { id: "2", label: "Botas", url: "/produtos?categoria=botas" },
          { id: "3", label: "Tênis", url: "/produtos?categoria=tenis" },
          { id: "4", label: "Sapatos", url: "/produtos?categoria=sapatos" },
        ];

  const bgStyle = headerBgColor ? { backgroundColor: headerBgColor } : {};
  const linkStyle = headerLinkColor ? { color: headerLinkColor } : {};

  const LogoEl = () =>
    logoImage ? (
      <Image
        src={logoImage}
        alt={storeName}
        width={200}
        height={logoDesktopHeight}
        style={{ height: `${logoDesktopHeight}px`, width: "auto", objectFit: "contain" }}
        className="block"
      />
    ) : (
      <div className="flex flex-col items-center">
        <span className="font-black text-2xl tracking-[0.2em] leading-none">
          {storeName.toUpperCase()}
        </span>
        <span className="text-[10px] tracking-[0.3em] opacity-60 mt-0.5">
          DESDE 2017
        </span>
      </div>
    );

  return (
    <>
      <header
        data-ve-section="header"
        data-ve-label="Cabeçalho"
        suppressHydrationWarning
        className="bg-cat-black text-white sticky top-0 z-40 shadow-lg"
        style={bgStyle}
      >
        {/* Announcement bar */}
        <div
          data-ve-section="announcement"
          data-ve-label="Barra de Anúncio"
          suppressHydrationWarning
          className="text-xs text-center py-1.5 font-semibold"
          style={{ backgroundColor: announcementBgColor, color: announcementTextColor }}
        >
          {announcementText}
        </div>

        {/* Main row: hamburger/search | logo | user/cart */}
        <div className="relative max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left group */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-gray-300 hover:text-cat-yellow transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link
              href="/produtos"
              className="text-gray-300 hover:text-cat-yellow transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </Link>
          </div>

          {/* Center: Logo (absolutely centered) */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
            style={linkStyle}
          >
            <LogoEl />
          </Link>

          {/* Right group */}
          <div className="flex items-center gap-3">
            <Link
              href="/rastreio"
              className="text-gray-300 hover:text-cat-yellow transition-colors"
              aria-label="Rastrear pedido"
              title="Rastrear pedido"
            >
              <Truck className="w-5 h-5" />
            </Link>
            <Link
              href={session ? "/conta" : "/conta/login"}
              className="text-gray-300 hover:text-cat-yellow transition-colors"
              aria-label="Conta"
            >
              <User className="w-5 h-5" />
            </Link>
            <button
              onClick={() => dispatch({ type: "OPEN_DRAWER" })}
              className="text-gray-300 hover:text-cat-yellow transition-colors relative"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-cat-yellow text-cat-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Drawer panel */}
          <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl">
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={bgStyle}
            >
              <span className="font-bold text-base" style={headerBgColor ? { color: headerLinkColor || "#fff" } : {}}>
                Menu
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded hover:bg-white/20 transition-colors"
                style={headerBgColor ? { color: headerLinkColor || "#fff" } : {}}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-5 py-3 text-gray-800 hover:bg-gray-50 hover:text-cat-black transition-colors font-medium border-b border-gray-100"
                >
                  {item.label}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </nav>
            <div className="p-5 border-t space-y-3">
              <Link
                href="/rastreio"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-cat-black"
              >
                <Truck className="w-4 h-4" />
                Rastrear pedido
              </Link>
              <Link
                href={session ? "/conta" : "/conta/login"}
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-cat-black"
              >
                <User className="w-4 h-4" />
                {session ? "Minha conta" : "Entrar"}
              </Link>
            </div>
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      <CartDrawer />
    </>
  );
}
