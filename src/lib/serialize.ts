import type { Company, Ledger, LedgerGroup } from "@prisma/client";

export type SerializedLedgerWithGroup = Omit<
  Ledger,
  "openingBalance" | "createdAt" | "updatedAt"
> & {
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
  group: Omit<LedgerGroup, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  };
};

export type SerializedCompany = Omit<
  Company,
  "booksBeginDate" | "createdAt" | "updatedAt"
> & {
  booksBeginDate: string;
  createdAt: string;
  updatedAt: string;
};

export function serializeLedgerForClient(
  ledger: Ledger & { group: LedgerGroup }
): SerializedLedgerWithGroup {
  return {
    ...ledger,
    openingBalance: Number(ledger.openingBalance),
    createdAt: ledger.createdAt.toISOString(),
    updatedAt: ledger.updatedAt.toISOString(),
    group: {
      ...ledger.group,
      createdAt: ledger.group.createdAt.toISOString(),
      updatedAt: ledger.group.updatedAt.toISOString(),
    },
  };
}

export function serializeCompanyForClient(company: Company): SerializedCompany {
  return {
    ...company,
    booksBeginDate: company.booksBeginDate.toISOString(),
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}
