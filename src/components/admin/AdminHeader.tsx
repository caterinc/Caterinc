"use client";

import { signOut } from "next-auth/react";
import { User, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  user: { name?: string | null; email?: string | null };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:text-gray-600 relative">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cat-black rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-cat-yellow" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-none">{user.name || "Admin"}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
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
