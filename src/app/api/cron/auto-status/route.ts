import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isCronSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !isCronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Orders that had CONFIRMED status set more than 37 minutes ago
  const thirtySevenMinAgo = new Date(Date.now() - 37 * 60 * 1000);

  const ordersToProcess = await prisma.order.findMany({
    where: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      statusHistory: {
        some: {
          status: "CONFIRMED",
          createdAt: { lte: thirtySevenMinAgo },
        },
      },
    },
  });

  let updated = 0;

  for (const order of ordersToProcess) {
    try {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: "PROCESSING" },
        }),
        prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "PROCESSING",
            note: "Pedido em separação — atualizado automaticamente",
          },
        }),
      ]);
      updated++;
      console.log(`[AutoStatus] ${order.orderNumber} → PROCESSING`);
    } catch (e) {
      console.error(`[AutoStatus] erro em ${order.orderNumber}:`, e);
    }
  }

  return NextResponse.json({ checked: ordersToProcess.length, updated });
}
