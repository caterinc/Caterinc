import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token as { role?: string } | null;
    const { pathname } = req.nextUrl;
    const isAdminPath = pathname.startsWith("/admin");

    // Extra protection: admin requires the gate cookie in addition to auth session
    if (isAdminPath) {
      const gateSecret = process.env.ADMIN_GATE_SECRET;
      if (gateSecret) {
        const gk = req.cookies.get("adm_gk")?.value;
        if (gk !== gateSecret) {
          // No gate cookie → act as if page doesn't exist
          return NextResponse.redirect(new URL("/", req.url));
        }
      }

      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/conta/login?error=unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const isAdminPath = pathname.startsWith("/admin");
        const isContaPath =
          pathname.startsWith("/conta") &&
          !pathname.startsWith("/conta/login") &&
          !pathname.startsWith("/conta/cadastro");

        if (isAdminPath || isContaPath) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/conta/:path*"],
};
