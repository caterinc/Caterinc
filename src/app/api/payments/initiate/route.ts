import { NextRequest, NextResponse } from "next/server";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || null;
  const clientUserAgent = req.headers.get("user-agent") || null;

  let body: { fbc?: string | null; fbp?: string | null; value?: number } = {};
  try { body = await req.json(); } catch {}

  sendMetaEvent({
    eventName: "InitiateCheckout",
    eventId: `initiate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fbc: body.fbc || null,
    fbp: body.fbp || null,
    value: body.value,
    currency: "BRL",
    clientIp,
    clientUserAgent,
  }).catch((e) => console.error("[Meta CAPI] initiate error:", e));

  return NextResponse.json({ ok: true });
}
