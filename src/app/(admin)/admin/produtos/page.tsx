import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "./ProductsTable";

interface PageProps {
  searchParams: { page?: string; search?: string; categoria?: string; status?: string };
}

export default async function AdminProdutosPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 15;
  const search = searchParams.search;
  const categoria = searchParams.categoria;
  // "status" param: "todos" shows all, default shows only active
  const showAll = searchParams.status === "todos";

  const where: Record<string, unknown> = {};
  if (!showAll) where.isActive = true;
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (categoria) where.category = { slug: categoria };

  const [products, total, totalActive, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, variants: true },
      orderBy: { order: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  const pages = Math.ceil(total / limit);
  const buildQuery = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoria) params.set("categoria", categoria);
    if (showAll) params.set("status", "todos");
    Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    const q = params.toString();
    return `/admin/produtos${q ? `?${q}` : ""}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-cat-black">Produtos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {showAll ? `${total} produtos (todos)` : `${totalActive} ativos`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/csv/export">
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </a>
          </Button>
          <Button asChild>
            <Link href="/admin/produtos/novo">
              <Plus className="w-4 h-4 mr-2" /> Novo Produto
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-4 flex flex-wrap gap-3 items-center">
        <form className="flex flex-wrap gap-2" method="GET">
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar produto..."
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow"
          />
          <select name="categoria" defaultValue={categoria} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow">
            <option value="">Todas categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select name="status" defaultValue={showAll ? "todos" : "ativos"} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow">
            <option value="ativos">Somente ativos</option>
            <option value="todos">Todos (incluindo inativos)</option>
          </select>
          <Button type="submit" size="sm" variant="outline">Filtrar</Button>
        </form>
      </div>

      <ProductsTable products={products} />

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildQuery({ page: String(p) })}
              className={`w-9 h-9 flex items-center justify-center rounded border text-sm ${p === page ? "bg-cat-black text-white border-cat-black" : "border-gray-300 hover:border-cat-black"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
