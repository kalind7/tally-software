import type { EntryType } from "@prisma/client";

export type VoucherLineInput = {
  ledgerId: string;
  amount: number;
  entryType: EntryType;
  billNo?: string;
  billDate?: string;
  dueDate?: string;
  refType?: "New" | "Against" | "OnAccount";
};

export function validateVoucherLines(lines: VoucherLineInput[]) {
  const validLines = lines.filter((l) => l.ledgerId && l.amount > 0);

  if (validLines.length < 2) {
    return { valid: false, error: "At least two ledger lines with amounts are required." };
  }

  const totalDr = validLines
    .filter((l) => l.entryType === "Dr")
    .reduce((sum, l) => sum + l.amount, 0);
  const totalCr = validLines
    .filter((l) => l.entryType === "Cr")
    .reduce((sum, l) => sum + l.amount, 0);

  if (Math.abs(totalDr - totalCr) > 0.001) {
    return {
      valid: false,
      error: `Debit (${totalDr.toFixed(2)}) must equal Credit (${totalCr.toFixed(2)}).`,
    };
  }

  return { valid: true, totalDr, totalCr, validLines };
}

export function getNextVoucherNumber(
  existingNumbers: string[],
  type: string,
  fyLabel: string
) {
  const prefix = `${type.slice(0, 3).toUpperCase()}-${fyLabel}-`;
  const nums = existingNumbers
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !isNaN(n));

  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function getFyLabel(date: Date, fyStartMonth: number) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month >= fyStartMonth) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
}
