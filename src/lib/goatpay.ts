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
  payment_status?: string;
  pix?: {
    pix_qr_code?: string;
    pix_url?: string;
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

async function tryCreatePixWithProduct(
  productHash: string,
  offerHash: string,
  amountCents: number,
  params: {
    orderNumber: string; name: string; email: string; cpf: string; phone: string; itemName: string;
    address: { street: string; number: string; complement: string; district: string; city: string; state: string; zipCode: string };
  }
): Promise<GoatpayPixData | null> {
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
      product_hash: productHash,
    }],
    tracking: { src: params.orderNumber },
  };

  const res = await fetch(`${BASE_URL}/transactions?api_token=${token()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.warn(`[Goatpay] Produto ${productHash} falhou (${res.status}): ${errBody}`);
    return null;
  }

  const json = await res.json() as { data?: GoatpayPixData; transaction?: GoatpayPixData } & GoatpayPixData;
  const data = json.data || json.transaction || json;

  // Make sure PIX QR code was actually generated (some adquirentes accept but return null QR)
  const hasQr = data?.pix?.pix_qr_code || data?.pix?.qr_code || data?.pix?.pix_url || data?.pix?.qr_code_url;
  if (!hasQr) {
    console.warn(`[Goatpay] Produto ${productHash}: transação criada mas sem QR code — adquirente recusou`);
    return null;
  }

  return data;
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

  // GOATPAY_PRODUCT_HASH supports multiple products separated by comma for fallback
  // e.g. "qatodoboiz,g2tbuuxtyh"  → tries Woovi first, Rapdyn as backup
  const productHashes = (process.env.GOATPAY_PRODUCT_HASH || "").split(",").map(h => h.trim()).filter(Boolean);
  const fixedOfferHash = process.env.GOATPAY_OFFER_HASH || "";

  if (productHashes.length === 0 && !fixedOfferHash) {
    throw new Error("Goatpay: configure GOATPAY_PRODUCT_HASH (ou GOATPAY_OFFER_HASH) nas variáveis de ambiente");
  }

  // If a fixed offer hash is provided, use it directly with the first product
  if (fixedOfferHash) {
    const productHash = productHashes[0] || "";
    const result = await tryCreatePixWithProduct(productHash, fixedOfferHash, amountCents, params);
    if (result) return result;
    throw new Error("Goatpay: adquirente recusou o PIX");
  }

  // Otherwise try each product (creates a dynamic offer per product)
  let lastError = "";
  for (const productHash of productHashes) {
    try {
      const offerHash = await createDynamicOffer(productHash, amountCents);
      const result = await tryCreatePixWithProduct(productHash, offerHash, amountCents, params);
      if (result) {
        console.log(`[Goatpay] PIX gerado com sucesso via produto ${productHash}`);
        return result;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.warn(`[Goatpay] Produto ${productHash} erro:`, lastError);
    }
  }

  throw new Error(`Goatpay: nenhum adquirente gerou PIX. Último erro: ${lastError}`);
}

export async function goatpayGetTransaction(hash: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/transactions/${hash}?api_token=${token()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const json = await res.json() as { data?: { status?: string; payment_status?: string }; status?: string; payment_status?: string };
  const d = json.data || json;
  const status = (d as { status?: string; payment_status?: string }).payment_status || (d as { status?: string }).status;
  return status ? status.toLowerCase() : null;
}
