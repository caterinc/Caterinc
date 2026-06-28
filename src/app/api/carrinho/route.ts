import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOrCreateCart(userId?: string, sessionId?: string) {
  if (userId) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: { include: { product: true, variant: true } } },
    });
  }
  if (sessionId) {
    return prisma.cart.upsert({
      where: { sessionId },
      update: {},
      create: { sessionId },
      include: { items: { include: { product: true, variant: true } } },
    });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionId = req.cookies.get("cart_session")?.value;
  const userId = session ? (session.user as { id: string }).id : undefined;

  const cart = await getOrCreateCart(userId, sessionId);
  return NextResponse.json(cart);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionId = req.cookies.get("cart_session")?.value || randomSessionId();
  const userId = session ? (session.user as { id: string }).id : undefined;
  const body = await req.json();
  const { productId, variantId, quantity } = body;

  let cart = await getOrCreateCart(userId, sessionId);
  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId },
      include: { items: { include: { product: true, variant: true } } },
    });
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, variantId },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity },
    });
  }

  const updated = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true, variant: true } } },
  });

  const response = NextResponse.json(updated);
  if (!session) {
    response.cookies.set("cart_session", sessionId, { maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}

function randomSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
