import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Pull MP_ACCESS_TOKEN from DB env or process
const token = process.env.MP_ACCESS_TOKEN;
if (!token) { console.error("MP_ACCESS_TOKEN not set"); process.exit(1); }

// Search recent approved payments
const res = await fetch(
  "https://api.mercadopago.com/v1/payments/search?status=approved&sort=date_created&criteria=desc&range=date_created&begin_date=NOW-30DAYS&end_date=NOW",
  { headers: { Authorization: `Bearer ${token}` } }
);
const data = await res.json();

if (!data.results) { console.log(JSON.stringify(data)); process.exit(1); }

for (const p of data.results) {
  console.log(`MP ID: ${p.id} | valor: ${p.transaction_amount} | status: ${p.status} | ref: ${p.external_reference} | data: ${p.date_approved}`);
}

await prisma.$disconnect();
