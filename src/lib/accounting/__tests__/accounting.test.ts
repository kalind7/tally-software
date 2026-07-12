import { describe, expect, it } from "vitest";
import { buildBalanceSheet } from "@/lib/accounting/balance-sheet";
import {
  getOutstandingForBill,
  validateBillSettlement,
} from "@/lib/accounting/bill-outstanding";
import { validateVoucherLines } from "@/lib/accounting/voucher";
import { buildVatLines, splitVatFromTaxable } from "@/lib/accounting/vat";
import { buildTrialBalance } from "@/lib/accounting/trial-balance";
import type { BalanceType, EntryType, GroupNature } from "@prisma/client";

const booksBegin = new Date("2025-04-01");
const asOf = new Date("2025-06-30");

function ledger(
  id: string,
  name: string,
  nature: GroupNature,
  groupName: string,
  openingBalance = 0,
  openingType: BalanceType = "Dr",
  lines: { amount: number; entryType: EntryType; date: Date }[] = []
) {
  return {
    id,
    name,
    openingBalance,
    openingType,
    group: { name: groupName, nature },
    voucherLines: lines.map((l) => ({
      amount: l.amount,
      entryType: l.entryType,
      voucher: { date: l.date },
    })),
  };
}

describe("validateVoucherLines", () => {
  it("rejects unbalanced vouchers", () => {
    const result = validateVoucherLines([
      { ledgerId: "a", amount: 100, entryType: "Dr" },
      { ledgerId: "b", amount: 90, entryType: "Cr" },
    ]);
    expect(result.valid).toBe(false);
  });

  it("accepts balanced vouchers", () => {
    const result = validateVoucherLines([
      { ledgerId: "a", amount: 100, entryType: "Dr" },
      { ledgerId: "b", amount: 100, entryType: "Cr" },
    ]);
    expect(result.valid).toBe(true);
  });
});

describe("splitVatFromTaxable", () => {
  it("splits 13% VAT with 2 decimal rounding", () => {
    const split = splitVatFromTaxable(1000);
    expect(split.taxable).toBe(1000);
    expect(split.vat).toBe(130);
    expect(split.total).toBe(1130);
  });

  it("builds balanced sales VAT lines", () => {
    const lines = buildVatLines(1000, "sales");
    const dr = lines.filter((l) => l.entryType === "Dr").reduce((s, l) => s + l.amount, 0);
    const cr = lines.filter((l) => l.entryType === "Cr").reduce((s, l) => s + l.amount, 0);
    expect(dr).toBe(cr);
    expect(dr).toBe(1130);
  });
});

describe("bill outstanding", () => {
  const bills = [
    {
      id: "b1",
      ledgerId: "l1",
      billNo: "INV-1",
      billDate: new Date(),
      dueDate: null,
      amount: 1000,
      refType: "New" as const,
      againstBillId: null,
    },
    {
      id: "b2",
      ledgerId: "l1",
      billNo: "INV-1",
      billDate: new Date(),
      dueDate: null,
      amount: 400,
      refType: "Against" as const,
      againstBillId: "b1",
    },
  ];

  it("computes outstanding after partial settlement", () => {
    expect(getOutstandingForBill(bills[0], bills)).toBe(600);
  });

  it("rejects over-settlement", () => {
    const result = validateBillSettlement("Against", 700, "b1", bills);
    expect(result.valid).toBe(false);
  });
});

describe("buildBalanceSheet", () => {
  it("balances assets with liabilities and equity", () => {
    const ledgers = [
      ledger("cash", "Cash", "Asset", "Cash-in-Hand", 0, "Dr", [
        { amount: 5000, entryType: "Dr", date: new Date("2025-05-01") },
      ]),
      ledger("sales", "Sales", "Income", "Sales Accounts", 0, "Cr", [
        { amount: 5000, entryType: "Cr", date: new Date("2025-05-01") },
      ]),
    ];

    const bs = buildBalanceSheet(ledgers, booksBegin, asOf);
    expect(bs.totalAssets).toBe(5000);
    expect(Math.abs(bs.difference)).toBeLessThan(0.02);
  });
});

describe("buildTrialBalance", () => {
  it("totals debits and credits equally for balanced books", () => {
    const ledgers = [
      ledger("cash", "Cash", "Asset", "Cash-in-Hand", 0, "Dr", [
        { amount: 200, entryType: "Dr", date: asOf },
      ]),
      ledger("sales", "Sales", "Income", "Sales Accounts", 0, "Cr", [
        { amount: 200, entryType: "Cr", date: asOf },
      ]),
    ];
    const tb = buildTrialBalance(ledgers, asOf);
    expect(Math.abs(tb.totalDr - tb.totalCr)).toBeLessThan(0.02);
  });
});
