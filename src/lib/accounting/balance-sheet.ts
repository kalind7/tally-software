import { getSignedBalance, sumMovements } from "@/lib/accounting/ledger-balance";
import { buildProfitLoss } from "@/lib/accounting/profit-loss";
import type { BalanceType, EntryType, GroupNature, Prisma } from "@prisma/client";

export type BalanceSheetRow = {
  ledgerId: string;
  ledgerName: string;
  groupName: string;
  amount: number;
};

export type BalanceSheetResult = {
  assets: BalanceSheetRow[];
  liabilities: BalanceSheetRow[];
  equity: BalanceSheetRow[];
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  difference: number;
};

type LedgerInput = {
  id: string;
  name: string;
  openingBalance: number | string | Prisma.Decimal;
  openingType: BalanceType;
  group: { name: string; nature: GroupNature };
  voucherLines: {
    amount: number | string | Prisma.Decimal;
    entryType: EntryType;
    voucher: { date: Date };
  }[];
};

function getClosingBalance(ledger: LedgerInput, asOfDate: Date) {
  const filteredLines = ledger.voucherLines.filter(
    (l) => l.voucher.date <= asOfDate
  );
  const { drTotal, crTotal } = sumMovements(filteredLines);
  return getSignedBalance({
    openingBalance: Number(ledger.openingBalance),
    openingType: ledger.openingType,
    drTotal,
    crTotal,
  });
}

export function buildBalanceSheet(
  ledgers: LedgerInput[],
  booksBeginDate: Date,
  asOfDate: Date
): BalanceSheetResult {
  const assets: BalanceSheetRow[] = [];
  const liabilities: BalanceSheetRow[] = [];
  const equity: BalanceSheetRow[] = [];

  for (const ledger of ledgers) {
    const { dr, cr, signed } = getClosingBalance(ledger, asOfDate);
    if (dr === 0 && cr === 0) continue;

    const nature = ledger.group.nature;

    if (nature === "Income" || nature === "Expense") {
      continue;
    }

    const row: BalanceSheetRow = {
      ledgerId: ledger.id,
      ledgerName: ledger.name,
      groupName: ledger.group.name,
      amount: 0,
    };

    if (nature === "Asset") {
      if (dr > 0) {
        row.amount = dr;
        assets.push(row);
      } else if (cr > 0) {
        row.amount = cr;
        liabilities.push({ ...row, amount: cr });
      }
    } else if (nature === "Liability") {
      if (cr > 0) {
        row.amount = cr;
        liabilities.push(row);
      } else if (dr > 0) {
        row.amount = dr;
        assets.push({ ...row, amount: dr });
      }
    } else if (ledger.group.name === "Capital Account") {
      row.amount = cr > 0 ? cr : dr;
      equity.push(row);
    }
  }

  const pl = buildProfitLoss(ledgers, booksBeginDate, asOfDate);
  const netProfit = pl.netProfit;

  const totalAssets = assets.reduce((s, r) => s + r.amount, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.amount, 0);
  const totalEquityLedgers = equity.reduce((s, r) => s + r.amount, 0);
  const totalEquity = totalEquityLedgers + netProfit;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const difference = round2(totalAssets - totalLiabilitiesAndEquity);

  return {
    assets: sortRows(assets),
    liabilities: sortRows(liabilities),
    equity: sortRows(equity),
    netProfit,
    totalAssets: round2(totalAssets),
    totalLiabilities: round2(totalLiabilities),
    totalEquity: round2(totalEquity),
    totalLiabilitiesAndEquity: round2(totalLiabilitiesAndEquity),
    difference,
  };
}

function sortRows(rows: BalanceSheetRow[]) {
  return [...rows].sort((a, b) => a.ledgerName.localeCompare(b.ledgerName));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
