"use server";

import { auth } from "@/lib/auth";
import { getCompaniesForUser, requireCompanyAccess } from "@/lib/access";
import { COMPANY_COOKIE } from "@/lib/company-cookie";
import { db } from "@/lib/db";
import { seedLedgerGroupsForCompany } from "@/lib/groups";
import { serializeCompanyForClient } from "@/lib/serialize";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getCompanies() {
  const session = await auth();
  if (!session?.user) return [];

  const companies = await getCompaniesForUser(
    session.user.id,
    session.user.role
  );
  return companies.map(serializeCompanyForClient);
}

export async function createCompany(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Not authenticated." };
  }

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const mailingName = (formData.get("mailingName") as string)?.trim();
  const fyStartMonth = Number(formData.get("fyStartMonth") || 4);
  const booksBeginDate = formData.get("booksBeginDate") as string;
  const currency = (formData.get("currency") as string)?.trim() || "NPR";

  if (!name || !booksBeginDate) {
    return { error: "Company name and books begin date are required." };
  }

  const company = await db.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name,
        mailingName: mailingName || name,
        address: address || null,
        fyStartMonth,
        booksBeginDate: new Date(booksBeginDate),
        currency,
        ownerId: session.user.id,
      },
    });

    await seedLedgerGroupsForCompany(created.id, tx);
    return created;
  });

  revalidatePath("/companies");
  return { success: true, companyId: company.id };
}

export async function selectCompanyAction(companyId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated.");
  }

  await requireCompanyAccess(session.user.id, session.user.role, companyId);

  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new Error("Company not found.");
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { companyId },
  });

  const cookieStore = await cookies();
  cookieStore.set(COMPANY_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/");
  redirect("/dashboard");
}
