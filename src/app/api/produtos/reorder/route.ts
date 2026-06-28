import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { order }: { order: Array<{ id: string; order: number }> } = await req.json();

  await Promise.all(
    order.map((item) =>
      prisma.product.update({ where: { id: item.id }, data: { order: item.order } })
    )
  );

  return NextResponse.json({ success: true });
}
