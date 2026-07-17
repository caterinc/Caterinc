"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

export function SacForm() {
  const [form, setForm] = useState({ name: "", email: "", cpf: "", phone: "", subject: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Não foi possível enviar. Tente novamente.");
        return;
      }
      setSent(true);
    } catch {
      setError("Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-10 rounded-xl border border-green-200 bg-green-50 p-6 flex items-center gap-3">
        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-800">
          Recebemos sua solicitação. Vamos responder em breve pelo e-mail informado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-3">
      <p className="text-sm text-gray-500">
        Para agilizarmos o retorno, insira os detalhes de sua solicitação.
      </p>
      <input
        required value={form.name} onChange={set("name")} placeholder="Nome Completo"
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cat-yellow"
      />
      <input
        required type="email" value={form.email} onChange={set("email")} placeholder="E-mail"
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cat-yellow"
      />
      <input
        value={form.cpf} onChange={set("cpf")} placeholder="CPF"
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cat-yellow"
      />
      <input
        value={form.phone} onChange={set("phone")} placeholder="Telefone"
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cat-yellow"
      />
      <input
        required value={form.subject} onChange={set("subject")} placeholder="Assunto"
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cat-yellow"
      />
      <textarea
        required value={form.description} onChange={set("description")} placeholder="Descrição" rows={5}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cat-yellow resize-y"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full h-12 flex items-center justify-center gap-2 font-black text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: "#16c789", color: "#fff" }}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Enviar solicitação
      </button>
    </form>
  );
}
