import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  // InitiateCheckout é disparado pelo pixel browser-side no checkout page.
  // Server-side CAPI sem dados do cliente gera erro 400 no Meta por parametros insuficientes.
  return NextResponse.json({ ok: true });
}
