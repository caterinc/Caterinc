"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { StarBackground } from "./StarBackground";

interface AdminShellProps {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}

const DARK_CSS = `
  /* Default text color for all admin content */
  .adm { color: rgba(255,255,255,0.85); }

  /* Glass card utility */
  .glass-card {
    background: rgba(22,19,46,0.9) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255,255,255,0.16) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35) !important;
  }

  /* Scrollbar */
  .adm::-webkit-scrollbar { width: 5px; height: 5px; }
  .adm::-webkit-scrollbar-track { background: transparent; }
  .adm::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
  .adm::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }

  /* Text */
  .adm .text-cat-black, .adm .text-gray-900 { color: #ffffff !important; }
  .adm .text-gray-800 { color: rgba(255,255,255,0.88) !important; }
  .adm .text-gray-700 { color: rgba(255,255,255,0.75) !important; }
  .adm .text-gray-600 { color: rgba(255,255,255,0.62) !important; }
  .adm .text-gray-500 { color: rgba(255,255,255,0.48) !important; }
  .adm .text-gray-400 { color: rgba(255,255,255,0.38) !important; }

  /* Backgrounds */
  .adm .bg-white { background: #16132e !important; }
  .adm .bg-gray-50 { background: rgba(255,255,255,0.03) !important; }
  .adm .bg-gray-100 { background: rgba(255,255,255,0.06) !important; }
  .adm .bg-gray-200 { background: rgba(255,255,255,0.09) !important; }
  .adm .bg-cat-yellow { background: #6c52ff !important; }
  .adm .text-cat-yellow { color: #a78bfa !important; }

  /* Borders */
  .adm .border, .adm .border-b, .adm .border-t, .adm .border-l, .adm .border-r { border-color: rgba(255,255,255,0.08) !important; }
  .adm .border-gray-100, .adm .border-gray-200, .adm .border-gray-300 { border-color: rgba(255,255,255,0.08) !important; }
  .adm .divide-y > * + * { border-color: rgba(255,255,255,0.06) !important; }

  /* Hover states */
  .adm .hover\\:bg-gray-50:hover { background: rgba(255,255,255,0.04) !important; }
  .adm .hover\\:bg-gray-100:hover { background: rgba(255,255,255,0.07) !important; }

  /* Inputs */
  .adm input:not([type="checkbox"]):not([type="radio"]), .adm textarea, .adm select {
    background: rgba(255,255,255,0.06) !important;
    border-color: rgba(255,255,255,0.1) !important;
    color: white !important;
  }
  .adm input::placeholder, .adm textarea::placeholder { color: rgba(255,255,255,0.3) !important; }
  .adm select option { background: #16132e; color: white; }

  /* Badges / pills using cat-black */
  .adm .bg-cat-black { background: rgba(255,255,255,0.1) !important; }
  .adm .border-cat-black { border-color: rgba(255,255,255,0.3) !important; }
  .adm .text-white { color: white !important; }

  /* Shadows */
  .adm .shadow, .adm .shadow-sm, .adm .shadow-md { box-shadow: none !important; }

  /* Tables */
  .adm table { border-color: rgba(255,255,255,0.08) !important; }
  .adm th { color: rgba(255,255,255,0.48) !important; background: rgba(255,255,255,0.03) !important; }
  .adm td { border-color: rgba(255,255,255,0.06) !important; }

  /* Visual Editor's settings panel is intentionally light-themed (it's meant
     to sit next to a live preview of the light storefront) — exempt it
     entirely from the dark overrides above, which were making input text
     white-on-white and unreadable while typing. */
  .adm .ve-light-panel .text-cat-black, .adm .ve-light-panel .text-gray-900 { color: #111827 !important; }
  .adm .ve-light-panel .text-gray-800 { color: #1f2937 !important; }
  .adm .ve-light-panel .text-gray-700 { color: #374151 !important; }
  .adm .ve-light-panel .text-gray-600 { color: #4b5563 !important; }
  .adm .ve-light-panel .text-gray-500 { color: #6b7280 !important; }
  .adm .ve-light-panel .text-gray-400 { color: #9ca3af !important; }
  .adm .ve-light-panel .bg-white { background: #ffffff !important; }
  .adm .ve-light-panel .bg-gray-50 { background: #f9fafb !important; }
  .adm .ve-light-panel .bg-gray-100 { background: #f3f4f6 !important; }
  .adm .ve-light-panel .bg-gray-200 { background: #e5e7eb !important; }
  .adm .ve-light-panel .border, .adm .ve-light-panel .border-b, .adm .ve-light-panel .border-t,
  .adm .ve-light-panel .border-l, .adm .ve-light-panel .border-r { border-color: #e5e7eb !important; }
  .adm .ve-light-panel .border-gray-100, .adm .ve-light-panel .border-gray-200,
  .adm .ve-light-panel .border-gray-300 { border-color: #e5e7eb !important; }
  .adm .ve-light-panel input:not([type="checkbox"]):not([type="radio"]),
  .adm .ve-light-panel textarea, .adm .ve-light-panel select {
    background: #ffffff !important;
    border-color: #d1d5db !important;
    color: #111827 !important;
  }
  .adm .ve-light-panel input::placeholder, .adm .ve-light-panel textarea::placeholder { color: #9ca3af !important; }
  .adm .ve-light-panel select option { background: #ffffff; color: #111827; }
  .adm .ve-light-panel .hover\\:bg-gray-50:hover { background: #f9fafb !important; }
  .adm .ve-light-panel .hover\\:bg-gray-100:hover { background: #f3f4f6 !important; }
`;

export function AdminShell({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden w-full" style={{ background: "#0b0a1e" }}>
      <style dangerouslySetInnerHTML={{ __html: DARK_CSS }} />

      {/* Star background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden style={{ zIndex: 0 }}>
        <StarBackground />
      </div>

      {/* Content layer */}
      <div className="relative flex flex-1 h-full overflow-hidden w-full min-w-0" style={{ zIndex: 1 }}>
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-full">
          <AdminHeader user={user} onMenuClick={() => setMobileOpen(true)} />
          <main className="adm flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 w-full">{children}</main>
        </div>
      </div>
    </div>
  );
}
