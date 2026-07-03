import crypto from "crypto";

const PIXEL_ID = "1821164748580849";
const VSL_URL = "https://forces-one.com";

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
}

export async function sendMetaEvent(params: MetaEventParams): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;

  const userData: Record<string, unknown> = {};
  if (params.email) userData.em = [hash(params.email)];
  if (params.phone) userData.ph = [hash(params.phone.replace(/\D/g, ""))];
  if (params.firstName) userData.fn = [hash(params.firstName)];
  if (params.lastName) userData.ln = [hash(params.lastName)];
  if (params.fbc) userData.fbc = params.fbc;
  if (params.fbp) userData.fbp = params.fbp;

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
      event_source_url: VSL_URL,
      user_data: userData,
      custom_data: Object.keys(customData).length > 0 ? customData : undefined,
    }],
  };

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${token}`,
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
