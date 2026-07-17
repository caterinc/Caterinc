"use client";

import { useState } from "react";
import { FileText, Check, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";

interface PageRow { id: string; slug: string; title: string; content: string }

const GLASS: React.CSSProperties = {
  background: "rgba(22,19,46,0.9)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
};

export default function PaginasClient({ initialPages }: { initialPages: PageRow[] }) {
  const [pages, setPages] = useState(initialPages);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { title: string; content: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  function open(p: PageRow) {
    setOpenId(openId === p.id ? null : p.id);
    setDrafts((d) => ({ ...d, [p.id]: d[p.id] || { title: p.title, content: p.content } }));
  }

  async function save(p: PageRow) {
    const draft = drafts[p.id];
    if (!draft) return;
    setSavingId(p.id);
    try {
      const res = await fetch(`/api/admin/pages/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        setPages((ps) => ps.map((x) => x.id === p.id ? { ...x, ...draft } : x));
        setSavedId(p.id);
        setTimeout(() => setSavedId(null), 2000);
      }
    } finally {
      setSavingId(null);
    }
  }

  async function createPage() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        const { page } = await res.json() as { page: PageRow };
        setPages((ps) => [...ps, page].sort((a, b) => a.title.localeCompare(b.title)));
        setNewTitle("");
      }
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    setPages((ps) => ps.filter((p) => p.id !== id));
    if (openId === id) setOpenId(null);
  }

  return (
    <div className="space-y-3">
      {pages.map((p) => {
        const isOpen = openId === p.id;
        const draft = drafts[p.id] || { title: p.title, content: p.content };
        return (
          <div key={p.id} className="rounded-2xl p-4" style={GLASS}>
            <button onClick={() => open(p)} className="w-full flex items-center gap-3 text-left">
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: "rgba(108,82,255,0.15)" }}>
                <FileText className="w-4 h-4" style={{ color: "#a78bfa" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{p.title}</p>
                <p className="text-[11px]" style={{ color: "#7b7fa3" }}>/paginas/{p.slug}</p>
              </div>
              <a
                href={`/paginas/${p.slug}`} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                title="Ver página"
              >
                <ExternalLink className="w-3.5 h-3.5" style={{ color: "#7b7fa3" }} />
              </a>
            </button>

            {isOpen && (
              <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <input
                  type="text" value={draft.title}
                  onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, title: e.target.value } }))}
                  className="w-full text-sm font-bold px-3 py-2 rounded-lg outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                />
                <textarea
                  value={draft.content} rows={8}
                  placeholder="Escreva o conteúdo desta página aqui..."
                  onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, content: e.target.value } }))}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-y"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => save(p)}
                    disabled={savingId === p.id}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #4c37e8, #6c52ff)" }}
                  >
                    {savingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedId === p.id ? <Check className="w-3.5 h-3.5" /> : null}
                    {savedId === p.id ? "Salvo" : "Salvar"}
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
                    style={{ color: "#f87171" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* New page */}
      <div className="rounded-2xl p-4 flex items-center gap-2" style={GLASS}>
        <input
          type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título da nova página (ex: Perguntas Frequentes)"
          className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
        />
        <button
          onClick={createPage}
          disabled={creating || !newTitle.trim()}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-80 disabled:opacity-40 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #4c37e8, #6c52ff)" }}
        >
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Nova página
        </button>
      </div>
    </div>
  );
}
