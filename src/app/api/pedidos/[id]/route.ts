import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: params.id }, { orderNumber: params.id }],
    },
    include: {
      items: { include: { product: true, variant: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as { id: string; role: string }).id;
  const isAdmin = (session.user as { role: string }).role === "ADMIN";

  if (!isAdmin && order.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, trackingCode, note, paymentStatus } = body;

  const updateData: Record<string, unknown> = {};
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (trackingCode !== undefined) updateData.trackingCode = trackingCode;

  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...(status ? { status } : {}),
      },
    });

    if (status) {
      await tx.orderStatusHistory.create({
        data: { orderId: params.id, status, note: note || null },
      });
    }

    return updated;
  });

  return NextResponse.json(order);
}
