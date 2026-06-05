import { getSignedBalance, sumMovements } from "@/lib/accounting/ledger-balance";
import type { BalanceType, EntryType, GroupNature, Prisma } from "@prisma/client";

export type TrialBalanceRow = {
  ledgerId: string;
  ledgerName: string;
  groupName: string;
  nature: GroupNature;
  dr: number;
  cr: number;
};

export function buildTrialBalance(
  ledgers: {
    id: string;
    name: string;
    openingBalance: number | string | Prisma.Decimal;
    openingType: BalanceType;
    group: { name: string; nature: GroupNature };
    voucherLines: { amount: number | string | Prisma.Decimal; entryType: EntryType; voucher: { date: Date } }[];
  }[],
  asOfDate?: Date
): { rows: TrialBalanceRow[]; totalDr: number; totalCr: number } {
  const rows: TrialBalanceRow[] = [];
  let totalDr = 0;
  let totalCr = 0;

  for (const ledger of ledgers) {
    const filteredLines = asOfDate
      ? ledger.voucherLines.filter((l) => l.voucher.date <= asOfDate)
      : ledger.voucherLines;

    const { drTotal, crTotal } = sumMovements(filteredLines);
    const { dr, cr } = getSignedBalance({
      openingBalance: Number(ledger.openingBalance),
      openingType: ledger.openingType,
      drTotal,
      crTotal,
    });

    if (dr === 0 && cr === 0) continue;

    rows.push({
      ledgerId: ledger.id,
      ledgerName: ledger.name,
      groupName: ledger.group.name,
      nature: ledger.group.nature,
      dr,
      cr,
    });
    totalDr += dr;
    totalCr += cr;
  }

  rows.sort((a, b) => a.ledgerName.localeCompare(b.ledgerName));
  return { rows, totalDr, totalCr };
}
