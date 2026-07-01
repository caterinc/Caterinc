import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const orders = await prisma.order.findMany({
  where: { paymentStatus: "PAID" },
  include: { items: true },
  orderBy: { updatedAt: "desc" },
});
for (const o of orders) {
  console.log(`${o.orderNumber} | total: R$${o.total} | criado: ${o.createdAt.toLocaleString('pt-BR')} | atualizado: ${o.updatedAt.toLocaleString('pt-BR')}`);
  for (const i of o.items) console.log(`  - ${i.name} x${i.quantity}`);
}
console.log("Total PAID:", orders.length);
await prisma.$disconnect();
