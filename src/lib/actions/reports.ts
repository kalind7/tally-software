"use server";

import { db } from "@/lib/db";
import { buildProfitLoss } from "@/lib/accounting/profit-loss";
import { buildTrialBalance } from "@/lib/accounting/trial-balance";
import { requireCompany } from "@/lib/session";

async function getLedgersWithMovements(companyId: string) {
  return db.ledger.findMany({
    where: { companyId },
    include: {
      group: true,
      voucherLines: {
        include: { voucher: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTrialBalanceReport(asOfDateStr?: string) {
  const { companyId } = await requireCompany();
  const ledgers = await getLedgersWithMovements(companyId);
  const asOfDate = asOfDateStr ? new Date(asOfDateStr) : undefined;
  return buildTrialBalance(ledgers, asOfDate);
}

export async function getProfitLossReport(fromDateStr: string, toDateStr: string) {
  const { companyId } = await requireCompany();
  const ledgers = await getLedgersWithMovements(companyId);
  const fromDate = new Date(fromDateStr);
  const toDate = new Date(toDateStr);
  return buildProfitLoss(ledgers, fromDate, toDate);
}

export async function getLedgerStatement(ledgerId: string) {
  const { companyId } = await requireCompany();
  const ledger = await db.ledger.findFirst({
    where: { id: ledgerId, companyId },
    include: {
      group: true,
      voucherLines: {
        include: { voucher: true, billRef: true },
        orderBy: { voucher: { date: "asc" } },
      },
    },
  });
  return ledger;
}
