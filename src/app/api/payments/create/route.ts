import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString, sanitizeEmail, sanitizeInt, verifyOrigin } from "@/lib/sanitize";
import { sendUtmifyEvent } from "@/lib/utmify";
import { sendMetaEvent } from "@/lib/meta-capi";

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

async function getMpClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_NOT_CONFIGURED");
  const { default: MercadoPago } = await import("mercadopago");
  return new MercadoPago({ accessToken: token });
}

async function createPixPayment(
  client: Awaited<ReturnType<typeof getMpClient>>, amount: number,
  payer: { email: string; firstName: string; lastName: string; cpf: string },
  description: string, externalRef: string
) {
  const { Payment } = await import("mercadopago");
  return new Payment(client).create({
    body: {
      transaction_amount: amount, payment_method_id: "pix",
      payer: {
        email: payer.email, first_name: payer.firstName, last_name: payer.lastName,
        identification: { type: "CPF", number: payer.cpf.replace(/\D/g, "") },
      },
      description, external_reference: externalRef,
      notification_url: "https://loja-caterpillar.com/api/payments/webhook",
    },
  });
}

async function createCardPayment(
  client: Awaited<ReturnType<typeof getMpClient>>, amount: number,
  cardFormData: Record<string, unknown>, description: string, externalRef: string
) {
  const { Payment } = await import("mercadopago");
  return new Payment(client).create({
    body: {
      transaction_amount: amount,
      token: cardFormData.token as string,
      installments: Number(cardFormData.installments) || 1,
      payment_method_id: cardFormData.payment_method_id as string,
      issuer_id: cardFormData.issuer_id ? Number(cardFormData.issuer_id) : undefined,
      payer: cardFormData.payer as { email: string; identification: { type: string; number: string } },
      description, external_reference: externalRef,
      notification_url: "https://loja-caterpillar.com/api/payments/webhook",
    },
  });
}

