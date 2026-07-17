"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/carrinho"];

export function NewsletterBanner() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("success");
  };

  return (
    <section className="border-t border-b border-gray-200 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-black uppercase tracking-wide text-gray-900 mb-6">
          Novidades e Ofertas
        </h2>

        {status === "success" ? (
          <div className="flex items-center gap-3 py-3 px-4 bg-green-50 border border-green-200 rounded">
            <span className="text-green-700 font-semibold text-sm">Email cadastrado com sucesso!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-0">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="flex-1 border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              className="bg-cat-yellow text-black font-black text-sm px-6 py-3 uppercase tracking-widest hover:brightness-95 transition-all"
            >
              Assinar
            </button>
          </form>
        )}

        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          Ao introduzir os seus dados acima, concorda em receber atualizações da Caterpillar sobre
          ofertas e tendências de acordo com os Termos e{" "}
          <a
            href="/privacidade"
            className="underline text-gray-700 hover:text-black transition-colors"
          >
            Política de Privacidade
          </a>
          .
        </p>
      </div>
    </section>
  );
}
