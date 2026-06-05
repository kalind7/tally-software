import type { BalanceType, EntryType } from "@prisma/client";

export type LedgerMovement = {
  openingBalance: number;
  openingType: BalanceType;
  drTotal: number;
  crTotal: number;
};

export function getSignedBalance({
  openingBalance,
  openingType,
  drTotal,
  crTotal,
}: LedgerMovement) {
  const opening =
    openingType === "Dr" ? Number(openingBalance) : -Number(openingBalance);
  const net = opening + drTotal - crTotal;

  if (net >= 0) {
    return { dr: net, cr: 0, signed: net };
  }
  return { dr: 0, cr: Math.abs(net), signed: net };
}

export function sumMovements(
  lines: { amount: number | string | { toString(): string }; entryType: EntryType }[]
) {
  const drTotal = lines
    .filter((l) => l.entryType === "Dr")
    .reduce((s, l) => s + Number(l.amount), 0);
  const crTotal = lines
    .filter((l) => l.entryType === "Cr")
    .reduce((s, l) => s + Number(l.amount), 0);
  return { drTotal, crTotal };
}

export function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
