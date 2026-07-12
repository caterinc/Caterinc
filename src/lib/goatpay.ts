const BASE_URL = "https://api.goatpayments.com.br/api/public/v1";

function token(): string {
  return process.env.GOATPAY_API_TOKEN || "";
}

export function goatpayConfigured(): boolean {
  return !!process.env.GOATPAY_API_TOKEN;
}

export interface GoatpayPixData {
  hash: string;
  status: string;
  pix?: {
    qr_code?: string;
    qr_code_url?: string;
    expiration_date?: string;
  };
}

// Creates a dynamic offer on a product with the exact price needed
async function createDynamicOffer(productHash: string, amountCents: number): Promise<string> {
  const res = await fetch(`${BASE_URL}/products/${productHash}/offers?api_token=${token()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title: "Pedido", price: amountCents }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Goatpay offer create ${res.status}: ${err}`);
  }
  const json = await res.json() as { hash?: string };
  if (!json.hash) throw new Error("Goatpay offer create: sem hash na resposta");
  return json.hash;
}

export async function goatpayCreatePix(params: {
  amount: number;
  orderNumber: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  itemName: string;
  shippingFee: number;
  address: { street: string; number: string; complement: string; district: string; city: string; state: string; zipCode: string };
}): Promise<GoatpayPixData> {
  const amountCents = Math.round(params.amount * 100);

  // Resolve offer_hash: use env if set, otherwise create a dynamic offer on the product
  let offerHash = process.env.GOATPAY_OFFER_HASH || "";
  const productHash = process.env.GOATPAY_PRODUCT_HASH || "";

  if (!offerHash && productHash) {
    offerHash = await createDynamicOffer(productHash, amountCents);
  }

  if (!offerHash) {
    throw new Error("Goatpay: configure GOATPAY_OFFER_HASH ou GOATPAY_PRODUCT_HASH nas variáveis de ambiente");
  }

  const body: Record<string, unknown> = {
    amount: amountCents,
    payment_method: "pix",
    offer_hash: offerHash,
    expire_in_days: 1,
    transaction_origin: "api",
    postback_url: "https://loja-caterpillar.com/api/payments/webhook",
    customer: {
      name: params.name,
      email: params.email,
      phone_number: params.phone.replace(/\D/g, ""),
      document: params.cpf.replace(/\D/g, ""),
      street_name: params.address.street,
      number: params.address.number,
      complement: params.address.complement || "",
      neighborhood: params.address.district,
      city: params.address.city,
      state: params.address.state,
      zip_code: params.address.zipCode.replace(/\D/g, ""),
    },
    cart: [{
      title: params.itemName,
      price: amountCents,
      quantity: 1,
      operation_type: 1,
      tangible: true,
      cover: null,
      product_hash: productHash || undefined,
    }],
    tracking: { src: params.orderNumber },
  };

  const res = await fetch(`${BASE_URL}/transactions?api_token=${token()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Goatpay ${res.status}: ${err}`);
  }

  const json = await res.json() as { data?: GoatpayPixData; transaction?: GoatpayPixData } & GoatpayPixData;
  return json.data || json.transaction || json;
}

export async function goatpayGetTransaction(hash: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/transactions/${hash}?api_token=${token()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const json = await res.json() as { data?: { status?: string }; status?: string };
  const status = json.data?.status || json.status;
  return status ? status.toLowerCase() : null;
}
