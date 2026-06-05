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
