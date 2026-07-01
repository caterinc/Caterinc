import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token as { role?: string } | null;
    const { pathname } = req.nextUrl;
    const isAdminPath = pathname.startsWith("/admin");

    if (isAdminPath) {
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
