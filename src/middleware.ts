import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { COMPANY_COOKIE } from "@/lib/company-cookie";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");

  const companyId =
    req.cookies.get(COMPANY_COOKIE)?.value ?? req.auth?.user?.companyId ?? null;

  // #region agent log
  fetch("http://127.0.0.1:7594/ingest/adcffb25-c038-4b7b-a844-42a7f9b3b4e2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "faa332",
    },
    body: JSON.stringify({
      sessionId: "faa332",
      runId: "post-fix",
      hypothesisId: "H1-edge-prisma",
      location: "middleware.ts:entry",
      message: "middleware ran without prisma import",
      data: {
        path: req.nextUrl.pathname,
        isLoggedIn,
        hasCompany: !!companyId,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (isApiAuth) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/companies", req.url));
  }

  const isCompaniesPage = req.nextUrl.pathname.startsWith("/companies");
  if (isLoggedIn && !companyId && !isCompaniesPage && !isAuthPage) {
    return NextResponse.redirect(new URL("/companies", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
