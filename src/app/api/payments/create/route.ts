import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { sanitizeString, sanitizeEmail, sanitizeInt, verifyOrigin } from "@/lib/sanitize";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";
import { vezionConfigured, vezionCreatePix } from "@/lib/vezion";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  if (!vezionConfigured())
    return NextResponse.json({ error: "Pagamento nao configurado." }, { status: 503 });

  const productIds = [...new Set(cartItems.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true }, include: { variants: true },
  });

  const orderItems: {
    productId: string; variantId: string | null; name: string; price: number;
    quantity: number; size: string; color: string; image: string;
  }[] = [];
  for (const item of cartItems) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return NextResponse.json({ error: "Produto não encontrado no carrinho. Recarregue a página e tente novamente." }, { status: 400 });
    const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : null;
    const serverPrice = variant?.price ? Number(variant.price) : Number(product.price);
    orderItems.push({
      productId: product.id, variantId: variant?.id || null,
      name: sanitizeString(product.name, 300), price: serverPrice,
      quantity: sanitizeInt(item.quantity, 1),
      size:  sanitizeString(item.size  || variant?.size  || "", 50),
      color: sanitizeString(item.color || variant?.color || "", 50),
      image: sanitizeString(item.image || product.images[0] || "", 2048),
    });
  }

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

  let shippingCost = subtotal >= 299 ? 0 : 29.9;
  if (shippingMethodId) {
    const sm = await prisma.shippingMethod.findUnique({ where: { id: shippingMethodId, isActive: true } });
    if (sm) shippingCost = (sm.freeAbove !== null && subtotal >= Number(sm.freeAbove)) ? 0 : Number(sm.price);
  }

  // This endpoint only ever creates PIX transactions today, so the PIX
  // discount applies to every order created here. Discount is on the
  // products only, not on shipping (matches what the product page shows).
  const pixDiscountSetting = await prisma.siteSetting.findUnique({ where: { key: "pixDiscountPct" } });
  const pixDiscountPct = pixDiscountSetting ? parseFloat(pixDiscountSetting.value) : 5;
  const discountedSubtotal = Math.round(subtotal * (1 - pixDiscountPct / 100) * 100) / 100;
  const total = Math.round((discountedSubtotal + shippingCost) * 100) / 100;

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

  const nameParts  = name.split(" ");
  const orderNumber  = `CAT-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const trackingCode = generateTrackingCode();
  const itemName     = orderItems.map((i) => i.name.replace(/caterpillar\s*/gi, "").trim()).join(", ").slice(0, 100);

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || null;

  let pixData: Awaited<ReturnType<typeof vezionCreatePix>>;
  try {
    pixData = await vezionCreatePix({
      amount: total, orderNumber, name, email, cpf, phone,
      itemName: itemName || "Pedido",
      ip: clientIp,
      utmData: utmData || null, fbc: fbc || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[Vezion] PIX create error:", msg);
    return NextResponse.json({ error: "Não foi possível gerar o PIX. Tente novamente em instantes." }, { status: 502 });
  }

  let qrCodeBase64 = "";
  try {
    const dataUrl = await QRCode.toDataURL(pixData.pixPayload, { width: 300, margin: 1 });
    qrCodeBase64 = dataUrl.replace("data:image/png;base64,", "");
  } catch (e) {
    console.error("[QRCode] generation error:", e);
  }

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        orderNumber, email, status: "PENDING", paymentStatus: "PENDING",
        paymentMethod: "pix",
        mpPaymentId: pixData.id,
        trackingCode,
        subtotal, shipping: shippingCost, total, shippingAddress,
        utmData: { ...(utmData || {}), ...(fbc ? { fbc } : {}), ...(fbp ? { fbp } : {}) },
        items: { create: orderItems },
        statusHistory: { create: [{ status: "PENDING", note: "PIX gerado via Vezion" }] },
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
    qrCode:       pixData.pixPayload,
    qrCodeBase64: qrCodeBase64,
    merchantName: pixData.merchantName,
  });
}
