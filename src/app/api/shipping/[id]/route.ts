import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const method = await prisma.shippingMethod.update({
    where: { id: params.id },
    data: {
      name: String(body.name || ""),
      description: body.description ? String(body.description) : null,
      price: Number(body.price ?? 0),
      minDays: body.minDays ? Number(body.minDays) : null,
      maxDays: body.maxDays ? Number(body.maxDays) : null,
      freeAbove: body.freeAbove ? Number(body.freeAbove) : null,
      isActive: body.isActive !== false,
      order: Number(body.order ?? 0),
    },
  });
  return NextResponse.json(method);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.shippingMethod.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
