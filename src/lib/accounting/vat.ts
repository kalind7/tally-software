export const VAT_RATE = 0.13;

export type VatMode = "sales" | "purchase";

export type VatSplit = {
  taxable: number;
  vat: number;
  total: number;
};

/** Round to 2 decimal places (NPR). */
export function roundNpr(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Split a taxable amount into taxable + 13% VAT. */
export function splitVatFromTaxable(taxable: number): VatSplit {
  const vat = roundNpr(taxable * VAT_RATE);
  return {
    taxable: roundNpr(taxable),
    vat,
    total: roundNpr(taxable + vat),
  };
}

/** Derive taxable amount from a gross (tax-inclusive) total. */
export function splitVatFromGross(gross: number): VatSplit {
  const taxable = roundNpr(gross / (1 + VAT_RATE));
  const vat = roundNpr(gross - taxable);
  return { taxable, vat, total: roundNpr(gross) };
}

export type VatLineSpec = {
  ledgerRole: "party" | "sales" | "purchase" | "vatPayable" | "vatRecoverable";
  entryType: "Dr" | "Cr";
  amount: number;
};

/** Build balanced voucher line specs for Sales or Purchase with 13% VAT. */
export function buildVatLines(taxable: number, mode: VatMode): VatLineSpec[] {
  const { taxable: t, vat, total } = splitVatFromTaxable(taxable);

  if (mode === "sales") {
    return [
      { ledgerRole: "party", entryType: "Dr", amount: total },
      { ledgerRole: "sales", entryType: "Cr", amount: t },
      { ledgerRole: "vatPayable", entryType: "Cr", amount: vat },
    ];
  }

  return [
    { ledgerRole: "purchase", entryType: "Dr", amount: t },
    { ledgerRole: "vatRecoverable", entryType: "Dr", amount: vat },
    { ledgerRole: "party", entryType: "Cr", amount: total },
  ];
}
