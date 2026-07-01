import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendUtmifyEvent } from "@/lib/utmify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { totalInCents, customerName, customerEmail, paymentMethod } = await req.json() as {
    totalInCents: number;
    customerName?: string;
    customerEmail?: string;
    paymentMethod?: string;
  };

  const orderId = `MANUAL-${Date.now()}`;

  await sendUtmifyEvent(
    orderId,
    "paid",
    { name: customerName || "Cliente", email: customerEmail || "cliente@loja.com" },
    [{ id: "manual", name: "Pedido manual", quantity: 1, priceInCents: totalInCents }],
    totalInCents,
    new Date(),
    null,
    paymentMethod || "pix"
  );

  return NextResponse.json({ ok: true, orderId, total: totalInCents / 100 });
}
