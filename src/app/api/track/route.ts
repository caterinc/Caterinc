import { NextRequest, NextResponse } from "next/server";
import { sendMetaEvent, type PixelSource } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

// A VSL (forces-one.com) é um site estático separado que também manda
// PageView pra cá (pro mesmo pixel), por isso precisa de acesso cross-origin.
const ALLOWED_ORIGIN = "https://forces-one.com";

function corsHeaders(origin: string | null): HeadersInit {
  return origin === ALLOWED_ORIGIN ? { "Access-Control-Allow-Origin": ALLOWED_ORIGIN } : {};
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders(req.headers.get("origin")),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || null;
  const clientUserAgent = req.headers.get("user-agent") || null;

  let body: {
    event?: string;
    eventId?: string;
    productId?: string;
    productName?: string;
    value?: number;
    quantity?: number;
    fbc?: string | null;
    fbp?: string | null;
    externalId?: string | null;
    pixelSource?: PixelSource | null;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false }, { headers }); }

  const { event, eventId: clientEventId, productId, value, quantity, fbc, fbp, externalId, pixelSource } = body;
  if (!event) return NextResponse.json({ ok: false }, { headers });

  // Se o cliente já mandou um eventID (ex: pra casar com o fbq() do navegador
  // e a Meta deduplicar certinho), usa esse — senão gera um novo, como antes.
  const eventId = clientEventId || `${event}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const contents = productId
    ? [{ id: productId, quantity: quantity || 1 }]
    : undefined;

  sendMetaEvent({
    eventName: event,
    eventId,
    fbc: fbc || null,
    fbp: fbp || null,
    externalId: externalId || null,
    pixelSource: pixelSource || null,
    value,
    currency: "BRL",
    contents,
    clientIp,
    clientUserAgent,
  }).catch((e) => console.error(`[Meta CAPI] ${event} error:`, e));

  return NextResponse.json({ ok: true }, { headers });
}
