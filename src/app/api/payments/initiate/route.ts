import { NextRequest, NextResponse } from "next/server";
import { sendMetaEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { fbc?: string; fbp?: string; value?: number };

    await sendMetaEvent({
      eventName: "InitiateCheckout",
      eventId: `initiate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fbc: body.fbc || null,
      fbp: body.fbp || null,
      value: body.value,
      currency: "BRL",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Meta CAPI] initiate error:", e);
    return NextResponse.json({ ok: false });
  }
}
