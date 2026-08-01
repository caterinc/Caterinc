import { prisma } from "@/lib/prisma";

export interface Buyer {
  email: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  total: number;
  lastPurchaseAt: Date;
}

// Known test/admin transactions to keep out of the buyer list:
// - R$5,50 is the fixed amount used by the admin's "Testar PIX" button
// - v[0-9]0shop@proto(n)?.me is the developer's own repeated test email
// - the store owner's own email, in case they ever test-bought themselves
const TEST_EMAIL_PATTERNS = [/^v\d0shop@proto/i, /teste@|test@/i];
const ADMIN_EMAILS = ["alexandrecosme125@gmail.com"];

function isTestOrder(email: string, total: number): boolean {
  if (total === 5.5) return true;
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  return TEST_EMAIL_PATTERNS.some((re) => re.test(email));
}

// Real, paying customers only — deduplicated by email, most recent order wins
// for name/phone/address. Used both by the admin list and the CSV export, so
// they never drift apart.
export async function getRealBuyers(): Promise<Buyer[]> {
  const orders = await prisma.order.findMany({
    where: { paymentStatus: "PAID" },
    select: { email: true, total: true, shippingAddress: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const byEmail = new Map<string, Buyer>();
  for (const o of orders) {
    const email = o.email.trim().toLowerCase();
    if (!email || isTestOrder(email, Number(o.total))) continue;
    if (byEmail.has(email)) continue; // orders sorted desc, first hit = most recent

    const addr = (o.shippingAddress as Record<string, string> | null) || {};
    byEmail.set(email, {
      email,
      name: addr.name || "",
      phone: addr.phone || "",
      city: addr.city || "",
      state: addr.state || "",
      zipCode: addr.zipCode || "",
      total: Number(o.total),
      lastPurchaseAt: o.createdAt,
    });
  }

  return Array.from(byEmail.values());
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Meta's raw (unhashed) Customer List format — Meta hashes it themselves on
// upload, which avoids any risk of us getting SHA256 normalization subtly
// wrong and silently tanking match quality.
export function buildMetaAudienceCsv(buyers: Buyer[]): string {
  const header = "email,phone,fn,ln,ct,st,zip,country";
  const rows = buyers.map((b) => {
    const email = b.email;
    const digits = b.phone.replace(/\D/g, "");
    const phone = digits ? (digits.startsWith("55") ? digits : `55${digits}`) : "";
    const nameParts = stripAccents(b.name).toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/);
    const fn = nameParts[0] || "";
    const ln = nameParts.slice(1).join(" ");
    const ct = stripAccents(b.city).toLowerCase().replace(/[^a-z]/g, "");
    const st = b.state.toLowerCase().slice(0, 2);
    const zip = b.zipCode.replace(/\D/g, "");
    return [email, phone, fn, ln, ct, st, zip, "br"]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(",");
  });
  return [header, ...rows].join("\n");
}
