import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Mail, Phone, IdCard, ShoppingBag } from "lucide-react";

const GLASS: React.CSSProperties = {
  background: "rgba(22,19,46,0.9)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
};

export default async function SacPage() {
  const requests = await prisma.sacRequest.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white">SAC</h1>
        <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>
          Solicitações enviadas pela página Fale Conosco — {requests.length} no total
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={GLASS}>
          <p className="text-sm" style={{ color: "#7b7fa3" }}>Nenhuma solicitação ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl p-4" style={GLASS}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-white">{r.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>
                    {r.name} · {new Date(r.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </p>
                </div>
                {r.orderNumber ? (
                  <Link
                    href="/admin/pedidos"
                    className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(34,211,160,0.15)", color: "#22d3a0" }}
                    title="Ver pedidos"
                  >
                    <ShoppingBag className="w-3 h-3" /> Pedido {r.orderNumber}
                  </Link>
                ) : (
                  <span
                    className="text-[11px] font-bold px-2.5 py-1.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(123,127,163,0.12)", color: "#7b7fa3" }}
                  >
                    Sem pedido
                  </span>
                )}
              </div>

              <p className="text-sm text-white/85 mt-3 whitespace-pre-wrap">{r.description}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <a href={`mailto:${r.email}`} className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: "#7b7fa3" }}>
                  <Mail className="w-3.5 h-3.5" /> {r.email}
                </a>
                {r.phone && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "#7b7fa3" }}>
                    <Phone className="w-3.5 h-3.5" /> {r.phone}
                  </span>
                )}
                {r.cpf && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "#7b7fa3" }}>
                    <IdCard className="w-3.5 h-3.5" /> {r.cpf}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
