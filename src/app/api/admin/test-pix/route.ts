import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import QRCode from "qrcode";
import { vezionConfigured, vezionCreatePix } from "@/lib/vezion";
import { goatpayConfigured, goatpayCreatePix } from "@/lib/goatpay";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!vezionConfigured() && !goatpayConfigured()) {
    return NextResponse.json({ error: "Nenhum gateway configurado" }, { status: 503 });
  }

  try {
    let pixCode      = "";
    let merchantName = "";
    let gateway      = "";

    if (vezionConfigured()) {
      const v = await vezionCreatePix({
        amount: 5.50,
        orderNumber: `TESTE-${Date.now()}`,
        name: "Admin Teste",
        email: "admin@teste.com",
        cpf: "52998224725",
        phone: "11999999999",
        itemName: "Teste Vezion PIX",
      });
      pixCode      = v.pixPayload;
      merchantName = v.merchantName;
      gateway      = "Vezion";
    } else {
      const g = await goatpayCreatePix({
        amount: 5.50,
        orderNumber: `TESTE-${Date.now()}`,
        name: "Admin Teste",
        email: "admin@teste.com",
        cpf: "52998224725",
        phone: "11999999999",
        itemName: "Teste GoatPay PIX",
        shippingFee: 0,
        address: { street: "Av Paulista", number: "1000", complement: "", district: "Bela Vista", city: "Sao Paulo", state: "SP", zipCode: "01310100" },
      });
      pixCode      = g.pix?.pix_qr_code || g.pix?.qr_code || g.pix?.pix_url || g.pix?.qr_code_url || "";
      merchantName = g.merchantName || "";
      gateway      = "GoatPay";
    }

    if (!pixCode) return NextResponse.json({ error: "Gateway não retornou QR Code" }, { status: 502 });

    let qrCodeBase64 = "";
    try {
      const dataUrl = await QRCode.toDataURL(pixCode, { width: 280, margin: 1 });
      qrCodeBase64 = dataUrl.replace("data:image/png;base64,", "");
    } catch { /* ignore */ }

    return NextResponse.json({ qrCode: pixCode, qrCodeBase64, merchantName, amount: 5.50, gateway });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
