import type { BillRefType } from "@prisma/client";

export type BillRefRow = {
  id: string;
  ledgerId: string;
  billNo: string;
  billDate: Date;
  dueDate: Date | null;
  amount: number | string | { toString(): string };
  refType: BillRefType;
  againstBillId: string | null;
};

export function getBillAmount(bill: { amount: number | string | { toString(): string } }) {
  return Number(bill.amount);
}

/** Outstanding for a single New bill = its amount minus Against settlements linked to it. */
export function getOutstandingForBill(
  bill: BillRefRow,
  allBills: BillRefRow[]
): number {
  if (bill.refType !== "New") return 0;

  const original = getBillAmount(bill);
  const settled = allBills
    .filter((b) => b.refType === "Against" && b.againstBillId === bill.id)
    .reduce((sum, b) => sum + getBillAmount(b), 0);

  return Math.max(0, round2(original - settled));
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** All New bills with outstanding > 0 for a ledger. */
export function getOpenBillsForLedger(ledgerId: string, allBills: BillRefRow[]) {
  return allBills
    .filter((b) => b.ledgerId === ledgerId && b.refType === "New")
    .map((bill) => ({
      ...bill,
      amount: getBillAmount(bill),
      outstanding: getOutstandingForBill(bill, allBills),
    }))
    .filter((b) => b.outstanding > 0.001)
    .sort((a, b) => a.billDate.getTime() - b.billDate.getTime());
}

export function validateBillSettlement(
  refType: BillRefType,
  amount: number,
  againstBillId: string | undefined,
  allBills: BillRefRow[]
): { valid: true } | { valid: false; error: string } {
  if (refType === "OnAccount") {
    return { valid: true };
  }

  if (refType === "New") {
    if (!amount || amount <= 0) {
      return { valid: false, error: "Bill amount must be greater than zero." };
    }
    return { valid: true };
  }

  if (refType === "Against") {
    if (!againstBillId) {
      return { valid: false, error: "Select a bill to settle against." };
    }
    const original = allBills.find((b) => b.id === againstBillId);
    if (!original || original.refType !== "New") {
      return { valid: false, error: "Invalid bill selected for settlement." };
    }
    const outstanding = getOutstandingForBill(original, allBills);
    if (amount > outstanding + 0.001) {
      return {
        valid: false,
        error: `Settlement amount (${amount.toFixed(2)}) exceeds outstanding (${outstanding.toFixed(2)}).`,
      };
    }
    return { valid: true };
  }

  return { valid: false, error: "Invalid bill reference type." };
}

/** Check if a New bill has any Against settlements (blocks voucher delete/edit). */
export function hasSettlements(billId: string, allBills: BillRefRow[]): boolean {
  return allBills.some((b) => b.refType === "Against" && b.againstBillId === billId);
}
