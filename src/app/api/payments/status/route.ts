import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Polls whether a PIX payment has been confirmed
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ paid: false });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true },
  });

  return NextResponse.json({ paid: order?.paymentStatus === "PAID" });
}