export async function POST(req: NextRequest) {
  if (!verifyOrigin(req)) return NextResponse.json({ error: "Origem invalida" }, { status: 403 });

  let body: {
    personal?: PersonalInput; address?: AddressInput; paymentMethod?: string;
    cartItems?: CartItemInput[]; cardFormData?: Record<string, unknown>;
    consent?: boolean; shippingMethodId?: string | null;
    utmData?: Record<string, string> | null;
    fbc?: string | null; fbp?: string | null;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Payload invalido" }, { status: 400 }); }

  const { personal, address, paymentMethod, cartItems, cardFormData, consent, shippingMethodId, utmData, fbc, fbp } = body;

  if (!consent) return NextResponse.json({ error: "Consentimento LGPD obrigatorio" }, { status: 400 });
  if (!personal || !address || !cartItems || cartItems.length === 0)
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });

  const name  = sanitizeString(personal.name, 200);
  const email = sanitizeEmail(personal.email);
  const phone = sanitizeString(personal.phone, 20);
  const cpf   = (personal.cpf || "").replace(/\D/g, "").slice(0, 11);
  if (!name || !email || !phone) return NextResponse.json({ error: "Dados pessoais invalidos" }, { status: 400 });

  const method = paymentMethod === "pix" || paymentMethod === "card" ? paymentMethod : "pix";

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
  const firstName = parts[0];
  const lastName  = parts.slice(1).join(" ") || parts[0];
  const nameParts = parts;

  // ── Translate Mercado Pago errors to friendly Portuguese ─────────────────────
  function translateMpError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes("identification number") || m.includes("cpf") || m.includes("document"))
      return "CPF inválido. Confira se você digitou todos os 11 números corretamente.";
    if (m.includes("email"))
      return "E-mail inválido. Confira se o endereço de e-mail está correto.";
    if (m.includes("phone") || m.includes("telefone"))
      return "Telefone inválido. Confira o número informado.";
    if (m.includes("unauthorized") || m.includes("live credentials") || m.includes("test"))
      return "Erro de configuração do pagamento. Entre em contato com a loja.";
    if (m.includes("insufficient") || m.includes("amount") || m.includes("minimum"))
      return "Valor inválido para pagamento. Tente novamente.";
    if (m.includes("blocked") || m.includes("rejected") || m.includes("denied"))
      return "Pagamento recusado. Verifique seus dados ou tente outro método.";
    if (m.includes("expired") || m.includes("token"))
      return "Dados do cartão expirados. Tente novamente.";
    return "Não foi possível processar o pagamento. Verifique seus dados e tente novamente.";
  }

  // ── Step 1: attempt payment with Mercado Pago BEFORE creating any order ──────
  let mpClient: Awaited<ReturnType<typeof getMpClient>>;
  try { mpClient = await getMpClient(); }
  catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    if (msg === "MP_NOT_CONFIGURED")
      return NextResponse.json({ error: "Pagamento nao configurado. Configure as credenciais do Mercado Pago no painel admin." }, { status: 503 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Temporary external reference before order exists — replaced after order creation
  const tempRef = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (method === "pix") {
    let pixResult: Awaited<ReturnType<typeof createPixPayment>>;
    try {
      pixResult = await createPixPayment(
        mpClient, total, { email, firstName, lastName, cpf },
        `Pedido Caterpillar`, tempRef
      );
    } catch (mpErr: unknown) {
      const obj = mpErr as Record<string, unknown>;
      const msg = typeof obj?.message === "string" ? obj.message : "Erro desconhecido";
      if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("live credentials"))
        return NextResponse.json({ error: "Credenciais de TESTE ativas. Use o e-mail do usuario de teste do MP no checkout." }, { status: 401 });
      return NextResponse.json({ error: translateMpError(msg) }, { status: 502 });
    }

    // Payment accepted by MP — now create the order
    const mpPaymentId = String(pixResult.id);
    const orderNumber = `CAT-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const trackingCode = generateTrackingCode();

    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber, email, status: "PENDING", paymentStatus: "PENDING",
          paymentMethod: "pix", mpPaymentId, trackingCode,
          subtotal, shipping: shippingCost, total, shippingAddress,
          utmData: { ...(utmData || {}), ...(fbc ? { fbc } : {}), ...(fbp ? { fbp } : {}) },
          items: { create: orderItems },
          statusHistory: { create: [{ status: "PENDING", note: "PIX gerado via Mercado Pago" }] },
        },
      });
      for (const item of orderItems) {
        if (item.variantId)
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
      }
      return o;
    });

    // Notifications after order is committed
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

    const poi = (pixResult as unknown as Record<string, unknown>)?.point_of_interaction as Record<string, unknown> | undefined;
    const td  = poi?.transaction_data as Record<string, unknown> | undefined;

    return NextResponse.json({
      orderId: order.id, orderNumber, total,
      qrCode:       sanitizeString(String(td?.qr_code || ""), 5000),
      qrCodeBase64: sanitizeString(String(td?.qr_code_base64 || ""), 100000),
    });
  }

  if (method === "card") {
    if (!cardFormData?.token)
      return NextResponse.json({ error: "Token do cartao ausente" }, { status: 400 });

    let cardResult: Awaited<ReturnType<typeof createCardPayment>>;
    try {
      cardResult = await createCardPayment(mpClient, total, cardFormData, `Pedido Caterpillar`, tempRef);
    } catch (mpErr: unknown) {
      const obj = mpErr as Record<string, unknown>;
      const msg = typeof obj?.message === "string" ? obj.message : "Erro desconhecido";
      if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("live credentials"))
        return NextResponse.json({ error: "Credenciais de TESTE ativas." }, { status: 401 });
      return NextResponse.json({ error: translateMpError(msg) }, { status: 502 });
    }

    const res2         = cardResult as unknown as Record<string, unknown>;
    const mpPaymentId  = String(cardResult.id);
    const status       = String(res2.status || "pending");
    const statusDetail = String(res2.status_detail || "");

    // Only create order if approved or in-process (not rejected)
    if (status === "rejected")
      return NextResponse.json({ error: "Cartao recusado: " + statusDetail, status, statusDetail }, { status: 402 });

    const orderNumber = `CAT-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const trackingCode = generateTrackingCode();
    const isApproved  = status === "approved";

    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber, email,
          status: isApproved ? "CONFIRMED" : "PENDING",
          paymentStatus: isApproved ? "PAID" : "PENDING",
          paymentMethod: "card", mpPaymentId, trackingCode,
          subtotal, shipping: shippingCost, total, shippingAddress,
          utmData: utmData || undefined,
          items: { create: orderItems },
          statusHistory: { create: [{ status: isApproved ? "CONFIRMED" : "PENDING", note: isApproved ? "Cartao aprovado pelo Mercado Pago" : "Cartao em processamento" }] },
        },
      });
      if (isApproved) {
        for (const item of orderItems) {
          if (item.variantId)
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
        }
      }
      return o;
    });

    if (isApproved) {
      sendMetaEvent({
        eventName: "Purchase", eventId: `${orderNumber}-purchase`,
        email, phone, firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
        value: total, currency: "BRL",
        contents: orderItems.map((i) => ({ id: i.productId || "item", quantity: i.quantity })),
        orderId: orderNumber, fbc: fbc || null, fbp: fbp || null,
      }).catch((e) => console.error("[Meta CAPI] card purchase error:", e));

      sendUtmifyEvent(
        orderNumber, "paid", { name, email, phone },
        orderItems.map((i) => ({ id: i.productId || "item", name: i.name.replace(/caterpillar\s*/gi, "").trim(), quantity: i.quantity, priceInCents: Math.round(Number(i.price) * 100) })),
        Math.round(total * 100), new Date(), utmData || null, "card"
      ).catch((e) => console.error("[UTMify] card paid error:", e));
    }

    return NextResponse.json({ orderId: order.id, orderNumber, total, status, statusDetail });
  }

  return NextResponse.json({ error: "Metodo invalido" }, { status: 400 });
}
