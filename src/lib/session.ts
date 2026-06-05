import { auth } from "@/lib/auth";
import { COMPANY_COOKIE } from "@/lib/company-cookie";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getActiveCompanyId() {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(COMPANY_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  const session = await auth();
  return session?.user?.companyId ?? null;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireCompany() {
  const session = await requireAuth();
  const companyId = (await getActiveCompanyId()) ?? session.user.companyId;
  if (!companyId) {
    redirect("/companies");
  }
  return { session, companyId };
}
