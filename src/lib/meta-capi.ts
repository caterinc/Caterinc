import { createHash } from "crypto";

export function stripBrand(name: string): string {
  return name.replace(/caterpillar\s*/gi, "").replace(/\s+/g, " ").trim();
}

function hash(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : "55" + digits;
  return createHash("sha256").update(normalized).digest("hex");
}

interface CAPIEvent {
  eventName: string;
  eventId: string;
  sourceUrl: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  value?: number;
  currency?: string;
  contents?: Array<{ id: string; quantity: number }>;
  orderId?: string;
}

export async function sendMetaEvent(event: CAPIEvent): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID?.trim();
  const token   = process.env.META_ACCESS_TOKEN?.trim();
  if (!pixelId || !token) return;

  const userData: Record<string, unknown> = {
    em: hash(event.email) ? [hash(event.email)] : undefined,
    ph: hashPhone(event.phone) ? [hashPhone(event.phone)] : undefined,
    fn: event.firstName ? [hash(event.firstName)] : undefined,
    ln: event.lastName  ? [hash(event.lastName)]  : undefined,
    client_ip_address: event.clientIp || undefined,
    client_user_agent: event.clientUserAgent || undefined,
  };

  // Remove undefined keys
  Object.keys(userData).forEach((k) => userData[k] === undefined && delete userData[k]);

  const payload: Record<string, unknown> = {
    event_name: event.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: event.eventId,
    action_source: "website",
    event_source_url: event.sourceUrl,
    user_data: userData,
  };

  if (event.value !== undefined) {
    payload.custom_data = {
      value: event.value,
      currency: event.currency || "BRL",
      contents: event.contents || [],
      content_type: "product",
      order_id: event.orderId,
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [payload] }),
      }
    );
    const body = await res.json() as { events_received?: number; error?: unknown };
    if (!res.ok || !body.events_received) {
      console.warn("[Meta CAPI] Failed:", JSON.stringify(body));
    } else {
      console.log(`[Meta CAPI] ${event.eventName} sent → ${body.events_received} received`);
    }
  } catch (e) {
    console.error("[Meta CAPI] Error:", e);
  }
}
