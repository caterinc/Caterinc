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

// Não exige mais "parecer" com um navegador conhecido (chrome/safari/etc) —
// isso pegava navegadores internos de app (Instagram, WhatsApp, TikTok...)
// como se fossem bot. Só bloqueia quem bate com uma assinatura de bot
// conhecida. Prioriza nunca perder lead real, mesmo aceitando que algum
// bot não listado passe.
function isBot(ua: string): boolean {
  if (!ua || ua.length < 10) return true;
  const lower = ua.toLowerCase();
  if (BOT_SIGNATURES.some((sig) => lower.includes(sig))) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";

  // Sec-Fetch-* are attached by the browser's own network stack for a real
  // page navigation — a generic HTTP client (curl, requests, most scrapers)
  // has no reason to send them, unlike User-Agent, which is just a string
  // any client can set to whatever it wants. This combination is treated as
  // proof of a real browser and bypasses the (spoofable) UA check below —
  // that's what fixes in-app browsers like Instagram's on iOS, whose UA
  // lacks "chrome"/"safari" but whose Sec-Fetch-* headers look completely
  // normal, since it's a real WKWebView doing a real navigation.
  const realNavigation =
    req.headers.get("sec-fetch-mode") === "navigate" &&
    req.headers.get("sec-fetch-dest") === "document";

  if (!realNavigation && isBot(ua)) {
    return NextResponse.redirect(SAFE_URL, { status: 302 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|admin|gate|_next/static|_next/image|favicon\\.ico|checkout|pedido-confirmado|rastreio|conta).*)",
  ],
};
