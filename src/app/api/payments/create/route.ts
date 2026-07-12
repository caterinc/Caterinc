import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { sanitizeString, sanitizeEmail, sanitizeInt, verifyOrigin } from "@/lib/sanitize";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";
import { goatpayConfigured, goatpayCreatePix } from "@/lib/goatpay";

export const dynamic = "force-dynamic";

function generateTrackingCode(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let prefix = "";
  let number = "";
  for (let i = 0; i < 2; i++) prefix += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 9; i++) number += digits[Math.floor(Math.random() * digits.length)];
  return `${prefix}${number}BR`;
}

interface CartItemInput {
  productId: string; variantId: string | null; name: string;
  price: number; quantity: number; size: string | null; color: string | null; image: string | null;
}
interface PersonalInput { name: string; email: string; cpf: string; phone: string; }
interface AddressInput {
  zipCode: string; street: string; number: string; complement: string;
  district: string; city: string; state: string;
}

export async function POST(req: NextRequest) {
  if (!verifyOrigin(req)) return NextResponse.json({ error: "Origem invalida" }, { status: 403 });

  let body: {
    personal?: PersonalInput; address?: AddressInput; paymentMethod?: string;
    cartItems?: CartItemInput[]; consent?: boolean; shippingMethodId?: string | null;
    utmData?: Record<string, string> | null;
    fbc?: string | null; fbp?: string | null;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Payload invalido" }, { status: 400 }); }

  const { personal, address, cartItems, consent, shippingMethodId, utmData, fbc, fbp } = body;

  if (!consent) return NextResponse.json({ error: "Consentimento LGPD obrigatorio" }, { status: 400 });
  if (!personal || !address || !cartItems || cartItems.length === 0)
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });

  const name  = sanitizeString(personal.name, 200);
  const email = sanitizeEmail(personal.email);
  const phone = sanitizeString(personal.phone, 20);
  const cpf   = (personal.cpf || "").replace(/\D/g, "").slice(0, 11);
  if (!name || !email || !phone) return NextResponse.json({ error: "Dados pessoais invalidos" }, { status: 400 });
  if (cpf.length !== 11) return NextResponse.json({ error: "CPF inválido. Confira se você digitou todos os 11 números corretamente." }, { status: 400 });

  if (!goatpayConfigured())
    return NextResponse.json({ error: "Pagamento nao configurado. Configure as credenciais no painel admin." }, { status: 503 });

  const productIds = [...new Set(cartItems.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true }, include: { variants: true },
  });

  const orderItems = cartItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error("Produto nao encontrado: " + item.productId);
    const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : null;
    const serverPrice = variant?.price ? Number(variant.price) : Number(product.price);
    return {
      productId: product.id, variantId: variant?.id || null,
      name: sanitizeString(product.name, 300), price: serverPrice,
      quantity: sanitizeInt(item.quantity, 1),
      size:  sanitizeString(item.size  || variant?.size  || "", 50),
      color: sanitizeString(item.color || variant?.color || "", 50),
      image: sanitizeString(item.image || product.images[0] || "", 2048),
    };
  });

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

  let shippingCost = subtotal >= 299 ? 0 : 29.9;
  if (shippingMethodId) {
    const sm = await prisma.shippingMethod.findUnique({ where: { id: shippingMethodId, isActive: true } });
    if (sm) shippingCost = (sm.freeAbove !== null && subtotal >= Number(sm.freeAbove)) ? 0 : Number(sm.price);
  }
  const total = Math.round((subtotal + shippingCost) * 100) / 100;

  const shippingAddress = {
    name, phone,
    street: sanitizeString(address.street, 200), number: sanitizeString(address.number, 20),
    complement: sanitizeString(address.complement || "", 100), district: sanitizeString(address.district, 100),
    city: sanitizeString(address.city, 100), state: sanitizeString(address.state, 2).toUpperCase(),
    zipCode: sanitizeString(address.zipCode, 10),
  };

  for (const item of orderItems) {
    if (item.variantId) {
      const v = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
      if (!v || v.stock < item.quantity)
        return NextResponse.json({ error: "Estoque insuficiente para " + item.name }, { status: 409 });
    }
  }

  const parts     = name.split(" ");
  const nameParts = parts;

  const orderNumber  = `CAT-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const trackingCode = generateTrackingCode();
  const itemName     = orderItems.map((i) => i.name.replace(/caterpillar\s*/gi, "").trim()).join(", ").slice(0, 100);

  let pixData: Awaited<ReturnType<typeof goatpayCreatePix>>;
  try {
    pixData = await goatpayCreatePix({
      amount: total,
      orderNumber,
      name, email, cpf, phone,
      itemName: itemName || "Pedido Caterpillar",
      shippingFee: shippingCost,
      address: {
        street:     shippingAddress.street,
        number:     shippingAddress.number,
        complement: shippingAddress.complement,
        district:   shippingAddress.district,
        city:       shippingAddress.city,
        state:      shippingAddress.state,
        zipCode:    shippingAddress.zipCode,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[Goatpay] PIX create error:", msg);
    return NextResponse.json({ error: "Não foi possível gerar o PIX. Tente novamente em instantes." }, { status: 502 });
  }

  const goatpayHash = pixData.hash;
  const pixCode     = pixData.pix?.qr_code || pixData.pix?.qr_code_url || "";

  if (!pixCode) {
    console.error("[Goatpay] Resposta sem qr_code:", JSON.stringify(pixData));
    return NextResponse.json({ error: "Erro ao gerar QR Code PIX. Tente novamente." }, { status: 502 });
  }

  let qrCodeBase64 = "";
  try {
    const dataUrl = await QRCode.toDataURL(pixCode, { width: 300, margin: 1 });
    qrCodeBase64 = dataUrl.replace("data:image/png;base64,", "");
  } catch (e) {
    console.error("[QRCode] generation error:", e);
  }

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        orderNumber, email, status: "PENDING", paymentStatus: "PENDING",
        paymentMethod: "pix",
        mpPaymentId: goatpayHash,
        trackingCode,
        subtotal, shipping: shippingCost, total, shippingAddress,
        utmData: { ...(utmData || {}), ...(fbc ? { fbc } : {}), ...(fbp ? { fbp } : {}) },
        items: { create: orderItems },
        statusHistory: { create: [{ status: "PENDING", note: "PIX gerado via Goatpay" }] },
      },
    });
    for (const item of orderItems) {
      if (item.variantId)
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
    }
    return o;
  });

  sendUtmifyEvent(
    orderNumber, "waiting_payment", { name, email, phone },
    orderItems.map((i) => ({ id: i.productId || "item", name: i.name.replace(/caterpillar\s*/gi, "").trim(), quantity: i.quantity, priceInCents: Math.round(Number(i.price) * 100) })),
    Math.round(total * 100), new Date(), utmData || null, "pix"
  ).catch((e) => console.error("[UTMify] pix event error:", e));

  sendMetaEvent({
    eventName: "AddPaymentInfo", eventId: `${orderNumber}-pending`,
    email, phone, firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
    value: total, currency: "BRL",
    contents: orderItems.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
    orderId: orderNumber, fbc: fbc || null, fbp: fbp || null,
  }).catch((e) => console.error("[Meta CAPI] pix pending error:", e));

  return NextResponse.json({
    orderId: order.id, orderNumber, total,
    qrCode:       pixCode,
    qrCodeBase64: qrCodeBase64,
  });
}
