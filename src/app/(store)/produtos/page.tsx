import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: {
    categoria?: string;
    busca?: string;
    sortBy?: string;
  };
}

export default async function ProdutosPage({ searchParams }: PageProps) {
  const categoria = searchParams.categoria;
  const busca = searchParams.busca;
  const sortBy = searchParams.sortBy ?? "order";

  const where: Record<string, unknown> = { isActive: true };
  if (categoria) where.category = { slug: categoria };
  if (busca) where.name = { contains: busca, mode: "insensitive" };

  const orderBy =
    sortBy === "price_asc" ? { price: "asc" as const }
    : sortBy === "price_desc" ? { price: "desc" as const }
    : sortBy === "name" ? { name: "asc" as const }
    : sortBy === "newest" ? { createdAt: "desc" as const }
    : { order: "asc" as const };

  const [rawProducts, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, variants: true },
      orderBy,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  const products = rawProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    variants: p.variants.map((v) => ({ ...v, price: v.price ? Number(v.price) : null })),
  }));

  const sorts = [
    { value: "order", label: "Relevância" },
    { value: "newest", label: "Mais recentes" },
    { value: "price_asc", label: "Menor preço" },
    { value: "price_desc", label: "Maior preço" },
    { value: "name", label: "A-Z" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-cat-black uppercase">
          {categoria
            ? categories.find((c) => c.slug === categoria)?.name || "Produtos"
            : busca
            ? `Resultados para "${busca}"`
            : "Todos os Produtos"}
        </h1>
        <p className="text-gray-500 mt-1">{total} produto{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-lg border p-4 sticky top-24">
            <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Coleções</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/produtos"
                  className={cn(
                    "block text-sm px-2 py-1.5 rounded hover:bg-cat-yellow hover:text-cat-black transition-colors",
                    !categoria && "bg-cat-black text-white"
                  )}
                >
                  Todos
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/produtos?categoria=${cat.slug}`}
                    className={cn(
                      "block text-sm px-2 py-1.5 rounded hover:bg-cat-yellow hover:text-cat-black transition-colors",
                      categoria === cat.slug && "bg-cat-black text-white"
                    )}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {/* Sort */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex gap-2 flex-wrap">
              {sorts.map((s) => (
                <Link
                  key={s.value}
                  href={`/produtos?${new URLSearchParams({
                    ...(categoria ? { categoria } : {}),
                    ...(busca ? { busca } : {}),
                    sortBy: s.value,
                  })}`}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors",
                    sortBy === s.value
                      ? "bg-cat-black text-white border-cat-black"
                      : "border-gray-300 hover:border-cat-black"
                  )}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl font-medium">Nenhum produto encontrado</p>
              <Link href="/produtos" className="text-cat-yellow hover:underline mt-2 block">
                Ver todos os produtos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
