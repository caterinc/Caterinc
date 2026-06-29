import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditProdutoPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  if (!product) notFound();

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku || "",
    price: product.price.toString(),
    comparePrice: product.comparePrice?.toString() || "",
    description: product.description || "",
    categoryId: product.categoryId || "",
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    tags: product.tags.join(", "),
    images: product.images,
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color || "",
      sku: v.sku || "",
      stock: v.stock,
      price: v.price?.toString() || "",
      images: (v as { images?: string[] }).images ?? [],
    })),
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/produtos" className="hover:text-cat-black">← Produtos</Link>
        <span>/</span>
        <span className="text-cat-black font-medium">Editar: {product.name}</span>
      </div>
      <h1 className="text-2xl font-black text-cat-black mb-6">Editar Produto</h1>
      <ProductForm categories={categories} initialData={initialData} />
    </div>
  );
}
