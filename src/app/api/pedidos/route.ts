import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status");
  const userId = (session.user as { id: string; role: string }).id;
  const isAdmin = (session.user as { role: string }).role === "ADMIN";

  const where: Record<string, unknown> = {};
  if (!isAdmin) where.userId = userId;
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true, variant: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { items, shippingAddress, email } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });

  const orderItems = items.map((item: { productId: string; variantId: string; quantity: number }) => {
    const product = products.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    const price = variant?.price ? parseFloat(variant.price.toString()) : parseFloat(product!.price.toString());

    return {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price,
      name: product!.name,
      size: variant?.size,
      color: variant?.color,
      image: product!.images[0] || null,
    };
  });

  const subtotal = orderItems.reduce(
    (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
    0
  );
  const shipping = subtotal >= 299 ? 0 : 29.9;
  const total = subtotal + shipping;
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return tx.order.create({
      data: {
        orderNumber,
        userId: session ? (session.user as { id: string }).id : null,
        email: email || session?.user?.email || "",
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal,
        shipping,
        total,
        shippingAddress,
        items: { create: orderItems },
        statusHistory: {
          create: [{ status: "PENDING", note: "Pedido realizado" }],
        },
      },
      include: { items: true },
    });
  });

  return NextResponse.json(order, { status: 201 });
}
