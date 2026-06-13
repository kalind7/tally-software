import type { GroupNature, Prisma } from "@prisma/client";

export type DefaultGroup = {
  name: string;
  nature: GroupNature;
  isPrimary: boolean;
};

/** Nepal IRD-friendly chart of account groups (Tally Prime style) */
export const DEFAULT_LEDGER_GROUPS: DefaultGroup[] = [
  { name: "Capital Account", nature: "Liability", isPrimary: true },
  { name: "Current Assets", nature: "Asset", isPrimary: true },
  { name: "Current Liabilities", nature: "Liability", isPrimary: true },
  { name: "Fixed Assets", nature: "Asset", isPrimary: true },
  { name: "Bank Accounts", nature: "Asset", isPrimary: true },
  { name: "Cash-in-Hand", nature: "Asset", isPrimary: true },
  { name: "Sundry Debtors", nature: "Asset", isPrimary: true },
  { name: "Sundry Creditors", nature: "Liability", isPrimary: true },
  { name: "Sales Accounts", nature: "Income", isPrimary: true },
  { name: "Purchase Accounts", nature: "Expense", isPrimary: true },
  { name: "Direct Expenses", nature: "Expense", isPrimary: true },
  { name: "Indirect Expenses", nature: "Expense", isPrimary: true },
  { name: "Direct Incomes", nature: "Income", isPrimary: true },
  { name: "Indirect Incomes", nature: "Income", isPrimary: true },
];

/** Pre-seeded ledgers so beginners can post vouchers immediately */
export const NEPAL_STARTER_LEDGERS: {
  name: string;
  groupName: string;
  openingType: "Dr" | "Cr";
}[] = [
  { name: "Cash", groupName: "Cash-in-Hand", openingType: "Dr" },
  { name: "Bank", groupName: "Bank Accounts", openingType: "Dr" },
  { name: "VAT Payable", groupName: "Current Liabilities", openingType: "Cr" },
  { name: "VAT Recoverable", groupName: "Current Assets", openingType: "Dr" },
  { name: "Sales", groupName: "Sales Accounts", openingType: "Cr" },
  { name: "Purchase", groupName: "Purchase Accounts", openingType: "Dr" },
];

export async function seedLedgerGroupsForCompany(
  companyId: string,
  client?: Prisma.TransactionClient
) {
  const { db } = await import("@/lib/db");
  const database = client ?? db;

  await database.ledgerGroup.createMany({
    data: DEFAULT_LEDGER_GROUPS.map((group) => ({
      companyId,
      name: group.name,
      nature: group.nature,
      isPrimary: group.isPrimary,
    })),
    skipDuplicates: true,
  });

  for (const starter of NEPAL_STARTER_LEDGERS) {
    const group = await database.ledgerGroup.findFirst({
      where: { companyId, name: starter.groupName },
    });
    if (!group) continue;

    const existing = await database.ledger.findFirst({
      where: { companyId, name: starter.name },
    });
    if (existing) continue;

    await database.ledger.create({
      data: {
        companyId,
        groupId: group.id,
        name: starter.name,
        openingBalance: 0,
        openingType: starter.openingType,
      },
    });
  }
}
