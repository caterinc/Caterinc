type UtmifyStatus = "waiting_payment" | "paid" | "refunded" | "cancelled";

interface UtmifyPayload {
  orderId: string;
  status: UtmifyStatus;
  platform: string;
  paymentMethod: string;
  createdAt: string;
  approvedDate: string | null;
  refundedAt: null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    document: string | null;
  };
  products: Array<{
    id: string;
    name: string;
    planId: null;
    planName: null;
    quantity: number;
    priceInCents: number;
  }>;
  trackingParameters: {
    src: string | null; sck: string | null;
    utm_source: string | null; utm_campaign: string | null;
    utm_medium: string | null; utm_content: string | null; utm_term: string | null;
  };
  commission: {
    totalInCents: number;
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
  };
}

function formatDate(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function getApiKey(): string | null {
  return process.env.UTMIFY_API_KEY?.trim() || null;
}

export interface UtmData {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  src?: string | null;
  sck?: string | null;
}

export async function sendUtmifyEvent(
  orderId: string,
  status: UtmifyStatus,
  customer: { name: string; email: string; phone?: string | null },
  items: Array<{ id: string; name: string; quantity: number; priceInCents: number }>,
  totalInCents: number,
  createdAt?: Date,
  utmData?: UtmData | null,
  paymentMethod?: string | null
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const method = paymentMethod === "card" ? "credit_card" : "pix";

  const payload: UtmifyPayload = {
    orderId,
    status,
    platform: "other",
    paymentMethod: method,
    createdAt: formatDate(createdAt || new Date()),
    approvedDate: status === "paid" ? formatDate(new Date()) : null,
    refundedAt: null,
    customer: {
      name: customer.name || "Cliente",
      email: customer.email,
      phone: customer.phone || null,
      document: null,
    },
    products: items.map((i) => ({
      id: i.id,
      name: i.name,
      planId: null,
      planName: null,
      quantity: i.quantity,
      priceInCents: i.priceInCents,
    })),
    trackingParameters: {
      src: utmData?.src || null,
      sck: utmData?.sck || null,
      utm_source: utmData?.utm_source || null,
      utm_campaign: utmData?.utm_campaign || null,
      utm_medium: utmData?.utm_medium || null,
      utm_content: utmData?.utm_content || null,
      utm_term: utmData?.utm_term || null,
    },
    commission: {
      totalInCents,
      totalPriceInCents: totalInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: totalInCents,
    },
  };

  try {
    const res = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": apiKey },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("[UTMify] Failed:", res.status, await res.text().catch(() => ""));
    } else {
      console.log(`[UTMify] Event sent: ${orderId} → ${status}`);
    }
  } catch (e) {
    console.error("[UTMify] Error:", e);
  }
}
