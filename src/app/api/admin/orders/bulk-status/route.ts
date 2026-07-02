import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orderIds, status } = await req.json() as { orderIds: string[]; status: string };

  if (!orderIds?.length || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const orderStatus = status as OrderStatus;

  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { status: orderStatus },
  });

  await prisma.orderStatusHistory.createMany({
    data: orderIds.map((orderId) => ({
      orderId,
      status: orderStatus,
      note: "Status atualizado em massa pelo admin",
    })),
  });

  return NextResponse.json({ ok: true, updated: orderIds.length });
}
