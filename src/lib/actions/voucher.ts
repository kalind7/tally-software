"use server";

import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import {
  getFyLabel,
  getNextVoucherNumber,
  validateVoucherLines,
  type VoucherLineInput,
} from "@/lib/accounting/voucher";
import {
  hasSettlements,
  validateBillSettlement,
  type BillRefRow,
} from "@/lib/accounting/bill-outstanding";
import { revalidateAfterVoucherMutation } from "@/lib/accounting/revalidate";
import type { BillRefType, VoucherType } from "@prisma/client";

async function getCompanyBills(companyId: string): Promise<BillRefRow[]> {
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

function validateBillLines(
  lines: VoucherLineInput[],
  allBills: BillRefRow[],
  excludeVoucherBillIds?: string[]
) {
  const billsForValidation = excludeVoucherBillIds
    ? allBills.filter((b) => !excludeVoucherBillIds.includes(b.id))
    : allBills;

  for (const line of lines) {
    const refType = (line.refType || "New") as BillRefType;
    const hasBillData =
      line.billNo || line.billDate || line.againstBillId || refType !== "New";

    if (!hasBillData) continue;

    const result = validateBillSettlement(
      refType,
      line.amount,
      line.againstBillId,
      billsForValidation
    );
    if (!result.valid) {
      return result;
    }

    if (refType === "New" && (!line.billNo || !line.billDate)) {
      return { valid: false as const, error: "Bill number and date are required for new bills." };
    }
  }

  return { valid: true as const };
}

async function createBillRefsForLines(
  companyId: string,
  lines: VoucherLineInput[],
  voucherLines: { id: string }[],
  allBills: BillRefRow[]
) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const createdLine = voucherLines[i];
    const refType = (line.refType || "New") as BillRefType;

    if (refType === "OnAccount") {
      await db.billReference.create({
        data: {
          companyId,
          ledgerId: line.ledgerId,
          voucherLineId: createdLine.id,
          billNo: line.billNo || "On Account",
          billDate: line.billDate ? new Date(line.billDate) : new Date(),
          dueDate: line.dueDate ? new Date(line.dueDate) : null,
          amount: line.amount,
          refType: "OnAccount",
        },
      });
      continue;
    }

    if (refType === "Against" && line.againstBillId) {
      const original = allBills.find((b) => b.id === line.againstBillId);
      await db.billReference.create({
        data: {
          companyId,
          ledgerId: line.ledgerId,
          voucherLineId: createdLine.id,
          againstBillId: line.againstBillId,
          billNo: original?.billNo ?? line.billNo ?? "",
          billDate: original?.billDate ?? new Date(line.billDate ?? Date.now()),
          dueDate: line.dueDate ? new Date(line.dueDate) : null,
          amount: line.amount,
          refType: "Against",
        },
      });
      continue;
    }

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
          refType: "New",
        },
      });
    }
  }
}

async function assertNoBillSettlementBlockers(voucherId: string, companyId: string) {
  const voucher = await db.voucher.findFirst({
    where: { id: voucherId, companyId },
    include: {
      lines: { include: { billRef: true } },
    },
  });
  if (!voucher) {
    return { error: "Voucher not found." as const };
  }

  const allBills = await getCompanyBills(companyId);
  const newBillIds = voucher.lines
    .map((l) => l.billRef)
    .filter((b) => b?.refType === "New")
    .map((b) => b!.id);

  for (const billId of newBillIds) {
    if (hasSettlements(billId, allBills)) {
      return {
        error:
          "This voucher cannot be changed because one of its bills has settlements against it." as const,
      };
    }
  }

  return { voucher };
}

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

  const allBills = await getCompanyBills(companyId);
  const billValidation = validateBillLines(validation.validLines!, allBills);
  if (!billValidation.valid) {
    return { error: billValidation.error };
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

  await createBillRefsForLines(
    companyId,
    validation.validLines!,
    voucher.lines,
    allBills
  );

  revalidateAfterVoucherMutation();

  return { success: true, voucherId: voucher.id };
}

export async function updateVoucher(
  id: string,
  data: {
    type: VoucherType;
    date: string;
    narration?: string;
    lines: VoucherLineInput[];
  }
) {
  const { companyId } = await requireCompany();
  const blockCheck = await assertNoBillSettlementBlockers(id, companyId);
  if ("error" in blockCheck) {
    return { error: blockCheck.error };
  }

  const validation = validateVoucherLines(data.lines);
  if (!validation.valid) {
    return { error: validation.error };
  }

  const existingVoucher = await db.voucher.findFirst({
    where: { id, companyId },
    include: { lines: { include: { billRef: true } } },
  });
  if (!existingVoucher) {
    return { error: "Voucher not found." };
  }

  const excludeBillIds = existingVoucher.lines
    .map((l) => l.billRef?.id)
    .filter((id): id is string => !!id);

  const allBills = await getCompanyBills(companyId);
  const billValidation = validateBillLines(
    validation.validLines!,
    allBills,
    excludeBillIds
  );
  if (!billValidation.valid) {
    return { error: billValidation.error };
  }

  await db.$transaction(async (tx) => {
    const billIds = existingVoucher.lines
      .map((l) => l.billRef?.id)
      .filter((bid): bid is string => !!bid);

    if (billIds.length > 0) {
      await tx.billReference.deleteMany({ where: { id: { in: billIds } } });
    }

    await tx.voucherLine.deleteMany({ where: { voucherId: id } });

    await tx.voucher.update({
      where: { id },
      data: {
        type: data.type,
        date: new Date(data.date),
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
  });

  const updated = await db.voucher.findFirst({
    where: { id, companyId },
    include: { lines: true },
  });

  if (updated) {
    const freshBills = await getCompanyBills(companyId);
    await createBillRefsForLines(
      companyId,
      validation.validLines!,
      updated.lines,
      freshBills
    );
  }

  revalidateAfterVoucherMutation();

  return { success: true, voucherId: id };
}

export async function deleteVoucher(id: string) {
  const { companyId } = await requireCompany();
  const blockCheck = await assertNoBillSettlementBlockers(id, companyId);
  if ("error" in blockCheck && blockCheck.error) {
    return { error: blockCheck.error };
  }

  const voucher = await db.voucher.findFirst({
    where: { id, companyId },
    include: { lines: { include: { billRef: true } } },
  });
  if (!voucher) {
    return { error: "Voucher not found." };
  }

  const billIds = voucher.lines
    .map((l) => l.billRef?.id)
    .filter((bid): bid is string => !!bid);

  await db.$transaction(async (tx) => {
    if (billIds.length > 0) {
      await tx.billReference.deleteMany({ where: { id: { in: billIds } } });
    }
    await tx.voucher.delete({ where: { id } });
  });

  revalidateAfterVoucherMutation();

  return { success: true };
}

export async function getDayBook(sort: "asc" | "desc" = "desc") {
  return getVouchers(sort);
}
