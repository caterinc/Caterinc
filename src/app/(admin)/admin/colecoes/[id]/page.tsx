import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CollectionEditor } from "./CollectionEditor";

interface PageProps {
  params: { id: string };
}

export default async function ColecaoPage({ params }: PageProps) {
  const [collection, allProducts] = await Promise.all([
    prisma.category.findUnique({
      where: { id: params.id },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        categoryId: true,
        sku: true,
        variants: { select: { stock: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!collection) notFound();

  const inCollection = allProducts.filter((p) => p.categoryId === params.id);
  const notInCollection = allProducts.filter((p) => p.categoryId !== params.id);

  return (
    <CollectionEditor
      collection={{
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        image: collection.image,
      }}
      inCollection={inCollection.map((p) => ({
        id: p.id,
        name: p.name,
        images: p.images,
        price: Number(p.price),
        sku: p.sku,
        stock: p.variants.reduce((s, v) => s + v.stock, 0),
      }))}
      notInCollection={notInCollection.map((p) => ({
        id: p.id,
        name: p.name,
        images: p.images,
        price: Number(p.price),
        sku: p.sku,
        stock: p.variants.reduce((s, v) => s + v.stock, 0),
      }))}
    />
  );
}
