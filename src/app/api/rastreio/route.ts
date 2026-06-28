import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const numero = req.nextUrl.searchParams.get("numero")?.trim().toUpperCase();
  if (!numero) return NextResponse.json({ error: "Informe o número do pedido" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { orderNumber: numero },
    select: {
      orderNumber: true,
      createdAt: true,
      shippingAddress: true,
      items: {
        select: { name: true, image: true, size: true, color: true, quantity: true },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  const addr = order.shippingAddress as Record<string, string>;

  return NextResponse.json({
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    firstName: addr?.name?.split(" ")[0] || "Cliente",
    city: addr?.city || "",
    state: addr?.state || "",
    items: order.items,
  });
}
