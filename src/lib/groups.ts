import type { GroupNature, Prisma } from "@prisma/client";

export type DefaultGroup = {
  name: string;
  nature: GroupNature;
  isPrimary: boolean;
};

export const DEFAULT_LEDGER_GROUPS: DefaultGroup[] = [
  { name: "Capital Account", nature: "Liability", isPrimary: true },
  { name: "Current Assets", nature: "Asset", isPrimary: true },
  { name: "Current Liabilities", nature: "Liability", isPrimary: true },
  { name: "Fixed Assets", nature: "Asset", isPrimary: true },
  { name: "Investments", nature: "Asset", isPrimary: true },
  { name: "Loans (Liability)", nature: "Liability", isPrimary: true },
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
}
