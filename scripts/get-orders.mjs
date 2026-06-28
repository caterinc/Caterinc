import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const orders = await prisma.order.findMany({
  select: { orderNumber: true, createdAt: true, status: true },
  orderBy: { createdAt: 'desc' },
  take: 5,
});
console.log(JSON.stringify(orders, null, 2));
await prisma.$disconnect();
