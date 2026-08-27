import crypto from "crypto";

// Pixel unificado com a operação Kit Destrava Leitura (mesmo pixel nas duas).
// "default"/"base" seguem existindo só pelo event_source_url (root vs /base do
// VSL) — ambos reportam pro mesmo pixel/token hoje.
const PIXELS = {
  default: { id: "2279972799414051", token: "META_CAPI_TOKEN_2", url: "https://forces-one.com" },
  base: { id: "2279972799414051", token: "META_CAPI_TOKEN_2", url: "https://forces-one.com/base" },
} as const;

export type PixelSource = keyof typeof PIXELS;

function hash(value: string): string {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export function stripBrand(name: string): string {
  return name.replace(/caterpillar\s*/gi, "").replace(/\s+/g, " ").trim();
}

interface MetaEventParams {
  eventName: string;
  eventId: string;
  sourceUrl?: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  value?: number;
  currency?: string;
  contents?: { id: string; quantity: number }[];
  orderId?: string;
  fbc?: string | null;
  fbp?: string | null;
  externalId?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  pixelSource?: PixelSource | null;
}

export async function sendMetaEvent(params: MetaEventParams): Promise<void> {
  const pixel = PIXELS[params.pixelSource === "base" ? "base" : "default"];
  const token = process.env[pixel.token];
  if (!token) return;

  const userData: Record<string, unknown> = {};
  if (params.email) userData.em = [hash(params.email)];
  if (params.phone) userData.ph = [hash(params.phone.replace(/\D/g, ""))];
  if (params.firstName) userData.fn = [hash(params.firstName)];
  if (params.lastName) userData.ln = [hash(params.lastName)];
  if (params.fbc) userData.fbc = params.fbc;
  if (params.fbp) userData.fbp = params.fbp;
  // Stable per-lead ID (reuses the same _sid the admin's Sessions/Live View already
  // tracks) so Meta can stitch every event for this person into one identity, even
  // when fbc/fbp match quality is imperfect.
  if (params.externalId) userData.external_id = [hash(params.externalId)];
  if (params.clientIp) userData.client_ip_address = params.clientIp;
  if (params.clientUserAgent) userData.client_user_agent = params.clientUserAgent;

  const customData: Record<string, unknown> = {};
  if (params.value !== undefined) {
    customData.value = params.value;
    customData.currency = params.currency || "BRL";
  }
  if (params.contents) customData.contents = params.contents;
  if (params.orderId) customData.order_id = params.orderId;

  const payload = {
    data: [{
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: params.eventId,
      action_source: "website",
      event_source_url: pixel.url,
      user_data: userData,
      custom_data: Object.keys(customData).length > 0 ? customData : undefined,
    }],
  };

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${pixel.id}/events?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta CAPI ${res.status}: ${err}`);
  }
}
