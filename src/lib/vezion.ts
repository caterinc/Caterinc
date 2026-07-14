const BASE_URL = "https://api.vezion.com.br";
const WEBHOOK_URL = "https://loja-caterpillar.com/api/payments/webhook";

function apiSecret(): string {
  return process.env.VEZION_API_SECRET || "";
}

export function vezionConfigured(): boolean {
  return !!process.env.VEZION_API_SECRET;
}

function extractPixMerchantName(emv: string): string {
  let i = 0;
  while (i + 4 <= emv.length) {
    const id = emv.slice(i, i + 2);
    const len = parseInt(emv.slice(i + 2, i + 4), 10);
    if (isNaN(len)) break;
    if (id === "59") return emv.slice(i + 4, i + 4 + len).trim();
    i += 4 + len;
  }
  return "";
}

export function isVezionId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export interface VezionPixData {
  id: string;
  status: string;
  pixPayload: string;
  merchantName: string;
}

export async function vezionCreatePix(params: {
  amount: number;
  orderNumber: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  itemName: string;
  ip?: string | null;
  utmData?: Record<string, string> | null;
  fbc?: string | null;
}): Promise<VezionPixData> {
  const customer: Record<string, string | undefined> = {
    name: params.name,
    email: params.email,
    phone: params.phone.replace(/\D/g, ""),
    document_type: "CPF",
    document: params.cpf.replace(/\D/g, ""),
  };

  const utm = params.utmData || {};
  if (utm.utm_source || utm.source)     customer.utm_source   = utm.utm_source || utm.source;
  if (utm.utm_medium || utm.medium)     customer.utm_medium   = utm.utm_medium || utm.medium;
  if (utm.utm_campaign || utm.campaign) customer.utm_campaign = utm.utm_campaign || utm.campaign;
  if (utm.utm_content || utm.content)   customer.utm_content  = utm.utm_content || utm.content;
  if (utm.utm_term || utm.term)         customer.utm_term     = utm.utm_term || utm.term;

  const fbc = params.fbc || utm.fbc;
  if (fbc) {
    customer.click_id   = fbc;
    customer.click_type = "fbclid";
  }

  const body: Record<string, unknown> = {
    external_id:    params.orderNumber,
    total_amount:   params.amount,
    payment_method: "PIX",
    webhook_url:    WEBHOOK_URL,
    items: [{
      id:          params.orderNumber,
      title:       params.itemName,
      description: params.itemName,
      price:       params.amount,
      quantity:    1,
      is_physical: true,
    }],
    customer,
  };

  if (params.ip) body.ip = params.ip;

  const res = await fetch(`${BASE_URL}/v1/transactions`, {
    method: "POST",
    headers: { "api-secret": apiSecret(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vezion ${res.status}: ${err}`);
  }

  const json = await res.json() as {
    id: string; status: string;
    pix?: { payload?: string };
    hasError?: boolean;
  };

  if (json.hasError) throw new Error("Vezion: hasError=true na resposta");

  const pixPayload = json.pix?.payload || "";
  if (!pixPayload) throw new Error("Vezion: sem pix.payload na resposta");

  return { id: json.id, status: json.status, pixPayload, merchantName: extractPixMerchantName(pixPayload) };
}

export async function vezionGetTransaction(id: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/v1/transactions/${id}`, {
    headers: { "api-secret": apiSecret() },
  });
  if (!res.ok) return null;
  const json = await res.json() as { status?: string };
  return json.status ? json.status.toUpperCase() : null;
}
