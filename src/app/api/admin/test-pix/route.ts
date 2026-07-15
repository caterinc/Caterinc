import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const orderNumber = `TESTE-${Date.now()}`;

  try {
    const v = await vezionCreatePix({
      amount: 5.50,
      orderNumber,
      name: "Admin Teste",
      email: "admin@teste.com",
      cpf: "52998224725",
      phone: "11999999999",
      itemName: "Teste Vezion PIX",
      ip,
    });

    // Create a real order in the DB so the webhook can find and confirm it
    await prisma.order.create({
      data: {
        orderNumber,
        email: "admin@teste.com",
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "pix",
        mpPaymentId: v.id,
        subtotal: 5.50,
        shipping: 0,
        total: 5.50,
        shippingAddress: {
          name: "Admin Teste",
          phone: "11999999999",
          street: "Rua Teste",
          number: "1",
          complement: "",
          district: "Centro",
          city: "São Paulo",
          state: "SP",
          zipCode: "01001000",
        },
        items: {
          create: [{
            name: "Teste Adquirente PIX",
            image: "",
            size: "-",
            color: "-",
            quantity: 1,
            price: 5.50,
          }],
        },
        statusHistory: {
          create: [{ status: "PENDING", note: "PIX de teste gerado pelo admin" }],
        },
      },
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
      orderNumber,
      amount: 5.50,
      gateway: "Vezion",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
