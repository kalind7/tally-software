"use server";

import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import {
  getOpenBillsForLedger,
  getOutstandingForBill,
  type BillRefRow,
} from "@/lib/accounting/bill-outstanding";

async function getAllBills(companyId: string): Promise<BillRefRow[]> {
  return db.billReference.findMany({
    where: { companyId },
    select: {
      id: true,
      ledgerId: true,
      billNo: true,
      billDate: true,
      dueDate: true,
      amount: true,
      refType: true,
      againstBillId: true,
    },
  });
}

export async function getBillIndex(sort: "asc" | "desc" = "asc", openOnly = false) {
  const { companyId } = await requireCompany();
  const allBills = await getAllBills(companyId);

  const bills = await db.billReference.findMany({
    where: { companyId },
    include: {
      ledger: true,
      voucherLine: {
        include: {
          voucher: true,
        },
      },
    },
    orderBy: { billDate: sort },
  });

  const withOutstanding = bills.map((bill) => ({
    ...bill,
    outstanding:
      bill.refType === "New"
        ? getOutstandingForBill(
            {
              id: bill.id,
              ledgerId: bill.ledgerId,
              billNo: bill.billNo,
              billDate: bill.billDate,
              dueDate: bill.dueDate,
              amount: bill.amount,
              refType: bill.refType,
              againstBillId: bill.againstBillId,
            },
            allBills
          )
        : 0,
  }));

  if (openOnly) {
    return withOutstanding.filter(
      (b) => b.refType === "New" && b.outstanding > 0.001
    );
  }

  return withOutstanding;
}

export async function getOpenBills(ledgerId: string) {
  const { companyId } = await requireCompany();
  const allBills = await getAllBills(companyId);
  return getOpenBillsForLedger(ledgerId, allBills).map((b) => ({
    id: b.id,
    billNo: b.billNo,
    billDate: b.billDate.toISOString(),
    dueDate: b.dueDate?.toISOString() ?? null,
    amount: b.amount,
    outstanding: b.outstanding,
  }));
}

export async function getBillOutstanding(billId: string) {
  const { companyId } = await requireCompany();
  const allBills = await getAllBills(companyId);
  const bill = allBills.find((b) => b.id === billId);
  if (!bill) return 0;
  return getOutstandingForBill(bill, allBills);
}
