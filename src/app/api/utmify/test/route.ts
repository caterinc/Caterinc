import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.UTMIFY_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({ error: "Chave de API não configurada. Salve a chave antes de testar." }, { status: 400 });
  }

  const testPayload = {
    orderId: "TESTE-001",
    status: "waiting_payment",
    createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
    approvedDate: null,
    refundedAt: null,
    customer: {
      name: "Cliente Teste",
      email: "teste@catstore.com.br",
      phone: null,
      document: null,
    },
    products: [
      {
        id: "PROD-TESTE",
        name: "Produto de Teste",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: 29990,
      },
    ],
    trackingParameters: {
      src: null, sck: null,
      utm_source: "test", utm_campaign: "test", utm_medium: null,
      utm_content: null, utm_term: null,
    },
    commission: {
      totalInCents: 29990,
      gatewayFeeInCents: 0,
      userCommissionInCents: 29990,
    },
  };

  try {
    const res = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": apiKey,
      },
      body: JSON.stringify(testPayload),
    });

    const body = await res.text();
    if (res.ok) {
      return NextResponse.json({ success: true, message: "Evento enviado com sucesso!", status: res.status });
    } else {
      return NextResponse.json({ error: `UTMify retornou erro ${res.status}: ${body}` }, { status: 400 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro de rede";
    return NextResponse.json({ error: `Falha na conexão: ${msg}` }, { status: 500 });
  }
}
