import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { slug: { contains: "caterpillar" } },
  select: { id: true, name: true, slug: true }
});

console.log(`Encontrados: ${products.length} produtos`);

for (const p of products) {
  const newSlug = p.slug.replace(/-caterpillar-?/g, "-").replace(/^caterpillar-?/, "").replace(/-$/, "");
  await prisma.product.update({ where: { id: p.id }, data: { slug: newSlug } });
  console.log(`${p.slug} → ${newSlug}`);
}

await prisma.$disconnect();
