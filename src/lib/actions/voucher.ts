"use server";

import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import {
  getFyLabel,
  getNextVoucherNumber,
  validateVoucherLines,
  type VoucherLineInput,
} from "@/lib/accounting/voucher";
import type { VoucherType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getVouchers(sort: "asc" | "desc" = "desc") {
  const { companyId } = await requireCompany();
  return db.voucher.findMany({
    where: { companyId },
    include: {
      lines: { include: { ledger: true, billRef: true } },
    },
    orderBy: { date: sort },
  });
}

export async function getVoucher(id: string) {
  const { companyId } = await requireCompany();
  return db.voucher.findFirst({
    where: { id, companyId },
    include: {
      lines: { include: { ledger: true, billRef: true } },
    },
  });
}

export async function getNextNumber(type: VoucherType, dateStr: string) {
  const { companyId } = await requireCompany();
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });
  const date = new Date(dateStr);
  const fyLabel = getFyLabel(date, company.fyStartMonth);

  const existing = await db.voucher.findMany({
    where: { companyId, type },
    select: { number: true },
  });

  return getNextVoucherNumber(
    existing.map((v) => v.number),
    type,
    fyLabel
  );
}

export async function createVoucher(data: {
  type: VoucherType;
  date: string;
  narration?: string;
  lines: VoucherLineInput[];
}) {
  const { companyId } = await requireCompany();
  const validation = validateVoucherLines(data.lines);

  if (!validation.valid) {
    return { error: validation.error };
  }

  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });
  const date = new Date(data.date);
  const fyLabel = getFyLabel(date, company.fyStartMonth);

  const existing = await db.voucher.findMany({
    where: { companyId, type: data.type },
    select: { number: true },
  });

  const number = getNextVoucherNumber(
    existing.map((v) => v.number),
    data.type,
    fyLabel
  );

  const voucher = await db.voucher.create({
    data: {
      companyId,
      type: data.type,
      number,
      date,
      narration: data.narration || null,
      lines: {
        create: validation.validLines!.map((line) => ({
          ledgerId: line.ledgerId,
          amount: line.amount,
          entryType: line.entryType,
        })),
      },
    },
    include: { lines: true },
  });

  for (let i = 0; i < validation.validLines!.length; i++) {
    const line = validation.validLines![i];
    const createdLine = voucher.lines[i];
    if (line.billNo && line.billDate) {
      await db.billReference.create({
        data: {
          companyId,
          ledgerId: line.ledgerId,
          voucherLineId: createdLine.id,
          billNo: line.billNo,
          billDate: new Date(line.billDate),
          dueDate: line.dueDate ? new Date(line.dueDate) : null,
          amount: line.amount,
          refType: line.refType || "New",
        },
      });
    }
  }

  revalidatePath("/transactions/vouchers");
  revalidatePath("/transactions/day-book");
  revalidatePath("/transactions/bills");
  revalidatePath("/reports/trial-balance");
  revalidatePath("/reports/profit-loss");

  return { success: true, voucherId: voucher.id };
}

export async function getDayBook(sort: "asc" | "desc" = "desc") {
  return getVouchers(sort);
}
