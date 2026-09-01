import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xequeGetTransaction } from "@/lib/xeque";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (!order.mpPaymentId) return NextResponse.json({ error: "Pedido sem transação no gateway" }, { status: 400 });

  const status = await xequeGetTransaction(order.mpPaymentId);
  if (!status) return NextResponse.json({ error: "Não foi possível consultar o gateway agora" }, { status: 502 });

  let confirmed = false;
  if (status === "APPROVED" && order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "CONFIRMED", note: `PIX aprovado — confirmado manualmente pelo admin via consulta ao gateway (${order.mpPaymentId})` },
    });
    confirmed = true;
  }

  return NextResponse.json({ status, confirmed });
}
