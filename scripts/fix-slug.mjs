import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { OR: [{ slug: { contains: "adventure" } }, { name: { contains: "adventure", mode: "insensitive" } }] },
  select: { id: true, name: true, slug: true }
});
console.log("Encontrados:", products);

if (products.length > 0) {
  const p = products[0];
  const newSlug = p.slug.replace("adventure", "force-one").replace("Adventure", "force-one");
  const newName = p.name.replace(/adventure/gi, "Force One");
  await prisma.product.update({
    where: { id: p.id },
    data: { name: newName, slug: newSlug }
  });
  console.log(`✅ Atualizado: ${p.name} → ${newName}`);
  console.log(`   Slug: ${p.slug} → ${newSlug}`);
}

await prisma.$disconnect();
