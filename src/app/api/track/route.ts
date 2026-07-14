import { NextRequest, NextResponse } from "next/server";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || null;
  const clientUserAgent = req.headers.get("user-agent") || null;

  let body: {
    event?: string;
    productId?: string;
    productName?: string;
    value?: number;
    quantity?: number;
    fbc?: string | null;
    fbp?: string | null;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false }); }

  const { event, productId, productName, value, quantity, fbc, fbp } = body;
  if (!event) return NextResponse.json({ ok: false });

  const eventId = `${event}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const contents = productId
    ? [{ id: productId, quantity: quantity || 1 }]
    : undefined;

  sendMetaEvent({
    eventName: event,
    eventId,
    fbc: fbc || null,
    fbp: fbp || null,
    value,
    currency: "BRL",
    contents,
    clientIp,
    clientUserAgent,
  }).catch((e) => console.error(`[Meta CAPI] ${event} error:`, e));

  return NextResponse.json({ ok: true });
}
