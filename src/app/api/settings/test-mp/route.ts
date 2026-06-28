import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = (await req.json()) as { token?: string };
  if (!token?.trim()) {
    return NextResponse.json({ ok: false, error: "Token vazio" });
  }

  try {
    const r = await fetch("https://api.mercadopago.com/v1/payment_methods", {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });

    if (r.ok) {
      // Get account info to show name
      const userRes = await fetch("https://api.mercadopago.com/v1/account", {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      const userData = userRes.ok ? (await userRes.json()) as { email?: string; site_id?: string } : null;
      return NextResponse.json({ ok: true, email: userData?.email, site: userData?.site_id });
    }

    const errData = (await r.json()) as { message?: string; error?: string };
    return NextResponse.json({ ok: false, error: errData.message || errData.error || `HTTP ${r.status}` });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Erro de rede" });
  }
}
