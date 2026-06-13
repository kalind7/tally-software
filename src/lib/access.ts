import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export function isAdmin(role: UserRole) {
  return role === "ADMIN";
}

export async function getCompaniesForUser(userId: string, role: UserRole) {
  const include = isAdmin(role)
    ? { owner: { select: { id: true, name: true, email: true } } }
    : undefined;

  if (isAdmin(role)) {
    return db.company.findMany({
      orderBy: { name: "asc" },
      include,
    });
  }
  return db.company.findMany({
    where: { ownerId: userId },
    orderBy: { name: "asc" },
    include,
  });
}

export async function userCanAccessCompany(
  userId: string,
  role: UserRole,
  companyId: string
) {
  if (isAdmin(role)) return true;
  const company = await db.company.findFirst({
    where: { id: companyId, ownerId: userId },
    select: { id: true },
  });
  return Boolean(company);
}

export async function requireCompanyAccess(
  userId: string,
  role: UserRole,
  companyId: string
) {
  const allowed = await userCanAccessCompany(userId, role, companyId);
  if (!allowed) {
    throw new Error("You do not have access to this company.");
  }
}
