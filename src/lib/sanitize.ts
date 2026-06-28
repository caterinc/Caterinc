// Input sanitization utilities — call at API route boundaries, never trust client input

const HTML_CHARS = /[<>"'`]/g;

export function sanitizeString(input: unknown, maxLen = 10_000): string {
  if (typeof input !== "string") return "";
  return input.replace(HTML_CHARS, "").trim().slice(0, maxLen);
}

export function sanitizeEmail(input: unknown): string {
  const s = sanitizeString(input, 320);
  // Basic email format validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s.toLowerCase() : "";
}

export function sanitizeUrl(input: unknown): string {
  const s = sanitizeString(input, 2048);
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return s;
  } catch {
    return "";
  }
}

export function sanitizePositiveNumber(input: unknown): number {
  const n = parseFloat(String(input));
  return isNaN(n) || n < 0 ? 0 : n;
}

export function sanitizeInt(input: unknown, min = 0, max = 999_999): number {
  const n = parseInt(String(input), 10);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function sanitizeSlug(input: unknown): string {
  return sanitizeString(input, 200).replace(/[^a-z0-9-_]/gi, "");
}

// Verify request Origin/Referer for state-changing routes
export function verifyOrigin(req: Request, allowedOrigin?: string): boolean {
  const allowed = allowedOrigin || process.env.NEXTAUTH_URL || "";
  const origin  = req.headers.get("origin");
  const referer = req.headers.get("referer");
  if (origin)  return origin.startsWith("http://localhost")  || (allowed ? origin  === allowed                : true);
  if (referer) return referer.startsWith("http://localhost") || (allowed ? referer.startsWith(allowed)        : true);
  return true;
}
