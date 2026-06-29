import { prisma } from "@/lib/prisma";

type UtmifyStatus = "waiting_payment" | "paid" | "refunded" | "cancelled";

interface UtmifyPayload {
  orderId: string;
  status: UtmifyStatus;
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
    src: null; sck: null;
    utm_source: null; utm_campaign: null;
    utm_medium: null; utm_content: null; utm_term: null;
  };
  commission: {
    totalInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
  };
}

function formatDate(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 19);
}

async function getApiKey(): Promise<string | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "utmify_api_key" } });
  return setting?.value?.trim() || null;
}

export async function sendUtmifyEvent(
  orderId: string,
  status: UtmifyStatus,
  customer: { name: string; email: string; phone?: string | null },
  items: Array<{ id: string; name: string; quantity: number; priceInCents: number }>,
  totalInCents: number,
  createdAt?: Date
): Promise<void> {
  const apiKey = await getApiKey();
  if (!apiKey) return;

  const payload: UtmifyPayload = {
    orderId,
    status,
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
      src: null, sck: null,
      utm_source: null, utm_campaign: null,
      utm_medium: null, utm_content: null, utm_term: null,
    },
    commission: {
      totalInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: totalInCents,
    },
  };

  try {
    const res = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
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
