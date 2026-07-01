import { PrismaClient } from "@prisma/client";

const ORDER_NUMBER = process.argv[2];
if (!ORDER_NUMBER) { console.error("Uso: node scripts/confirm-order.mjs CAT-XXXX"); process.exit(1); }

const prisma = new PrismaClient();

const order = await prisma.order.findFirst({
  where: { orderNumber: ORDER_NUMBER },
  include: { items: true },
});

if (!order) { console.error("Pedido não encontrado:", ORDER_NUMBER); process.exit(1); }

console.log(`Encontrado: ${order.orderNumber} | R$${order.total} | ${order.paymentStatus}`);

if (order.paymentStatus === "PAID") {
  console.log("Já está PAID — enviando UTMify mesmo assim...");
}

// Atualiza para PAID
await prisma.order.update({
  where: { id: order.id },
  data: { paymentStatus: "PAID", status: "CONFIRMED" },
});
await prisma.orderStatusHistory.create({
  data: { orderId: order.id, status: "CONFIRMED", note: "Confirmado manualmente via script" },
});

console.log(`✅ DB atualizado para PAID`);

// Envia UTMify
const UTMIFY_API_KEY = process.env.UTMIFY_API_KEY;
if (!UTMIFY_API_KEY) { console.warn("UTMIFY_API_KEY não configurado localmente — use o botão no admin"); }
else {
  const addr = order.shippingAddress;
  const payload = {
    orderId: order.orderNumber,
    status: "paid",
    platform: "other",
    paymentMethod: "pix",
    createdAt: order.createdAt.toISOString().replace("T"," ").slice(0,19),
    approvedDate: new Date().toISOString().replace("T"," ").slice(0,19),
    refundedAt: null,
    customer: { name: addr?.name || "Cliente", email: order.email, phone: addr?.phone || null, document: null },
    products: order.items.map(i => ({ id: i.productId || "item", name: i.name, planId: null, planName: null, quantity: i.quantity, priceInCents: Math.round(Number(i.price)*100) })),
    trackingParameters: { src: null, sck: null, utm_source: null, utm_campaign: null, utm_medium: null, utm_content: null, utm_term: null },
    commission: { totalInCents: Math.round(Number(order.total)*100), totalPriceInCents: Math.round(Number(order.total)*100), gatewayFeeInCents: 0, userCommissionInCents: Math.round(Number(order.total)*100) },
  };
  const res = await fetch("https://api.utmify.com.br/api-credentials/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-token": UTMIFY_API_KEY },
    body: JSON.stringify(payload),
  });
  console.log(`UTMify: ${res.status} ${await res.text()}`);
}

await prisma.$disconnect();
