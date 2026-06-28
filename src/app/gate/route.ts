import { NextRequest, NextResponse } from "next/server";

// Admin gate — visit /gate?s=ADMIN_GATE_SECRET to unlock /admin
// Without this cookie, the /admin path redirects to home (appears non-existent)
export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams.get("s");
  const secret = process.env.ADMIN_GATE_SECRET;

  if (!secret || !s || s !== secret) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set("adm_gk", secret, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
