import type { VoucherType } from "@prisma/client";

export type VoucherTemplateLine = {
  role: string;
  entryType: "Dr" | "Cr";
  groupHint: string;
  ledgerHint: string;
};

export type VoucherTemplate = {
  type: VoucherType;
  title: string;
  description: string;
  lines: VoucherTemplateLine[];
};

/** Nepal-friendly starter templates — Tally Prime style hints for beginners */
export const NEPAL_VOUCHER_TEMPLATES: VoucherTemplate[] = [
  {
    type: "Sales",
    title: "Sales Invoice",
    description:
      "Debit party (customer) or Cash, credit Sales and VAT Payable. Common for VAT-registered businesses in Nepal.",
    lines: [
      { role: "Party / Cash", entryType: "Dr", groupHint: "Sundry Debtors", ledgerHint: "Customer or Cash" },
      { role: "Sales", entryType: "Cr", groupHint: "Sales Accounts", ledgerHint: "Sales" },
      { role: "VAT", entryType: "Cr", groupHint: "Current Liabilities", ledgerHint: "VAT Payable" },
    ],
  },
  {
    type: "Purchase",
    title: "Purchase Bill",
    description:
      "Debit Purchase and VAT Recoverable, credit party (supplier) or Cash/Bank.",
    lines: [
      { role: "Purchase", entryType: "Dr", groupHint: "Purchase Accounts", ledgerHint: "Purchase" },
      { role: "VAT", entryType: "Dr", groupHint: "Current Assets", ledgerHint: "VAT Recoverable" },
      { role: "Party / Cash", entryType: "Cr", groupHint: "Sundry Creditors", ledgerHint: "Supplier or Bank" },
    ],
  },
  {
    type: "Receipt",
    title: "Money Received",
    description: "Debit Cash or Bank, credit customer or income ledger.",
    lines: [
      { role: "Cash / Bank", entryType: "Dr", groupHint: "Cash-in-Hand", ledgerHint: "Cash or Bank" },
      { role: "Party / Income", entryType: "Cr", groupHint: "Sundry Debtors", ledgerHint: "Customer" },
    ],
  },
  {
    type: "Payment",
    title: "Money Paid",
    description: "Debit supplier or expense, credit Cash or Bank.",
    lines: [
      { role: "Party / Expense", entryType: "Dr", groupHint: "Sundry Creditors", ledgerHint: "Supplier or Expense" },
      { role: "Cash / Bank", entryType: "Cr", groupHint: "Bank Accounts", ledgerHint: "Cash or Bank" },
    ],
  },
  {
    type: "Journal",
    title: "Journal Voucher",
    description: "Adjustments, depreciation, or transfers between ledgers.",
    lines: [
      { role: "Debit ledger", entryType: "Dr", groupHint: "Any", ledgerHint: "Select ledger" },
      { role: "Credit ledger", entryType: "Cr", groupHint: "Any", ledgerHint: "Select ledger" },
    ],
  },
  {
    type: "Contra",
    title: "Cash / Bank Transfer",
    description: "Move money between Cash and Bank accounts.",
    lines: [
      { role: "Destination", entryType: "Dr", groupHint: "Bank Accounts", ledgerHint: "Bank or Cash" },
      { role: "Source", entryType: "Cr", groupHint: "Cash-in-Hand", ledgerHint: "Cash or Bank" },
    ],
  },
];

export function getTemplateForType(type: VoucherType) {
  return NEPAL_VOUCHER_TEMPLATES.find((t) => t.type === type);
}
