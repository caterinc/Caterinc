import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import slugify from "slugify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// navigator.clipboard silently fails (or is undefined) in several in-app
// browsers (Instagram/Facebook WebView), which is where most ad traffic
// lands — falls back to the legacy execCommand so the PIX copy button
// always either copies or reports failure, never a false "Copiado!".
export async function copyToClipboard(text: string): Promise<boolean> {
  const legacyCopy = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return legacyCopy();
  } catch {
    return legacyCopy();
  }
}

// Vercel's serverless functions always run with TZ=UTC, regardless of the
// deploy region — so plain `new Date().setHours(0,0,0,0)` on the server zeroes
// out midnight UTC, not midnight in Brazil (UTC-3). That made "hoje" in the
// admin dashboard roll over 3h before real Brasília midnight. Brazil has had
// no DST since 2019, so a fixed -3h offset is safe.
const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000;

// A Date whose UTC-getters (getUTCFullYear/getUTCMonth/getUTCDate/getUTCHours…)
// read back Brazil's current wall-clock values, independent of server TZ.
function toBrazilWallClock(date: Date): Date {
  return new Date(date.getTime() - BRAZIL_OFFSET_MS);
}

// Reverses toBrazilWallClock: turns a Brazil wall-clock Date back into the
// real UTC instant it represents (what Prisma/Postgres should compare against).
function fromBrazilWallClock(wallClock: Date): Date {
  return new Date(wallClock.getTime() + BRAZIL_OFFSET_MS);
}

// UTC instant equal to 00:00:00 in Brazil time, `daysAgo` days before today.
export function brazilDayStart(daysAgo = 0): Date {
  const wc = toBrazilWallClock(new Date());
  wc.setUTCDate(wc.getUTCDate() - daysAgo);
  wc.setUTCHours(0, 0, 0, 0);
  return fromBrazilWallClock(wc);
}

// UTC instant equal to 23:59:59.999 in Brazil time, `daysAgo` days before today.
export function brazilDayEnd(daysAgo = 0): Date {
  return new Date(brazilDayStart(daysAgo).getTime() + 24 * 60 * 60 * 1000 - 1);
}

// UTC instant equal to the 1st of the current (or previous, if monthsAgo=1)
// month at 00:00:00 in Brazil time.
export function brazilMonthStart(monthsAgo = 0): Date {
  const wc = toBrazilWallClock(new Date());
  wc.setUTCMonth(wc.getUTCMonth() - monthsAgo, 1);
  wc.setUTCHours(0, 0, 0, 0);
  return fromBrazilWallClock(wc);
}

export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: "pt",
  });
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `CAT-${timestamp}${random}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando",
  CONFIRMED: "Confirmado",
  PROCESSING: "Em Preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};
