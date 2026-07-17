import { NextRequest, NextResponse } from "next/server";

const SAFE_URL = "https://forces-one.com";

const BOT_SIGNATURES = [
  // Meta / Facebook
  "facebookexternalhit", "facebot", "facebookbot", "meta-externalagent", "meta-crawler",
  // Google
  "googlebot", "googleadbot", "adsbot-google", "google-inspectiontool", "apis-google",
  "mediapartners-google", "feedfetcher-google", "google-read-aloud", "googleweblight",
  // Bing / Microsoft
  "bingbot", "bingpreview", "msnbot", "adidxbot",
  // SEO crawlers
  "semrushbot", "ahrefsbot", "mj12bot", "dotbot", "blexbot", "petalbot",
  "seokicks", "seoscanners", "seodiver", "uptimebot", "rogerbot",
  "screaming frog", "xenu", "netpeek", "linkdexbot",
  // Social / preview bots
  "twitterbot", "linkedinbot", "whatsapp", "telegrambot", "discordbot",
  "slackbot", "skypeuripreview", "pinterest", "redditbot",
  // Other search engines
  "yandexbot", "baiduspider", "sogou", "duckduckbot", "exabot",
  "ia_archiver", "archive.org", "ccbot", "seznambot",
  // Generic
  "crawler", "spider", "scraper", "wget", "curl", "python-requests",
  "libwww-perl", "java/", "jakarta", "httpclient", "go-http-client",
  "axios", "node-fetch", "got/", "undici", "okhttp",
];

const REAL_BROWSER_MARKERS = ["chrome", "safari", "firefox", "edg/", "opr/", "opera"];

function isBot(ua: string): boolean {
  if (!ua || ua.length < 10) return true;
  const lower = ua.toLowerCase();
  if (BOT_SIGNATURES.some((sig) => lower.includes(sig))) return true;
  if (!lower.includes("mozilla")) return true;
  if (!REAL_BROWSER_MARKERS.some((m) => lower.includes(m))) return true;
  return false;
}

const VSL_GATE_COOKIE = "_vslok";

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";

  // Bots: always bounced to the VSL, same as before.
  if (isBot(ua)) {
    return NextResponse.redirect(SAFE_URL, { status: 302 });
  }

  // Humans: must pass through the VSL first. Real navigation from the VSL's
  // own button carries a forces-one.com Referer; once that happens we drop a
  // cookie so the rest of the visit doesn't get bounced on every click.
  const referer = req.headers.get("referer") || "";
  const cameFromVSL = referer.includes("forces-one.com");
  const hasGateCookie = req.cookies.get(VSL_GATE_COOKIE)?.value === "1";

  if (!cameFromVSL && !hasGateCookie) {
    return NextResponse.redirect(SAFE_URL, { status: 302 });
  }

  const res = NextResponse.next();
  if (!hasGateCookie) {
    res.cookies.set(VSL_GATE_COOKIE, "1", { maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!api|admin|gate|_next/static|_next/image|favicon\\.ico|checkout|pedido-confirmado|rastreio|conta).*)",
  ],
};
