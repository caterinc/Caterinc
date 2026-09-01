const BASE_URL = "https://app.xequepag.com/api/v1";
const WEBHOOK_URL = "https://loja-caterpillar.com/api/payments/webhook";

function apiKey(): string {
  return process.env.XEQUE_SECRET_KEY || "";
}

export function xequeConfigured(): boolean {
  return !!process.env.XEQUE_SECRET_KEY;
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

export interface XequePixData {
  id: string;
  status: string;
  pixPayload: string;
  merchantName: string;
}

export async function xequeCreatePix(params: {
  amount: number; // em reais (ex: 123.45) — convertido pra centavos abaixo
  orderNumber: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  itemName: string;
  utmData?: Record<string, string> | null;
}): Promise<XequePixData> {
  const utm = params.utmData || {};
  const tracking: Record<string, string> = {};
  if (utm.utm_source || utm.source) tracking.utm_source = utm.utm_source || utm.source;
  if (utm.utm_medium || utm.medium) tracking.utm_medium = utm.utm_medium || utm.medium;
  if (utm.utm_campaign || utm.campaign) tracking.utm_campaign = utm.utm_campaign || utm.campaign;
  if (utm.utm_content || utm.content) tracking.utm_content = utm.utm_content || utm.content;
  if (utm.utm_term || utm.term) tracking.utm_term = utm.utm_term || utm.term;

  const body: Record<string, unknown> = {
    amount: Math.round(params.amount * 100), // Xeque espera centavos, não reais
    description: params.itemName,
    reference: params.orderNumber,
    source: "api_externa",
    postback_url: WEBHOOK_URL,
    customer: {
      name: params.name,
      email: params.email,
      document: params.cpf.replace(/\D/g, ""),
      phone: params.phone.replace(/\D/g, ""),
    },
  };
  if (Object.keys(tracking).length > 0) body.tracking = tracking;

  const res = await fetch(`${BASE_URL}/transaction`, {
    method: "POST",
    headers: { "X-API-Key": apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Xeque ${res.status}: ${err}`);
  }

  const json = await res.json() as {
    status?: string; transaction_id?: number | string; id?: string;
    qr_code?: string; qr_code_base64?: string;
  };

  if (json.status !== "success") throw new Error(`Xeque: resposta sem status=success (${JSON.stringify(json)})`);
  if (!json.transaction_id) throw new Error("Xeque: sem transaction_id na resposta");
  if (!json.qr_code) throw new Error("Xeque: sem qr_code na resposta");

  return {
    id: String(json.transaction_id),
    status: "PENDING",
    pixPayload: json.qr_code,
    merchantName: extractPixMerchantName(json.qr_code),
  };
}

export async function xequeGetTransaction(id: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/query?action=get_transaction&id=${encodeURIComponent(id)}`, {
    headers: { "X-API-Key": apiKey() },
  });
  if (!res.ok) return null;
  const json = await res.json() as { status?: string };
  return json.status ? json.status.toUpperCase() : null;
}
