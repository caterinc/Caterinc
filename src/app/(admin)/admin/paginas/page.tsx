import { prisma } from "@/lib/prisma";
import PaginasClient from "./PaginasClient";

export default async function PaginasPage() {
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white">Páginas</h1>
        <p className="text-xs mt-0.5" style={{ color: "#7b7fa3" }}>
          Conteúdo de páginas como Quem Somos, Trocas, Garantia — linkadas no rodapé
        </p>
      </div>
      <PaginasClient initialPages={pages.map((p) => ({ id: p.id, slug: p.slug, title: p.title, content: p.content }))} />
    </div>
  );
}
