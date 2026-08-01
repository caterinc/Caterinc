import { getRealBuyers } from "@/lib/buyers";
import { formatPrice } from "@/lib/utils";
import { Users, FileDown } from "lucide-react";

const GLASS: React.CSSProperties = {
  background: "rgba(22,19,46,0.9)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
};

export default async function CompradoresPage() {
  const buyers = await getRealBuyers();
  buyers.sort((a, b) => b.lastPurchaseAt.getTime() - a.lastPurchaseAt.getTime());

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Compradores</h1>
          <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>
            {buyers.length} cliente{buyers.length !== 1 ? "s" : ""} que já pagaram — pronto pra criar Público
            Personalizado / Lookalike no Meta
          </p>
        </div>
        <a
          href="/api/admin/compradores/csv"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #4c37e8, #6c52ff)" }}
        >
          <FileDown className="w-4 h-4" />
          Baixar CSV para o Meta
        </a>
      </div>

      {buyers.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={GLASS}>
          <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "#4a4870" }} />
          <p className="text-sm" style={{ color: "#7b7fa3" }}>Nenhum comprador real ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={GLASS}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#7b7fa3" }}>Nome</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#7b7fa3" }}>E-mail</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#7b7fa3" }}>Telefone</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#7b7fa3" }}>Cidade/UF</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-right" style={{ color: "#7b7fa3" }}>Última compra</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b) => (
                  <tr key={b.email} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">{b.name || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "#a78bfa" }}>{b.email}</td>
                    <td className="px-4 py-3" style={{ color: "#7b7fa3" }}>{b.phone || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "#7b7fa3" }}>{[b.city, b.state].filter(Boolean).join("/") || "—"}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="text-white font-semibold">{formatPrice(b.total)}</span>{" "}
                      <span className="text-[11px]" style={{ color: "#7b7fa3" }}>
                        {b.lastPurchaseAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
