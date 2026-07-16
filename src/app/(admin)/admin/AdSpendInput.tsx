"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Check, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Entry { date: string; amount: number }

function todayInputValue(): string {
  // Brazil "today" as YYYY-MM-DD, independent of the browser's own TZ.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export default function AdSpendInput() {
  const router = useRouter();
  const [date, setDate] = useState(todayInputValue());
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);

  const loadEntries = () => {
    fetch("/api/admin/ad-spend")
      .then((r) => r.json())
      .then((d: { entries?: Entry[] }) => setEntries(d.entries || []))
      .catch(() => {});
  };

  useEffect(() => { loadEntries(); }, []);

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    if (!date || Number.isNaN(value) || value < 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ad-spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, amount: value }),
      });
      if (res.ok) {
        setSaved(true);
        setAmount("");
        loadEntries();
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{
      background: "rgba(22,19,46,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.16)", boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    }}>
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
          <Wallet className="w-4 h-4" style={{ color: "#f87171" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Gasto com anúncio</p>
          <p className="text-[11px]" style={{ color: "#7b7fa3" }}>
            Lançamento manual — enquanto não há integração automática
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="text-xs px-2.5 py-2 rounded-lg outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
        />
        <input
          type="text" inputMode="decimal" value={amount} placeholder="0,00"
          onChange={(e) => setAmount(e.target.value)}
          className="text-xs px-2.5 py-2 rounded-lg outline-none w-24"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
        />
        <button
          onClick={save}
          disabled={saving || !amount}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #4c37e8, #6c52ff)" }}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
          {saved ? "Salvo" : "Salvar"}
        </button>
      </div>

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {entries.map((e) => (
            <button
              key={e.date}
              onClick={() => { setDate(e.date.slice(0, 10)); setAmount(String(e.amount).replace(".", ",")); }}
              className="text-[10px] px-2 py-1 rounded-full transition-colors hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.04)", color: "#7b7fa3" }}
              title="Clique para editar este dia"
            >
              {new Date(e.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })}
              {" — "}{formatPrice(e.amount)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
