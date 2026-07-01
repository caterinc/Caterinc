import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const all = await prisma.order.findMany({
  orderBy: { createdAt: "desc" },
  take: 10,
  select: { orderNumber: true, total: true, paymentStatus: true, mpPaymentId: true, createdAt: true, updatedAt: true }
});

console.log("=== ÚLTIMOS 10 PEDIDOS ===");
for (const o of all) {
  console.log(`${o.orderNumber} | R$${o.total} | ${o.paymentStatus} | mpId: ${o.mpPaymentId ? "✅" : "❌ VAZIO"} | criado: ${o.createdAt.toLocaleString('pt-BR')}`);
}

await prisma.$disconnect();
