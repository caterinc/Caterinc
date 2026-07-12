const BASE_URL = "https://api.slimmpay.com.br";

function authHeader(): string {
  const pub = process.env.SLIMMPAY_PUBLIC_KEY || "";
  const sec = process.env.SLIMMPAY_SECRET_KEY || "";
  return "Basic " + Buffer.from(`${pub}:${sec}`).toString("base64");
}

export function slimmpayConfigured(): boolean {
  return !!(process.env.SLIMMPAY_PUBLIC_KEY && process.env.SLIMMPAY_SECRET_KEY);
}

export interface SlimmpayPixData {
  id: string;
  status: string;
  pix?: Array<{ qr_code: string; url: string; expiration_date: string }>;
}

export async function slimmpayCreatePix(params: {
  amount: number;
  orderNumber: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  itemName: string;
  shippingFee: number;
  address: { street: string; number: string; complement: string; district: string; city: string; state: string; zipCode: string };
}): Promise<SlimmpayPixData> {
  const res = await fetch(`${BASE_URL}/v1/payment-transaction/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify({
      amount: params.amount,
      payment_method: "pix",
      postback_url: "https://loja-caterpillar.com/api/payments/webhook",
      customer: {
        name: params.name,
        email: params.email,
        document: { number: params.cpf.replace(/\D/g, ""), type: "cpf" },
        phone: params.phone.replace(/\D/g, ""),
      },
      pix: { expires_in_days: 1 },
      items: [{ title: params.itemName, unit_price: params.amount, quantity: 1, tangible: true }],
      metadata: JSON.stringify({ order_number: params.orderNumber }),
      shipping: {
        fee: params.shippingFee,
        address: {
          street: params.address.street,
          street_number: params.address.number,
          complement: params.address.complement || "",
          zip_code: params.address.zipCode.replace(/\D/g, ""),
          neighborhood: params.address.district,
          city: params.address.city,
          state: params.address.state,
          country: "BR",
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Slimmpay ${res.status}: ${err}`);
  }

  const json = await res.json() as { data: SlimmpayPixData[] };
  if (!json.data?.[0]) throw new Error("Resposta inválida da Slimmpay");
  return json.data[0];
}

export async function slimmpayGetTransaction(id: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/v1/payment-transaction/${id}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) return null;

  const json = await res.json() as
    | { data: Array<{ Status?: string; status?: string }> }
    | { Status?: string; status?: string };

  if ("data" in json && Array.isArray(json.data) && json.data[0]) {
    const t = json.data[0];
    return (t.Status || t.status || "PENDING").toUpperCase();
  }
  if ("Status" in json || "status" in json) {
    const s = (json as { Status?: string; status?: string });
    return (s.Status || s.status || "PENDING").toUpperCase();
  }
  return null;
}
