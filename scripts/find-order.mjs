import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const orders = await prisma.order.findMany({
  include: { items: true },
  orderBy: { createdAt: "desc" },
});
for (const o of orders) {
  console.log(`${o.orderNumber} | total: ${o.total} | pay: ${o.paymentStatus} | ${o.createdAt}`);
}
console.log("Total de pedidos:", orders.length);
await prisma.$disconnect();
