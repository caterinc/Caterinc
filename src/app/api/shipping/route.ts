import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  // "all=1" for admin (returns inactive too), default returns active only for checkout
  const methods = await prisma.shippingMethod.findMany({
    where: all ? {} : { isActive: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(
    methods.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: Number(m.price),
      minDays: m.minDays,
      maxDays: m.maxDays,
      freeAbove: m.freeAbove ? Number(m.freeAbove) : null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const method = await prisma.shippingMethod.create({
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
