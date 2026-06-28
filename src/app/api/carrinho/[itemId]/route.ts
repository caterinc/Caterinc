import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
  const { quantity } = await req.json();

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: params.itemId } });
    return NextResponse.json({ success: true });
  }

  const item = await prisma.cartItem.update({
    where: { id: params.itemId },
    data: { quantity },
  });
  return NextResponse.json(item);
}

export async function DELETE(_: NextRequest, { params }: { params: { itemId: string } }) {
  await prisma.cartItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ success: true });
}
