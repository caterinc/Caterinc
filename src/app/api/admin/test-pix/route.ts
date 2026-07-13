import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import QRCode from "qrcode";
import { goatpayConfigured, goatpayCreatePix } from "@/lib/goatpay";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!goatpayConfigured()) {
    return NextResponse.json({ error: "GoatPay não configurado" }, { status: 503 });
  }

  try {
    const pixData = await goatpayCreatePix({
      amount: 5.50,
      orderNumber: `TESTE-${Date.now()}`,
      name: "Admin Teste",
      email: "admin@teste.com",
      cpf: "52998224725",
      phone: "11999999999",
      itemName: "Teste Adquirente PIX",
      shippingFee: 0,
      address: {
        street: "Av Paulista",
        number: "1000",
        complement: "",
        district: "Bela Vista",
        city: "Sao Paulo",
        state: "SP",
        zipCode: "01310100",
      },
    });

    const pixCode = pixData.pix?.pix_qr_code || pixData.pix?.qr_code || pixData.pix?.pix_url || pixData.pix?.qr_code_url || "";
    if (!pixCode) {
      return NextResponse.json({ error: "Adquirente não retornou QR Code" }, { status: 502 });
    }

    let qrCodeBase64 = "";
    try {
      const dataUrl = await QRCode.toDataURL(pixCode, { width: 280, margin: 1 });
      qrCodeBase64 = dataUrl.replace("data:image/png;base64,", "");
    } catch { /* ignore */ }

    return NextResponse.json({
      qrCode: pixCode,
      qrCodeBase64,
      merchantName: pixData.merchantName || "",
      amount: 5.50,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
