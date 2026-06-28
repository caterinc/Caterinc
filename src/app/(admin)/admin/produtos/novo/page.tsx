import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import Link from "next/link";

export default async function NovoProdutoPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/produtos" className="hover:text-cat-black">← Produtos</Link>
        <span>/</span>
        <span className="text-cat-black font-medium">Novo Produto</span>
      </div>
      <h1 className="text-2xl font-black text-cat-black mb-6">Novo Produto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
