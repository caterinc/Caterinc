import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const products = await prisma.product.findMany({
  where: { isActive: true, variants: { some: { color: { not: null } } } },
  select: { slug: true, name: true },
  take: 5,
});
console.log(JSON.stringify(products, null, 2));
await prisma.$disconnect();
