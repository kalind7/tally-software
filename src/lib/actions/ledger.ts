"use server";

import { db } from "@/lib/db";
import { serializeLedgerForClient } from "@/lib/serialize";
import { requireCompany } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getLedgers() {
  const { companyId } = await requireCompany();
  const ledgers = await db.ledger.findMany({
    where: { companyId },
    include: { group: true },
    orderBy: { name: "asc" },
  });
  // #region agent log
  if (ledgers[0]) {
    fetch("http://127.0.0.1:7425/ingest/6043b083-ac5a-4add-b841-3273d5cc4860", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "32c864",
      },
      body: JSON.stringify({
        sessionId: "32c864",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "ledger.ts:getLedgers",
        message: "openingBalance type from Prisma",
        data: {
          ledgerName: ledgers[0].name,
          openingBalanceType: typeof ledgers[0].openingBalance,
          openingBalanceCtor:
            ledgers[0].openingBalance?.constructor?.name ?? "none",
          isDecimal: ledgers[0].openingBalance?.constructor?.name === "Decimal",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
  const serialized = ledgers.map(serializeLedgerForClient);
  // #region agent log
  if (serialized[0]) {
    fetch("http://127.0.0.1:7425/ingest/6043b083-ac5a-4add-b841-3273d5cc4860", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "32c864",
      },
      body: JSON.stringify({
        sessionId: "32c864",
        runId: "post-fix",
        hypothesisId: "H1",
        location: "ledger.ts:getLedgers:serialized",
        message: "serialized openingBalance for client",
        data: {
          openingBalanceType: typeof serialized[0].openingBalance,
          openingBalanceValue: serialized[0].openingBalance,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
  return serialized;
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
