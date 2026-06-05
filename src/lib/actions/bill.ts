"use server";

import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";

export async function getBillIndex(sort: "asc" | "desc" = "asc") {
  const { companyId } = await requireCompany();

  return db.billReference.findMany({
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
}
