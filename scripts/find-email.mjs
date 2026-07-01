import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const orders = await prisma.order.findMany({
  where: { email: "fuleragem01@icloud.com" },
  include: { items: true },
  orderBy: { createdAt: "desc" },
});

for (const o of orders) {
  console.log(`${o.orderNumber} | R$${o.total} | ${o.paymentStatus} | mpId: ${o.mpPaymentId} | ${o.createdAt.toLocaleString('pt-BR')}`);
  for (const i of o.items) console.log(`  - ${i.name} x${i.quantity} R$${i.price}`);
}

await prisma.$disconnect();
