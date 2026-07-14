import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import QRCode from "qrcode";
import { vezionConfigured, vezionCreatePix } from "@/lib/vezion";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!vezionConfigured()) {
    return NextResponse.json({ error: "VEZION_API_SECRET não configurado" }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "177.54.146.0";

  try {
    const v = await vezionCreatePix({
      amount: 5.50,
      orderNumber: `TESTE-${Date.now()}`,
      name: "Admin Teste",
      email: "admin@teste.com",
      cpf: "52998224725",
      phone: "11999999999",
      itemName: "Teste Vezion PIX",
      ip,
    });

    let qrCodeBase64 = "";
    try {
      const dataUrl = await QRCode.toDataURL(v.pixPayload, { width: 280, margin: 1 });
      qrCodeBase64 = dataUrl.replace("data:image/png;base64,", "");
    } catch { /* ignore */ }

    return NextResponse.json({
      qrCode: v.pixPayload,
      qrCodeBase64,
      merchantName: v.merchantName,
      amount: 5.50,
      gateway: "Vezion",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
