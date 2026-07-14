/** Pre-seeded ledger names for VAT auto-lines and company creation */
export const NEPAL_STARTER_LEDGERS: {
  name: string;
  groupName: string;
  openingType: "Dr" | "Cr";
}[] = [
  { name: "Cash", groupName: "Cash-in-Hand", openingType: "Dr" },
  { name: "Bank", groupName: "Bank Accounts", openingType: "Dr" },
  { name: "VAT Payable", groupName: "Current Liabilities", openingType: "Cr" },
  { name: "VAT Recoverable", groupName: "Current Assets", openingType: "Dr" },
  { name: "Sales", groupName: "Sales Accounts", openingType: "Cr" },
  { name: "Purchase", groupName: "Purchase Accounts", openingType: "Dr" },
];
