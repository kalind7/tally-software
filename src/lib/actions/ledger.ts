"use server";

import { db } from "@/lib/db";
import { getSignedBalance, sumMovements } from "@/lib/accounting/ledger-balance";
import { serializeLedgerForClient } from "@/lib/serialize";
import { requireCompany } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type LedgerWithBalance = ReturnType<typeof serializeLedgerForClient> & {
  currentDr: number;
  currentCr: number;
  hasVoucherActivity: boolean;
};

export async function getLedgers(): Promise<LedgerWithBalance[]> {
  const { companyId } = await requireCompany();
  const ledgers = await db.ledger.findMany({
    where: { companyId },
    include: {
      group: true,
      voucherLines: { include: { voucher: true } },
    },
    orderBy: { name: "asc" },
  });

  return ledgers.map((ledger) => {
    const { drTotal, crTotal } = sumMovements(ledger.voucherLines);
    const { dr, cr } = getSignedBalance({
      openingBalance: Number(ledger.openingBalance),
      openingType: ledger.openingType,
      drTotal,
      crTotal,
    });
    return {
      ...serializeLedgerForClient(ledger),
      currentDr: dr,
      currentCr: cr,
      hasVoucherActivity: ledger.voucherLines.length > 0,
    };
  });
}

export async function getLedgerGroups() {
  const { companyId } = await requireCompany();
  return db.ledgerGroup.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });
}

export async function createLedger(formData: FormData) {
  const { companyId } = await requireCompany();

  const name = (formData.get("name") as string)?.trim();
  const groupId = formData.get("groupId") as string;
  const openingBalance = Number(formData.get("openingBalance") || 0);
  const openingType = (formData.get("openingType") as "Dr" | "Cr") || "Dr";

  if (!name || !groupId) {
    return { error: "Ledger name and group are required." };
  }

  const existing = await db.ledger.findUnique({
    where: { companyId_name: { companyId, name } },
  });
  if (existing) {
    return { error: "A ledger with this name already exists." };
  }

  const ledger = await db.ledger.create({
    data: {
      companyId,
      groupId,
      name,
      openingBalance,
      openingType,
    },
  });

  revalidatePath("/masters/ledgers");
  revalidatePath("/masters/groups");
  return { success: true, ledgerId: ledger.id };
}

export async function getChartOfAccounts() {
  const { companyId } = await requireCompany();
  const groups = await db.ledgerGroup.findMany({
    where: { companyId },
    include: {
      ledgers: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });
  return groups.filter((g) => g.ledgers.length > 0 || g.isPrimary);
}
