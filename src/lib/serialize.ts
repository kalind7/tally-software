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
  owner?: { id: string; name: string | null; email: string } | null;
};

export type SerializedLedgerGroup = Omit<
  LedgerGroup,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export function serializeLedgerGroupForClient(
  group: LedgerGroup
): SerializedLedgerGroup {
  return {
    id: group.id,
    companyId: group.companyId,
    name: group.name,
    parentId: group.parentId,
    nature: group.nature,
    isPrimary: group.isPrimary,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export function serializeLedgerForClient(
  ledger: Ledger & { group: LedgerGroup; voucherLines?: unknown }
): SerializedLedgerWithGroup {
  const { group } = ledger;
  return {
    id: ledger.id,
    companyId: ledger.companyId,
    groupId: ledger.groupId,
    name: ledger.name,
    openingType: ledger.openingType,
    openingBalance: Number(ledger.openingBalance),
    createdAt: ledger.createdAt.toISOString(),
    updatedAt: ledger.updatedAt.toISOString(),
    group: {
      id: group.id,
      companyId: group.companyId,
      name: group.name,
      parentId: group.parentId,
      nature: group.nature,
      isPrimary: group.isPrimary,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    },
  };
}

export function serializeCompanyForClient(
  company: Company & { owner?: { id: string; name: string | null; email: string } | null }
): SerializedCompany {
  return {
    ...company,
    booksBeginDate: company.booksBeginDate.toISOString(),
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}
