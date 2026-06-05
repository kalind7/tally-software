import { sumMovements } from "@/lib/accounting/ledger-balance";
import type { BalanceType, EntryType, GroupNature, Prisma } from "@prisma/client";

export type PLRow = {
  ledgerId: string;
  ledgerName: string;
  groupName: string;
  amount: number;
};

export function buildProfitLoss(
  ledgers: {
    id: string;
    name: string;
    openingBalance: number | string | Prisma.Decimal;
    openingType: BalanceType;
    group: { name: string; nature: GroupNature };
    voucherLines: { amount: number | string | Prisma.Decimal; entryType: EntryType; voucher: { date: Date } }[];
  }[],
  fromDate: Date,
  toDate: Date
) {
  const income: PLRow[] = [];
  const expenses: PLRow[] = [];

  for (const ledger of ledgers) {
    if (ledger.group.nature !== "Income" && ledger.group.nature !== "Expense") {
      continue;
    }

    const periodLines = ledger.voucherLines.filter(
      (l) => l.voucher.date >= fromDate && l.voucher.date <= toDate
    );

    const { drTotal, crTotal } = sumMovements(periodLines);
    let amount = 0;

    if (ledger.group.nature === "Income") {
      amount = crTotal - drTotal;
    } else {
      amount = drTotal - crTotal;
    }

    if (amount === 0) continue;

    const row: PLRow = {
      ledgerId: ledger.id,
      ledgerName: ledger.name,
      groupName: ledger.group.name,
      amount,
    };

    if (ledger.group.nature === "Income") {
      income.push(row);
    } else {
      expenses.push(row);
    }
  }

  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  return { income, expenses, totalIncome, totalExpenses, netProfit };
}
