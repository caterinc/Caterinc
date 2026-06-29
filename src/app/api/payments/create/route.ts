import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString, sanitizeEmail, sanitizeInt, verifyOrigin } from "@/lib/sanitize";
import { sendUtmifyEvent } from "@/lib/utmify";

export const dynamic = "force-dynamic";

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
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Payload invalido" }, { status: 400 }); }

  const { personal, address, paymentMethod, cartItems, cardFormData, consent, shippingMethodId, utmData } = body;

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

  const orderCount = await prisma.order.count();
  const orderNumber = `CAT-${1001 + orderCount}`;
  const order = await prisma.order.create({
    data: {
      orderNumber, email, status: "PENDING", paymentStatus: "PENDING", paymentMethod: method,
      subtotal, shipping: shippingCost, total, shippingAddress,
      utmData: utmData || undefined,
      items: { create: orderItems },
      statusHistory: { create: [{ status: "PENDING", note: "Pedido iniciado via " + method }] },
    },
  });

  // Notify UTMify with UTM attribution data
  await sendUtmifyEvent(
    orderNumber,
    "waiting_payment",
    { name, email, phone },
    orderItems.map((i) => ({ id: i.productId || "item", name: i.name, quantity: i.quantity, priceInCents: Math.round(Number(i.price) * 100) })),
    Math.round(total * 100),
    new Date(),
    utmData || null
  ).catch((e) => console.error("[UTMify] create event error:", e));

  const parts = name.split(" ");
  const firstName = parts[0];
  const lastName  = parts.slice(1).join(" ") || parts[0];

  const cancelOrder = async (note: string) => {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED", paymentStatus: "FAILED",
        statusHistory: { create: [{ status: "CANCELLED", note }] },
      },
    });
  };

  try {
    const mpClient = await getMpClient();

    if (method === "pix") {
      const result = await createPixPayment(
        mpClient, total, { email, firstName, lastName, cpf },
        "Pedido #" + orderNumber, order.id
      );
      const mpPaymentId = String(result.id);

      await prisma.$transaction(async (tx) => {
        for (const item of orderItems) {
          if (item.variantId)
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
        }
        await tx.order.update({ where: { id: order.id }, data: { mpPaymentId } });
      });

      const poi = (result as unknown as Record<string, unknown>)?.point_of_interaction as Record<string, unknown> | undefined;
      const td  = poi?.transaction_data as Record<string, unknown> | undefined;

      return NextResponse.json({
        orderId: order.id, orderNumber, total,
        qrCode:       sanitizeString(String(td?.qr_code || ""), 5000),
        qrCodeBase64: sanitizeString(String(td?.qr_code_base64 || ""), 100000),
      });
    }

    if (method === "card") {
      if (!cardFormData?.token) {
        await cancelOrder("Token do cartao ausente");
        return NextResponse.json({ error: "Token do cartao ausente" }, { status: 400 });
      }
      const result = await createCardPayment(mpClient, total, cardFormData, "Pedido #" + orderNumber, order.id);
      const res2         = result as unknown as Record<string, unknown>;
      const mpPaymentId  = String(result.id);
      const status       = String(res2.status || "pending");
      const statusDetail = String(res2.status_detail || "");

      if (status === "approved") {
        await prisma.$transaction(async (tx) => {
          for (const item of orderItems) {
            if (item.variantId)
              await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
          }
          await tx.order.update({
            where: { id: order.id },
            data: {
              mpPaymentId, paymentStatus: "PAID", status: "CONFIRMED",
              statusHistory: { create: [{ status: "CONFIRMED", note: "Cartao aprovado pelo Mercado Pago" }] },
            },
          });
        });
      } else {
        await prisma.order.update({ where: { id: order.id }, data: { mpPaymentId } });
      }

      return NextResponse.json({ orderId: order.id, orderNumber, total, status, statusDetail });
    }

  } catch (mpErr: unknown) {
    console.error("[Payments/Create] MP error:", mpErr);
    const obj = mpErr as Record<string, unknown>;
    const msg = typeof obj?.message === "string" ? obj.message : "Erro desconhecido";

    await cancelOrder("Falha MP: " + msg);

    if (msg === "MP_NOT_CONFIGURED")
      return NextResponse.json({ error: "Pagamento nao configurado. Configure as credenciais do Mercado Pago no painel admin." }, { status: 503 });

    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("live credentials"))
      return NextResponse.json({ error: "Credenciais de TESTE ativas. Use o e-mail do usuario de teste do MP no checkout." }, { status: 401 });

    return NextResponse.json({ error: "Erro no pagamento: " + msg }, { status: 502 });
  }

  return NextResponse.json({ error: "Metodo invalido" }, { status: 400 });
}
