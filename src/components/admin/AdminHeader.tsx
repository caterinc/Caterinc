"use client";

import { signOut } from "next-auth/react";
import { User, LogOut, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  user: { name?: string | null; email?: string | null };
  onMenuClick?: () => void;
}

export function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="text-gray-500 hover:text-gray-800 transition-colors lg:hidden flex-shrink-0"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 relative">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cat-black rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-cat-yellow" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-none">{user.name || "Admin"}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-gray-500 hover:text-red-500"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
