import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const product = await prisma.product.findFirst({ where: { name: { contains: 'Force One', mode: 'insensitive' } } });
const reviews = await prisma.review.findMany({ where: { productId: product.id } });

let updated = 0;
for (const r of reviews) {
  if (!r.comment || !/adventure/i.test(r.comment)) continue;
  const newComment = r.comment.replace(/Adventure/g, 'Force One');
  await prisma.review.update({ where: { id: r.id }, data: { comment: newComment } });
  updated++;
}

console.log(`Atualizadas ${updated} de ${reviews.length} avaliações.`);
await prisma.$disconnect();
