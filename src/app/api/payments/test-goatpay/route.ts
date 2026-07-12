import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.GOATPAY_API_TOKEN || "";
  const offerHash = process.env.GOATPAY_OFFER_HASH || "";
  const productHash = process.env.GOATPAY_PRODUCT_HASH || "";

  const envStatus = {
    hasToken: !!token,
    tokenLen: token.length,
    offerHash,
    productHash,
  };

  if (!token) return NextResponse.json({ envStatus, error: "sem token" });

  // Step 1: test create offer
  let offerResult: unknown = null;
  let offerError: string | null = null;
  try {
    const r = await fetch(`https://api.goatpayments.com.br/api/public/v1/products/${productHash}/offers?api_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ title: "Teste", price: 15990 }),
    });
    const body = await r.json();
    offerResult = { status: r.status, body };
  } catch (e) {
    offerError = String(e);
  }

  // Step 2: test create transaction with fixed offer
  let txResult: unknown = null;
  let txError: string | null = null;
  try {
    const r = await fetch(`https://api.goatpayments.com.br/api/public/v1/transactions?api_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        amount: 15990,
        payment_method: "pix",
        offer_hash: offerHash,
        expire_in_days: 1,
        transaction_origin: "api",
        postback_url: "https://loja-caterpillar.com/api/payments/webhook",
        customer: {
          name: "Teste",
          email: "teste@teste.com",
          phone_number: "11999999999",
          document: "52998224725",
          street_name: "Rua Teste",
          number: "1",
          complement: "",
          neighborhood: "Centro",
          city: "Sao Paulo",
          state: "SP",
          zip_code: "01001000",
        },
        cart: [{ title: "Teste", price: 15990, quantity: 1, operation_type: 1, tangible: true, cover: null, product_hash: productHash }],
        tracking: { src: "DIAG-001" },
      }),
    });
    const body = await r.json();
    txResult = { status: r.status, body };
  } catch (e) {
    txError = String(e);
  }

  return NextResponse.json({ envStatus, offerResult, offerError, txResult, txError });
}
