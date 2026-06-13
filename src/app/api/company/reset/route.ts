import { COMPANY_COOKIE } from "@/lib/company-cookie";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(COMPANY_COOKIE);

  return NextResponse.redirect(new URL("/companies", request.url));
}
