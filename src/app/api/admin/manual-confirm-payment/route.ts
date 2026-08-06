import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent, type PixelSource } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

// Temporary, one-off endpoint: manually reconciles a specific order after
// human confirmation from Vezion support that a payment cleared even though
// Vezion's own API status hasn't updated yet. Deleted right after use.
const ONE_OFF_SECRET = "resolve-f8eir-2026-08-05-manual";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-manual-secret");
  if (auth !== ONE_OFF_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, correctPixelSource } = (await req.json()) as {
    orderId: string;
    correctPixelSource?: PixelSource | null;
  };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (order.paymentStatus === "PAID") return NextResponse.json({ ok: true, already: true });

  const utms = (order.utmData as Record<string, string> | null) || {};
  const fixedUtms = { ...utms, pixelSource: correctPixelSource || undefined };
  if (!fixedUtms.pixelSource) delete fixedUtms.pixelSource;

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", status: "CONFIRMED", utmData: fixedUtms },
  });
  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: "CONFIRMED", note: "PIX aprovado — confirmado manualmente via suporte Vezion (status ainda não refletido na API deles)" },
  });

  const addr = order.shippingAddress as Record<string, string> | null;
  const nameParts = (addr?.name || "Cliente").split(" ");
  const fbc = utms.fbc || null;
  const fbp = utms.fbp || null;
  const externalId = utms.externalId || null;
  const pixelSource = correctPixelSource || null;

  await sendUtmifyEvent(
    order.orderNumber, "paid",
    { name: addr?.name || "Cliente", email: order.email, phone: addr?.phone },
    order.items.map((i) => ({ id: i.productId || "item", name: i.name, quantity: i.quantity, priceInCents: Math.round(Number(i.price) * 100) })),
    Math.round(Number(order.total) * 100),
    order.createdAt, utms, order.paymentMethod || "pix"
  ).catch((e) => console.error("[ManualConfirm/UTMify]", e));

  await sendMetaEvent({
    eventName: "Purchase", eventId: `${order.orderNumber}-purchase`,
    email: order.email, phone: addr?.phone || null,
    firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
    value: Number(order.total), currency: "BRL",
    contents: order.items.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
    orderId: order.orderNumber, fbc, fbp, externalId, pixelSource,
  }).catch((e) => console.error("[ManualConfirm/Meta]", e));

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber, pixelSource });
}
