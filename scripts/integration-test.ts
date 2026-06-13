import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma-client";
import { seedLedgerGroupsForCompany } from "../src/lib/groups";
import { validateVoucherLines } from "../src/lib/accounting/voucher";
import { formatAmount } from "../src/lib/accounting/ledger-balance";

const prisma = createPrismaClient();

async function main() {
  const results: string[] = [];

  // 1. Company + seed: groups only, no default Cash ledger
  const company = await prisma.company.create({
    data: {
      name: `Test Co ${Date.now()}`,
      booksBeginDate: new Date(),
      currency: "NPR",
    },
  });
  await seedLedgerGroupsForCompany(company.id);
  const ledgerCount = await prisma.ledger.count({ where: { companyId: company.id } });
  results.push(
    ledgerCount === 0
      ? "PASS: New company has 0 ledgers (no default Cash)"
      : `FAIL: Expected 0 ledgers, got ${ledgerCount}`
  );

  // 2. Create two ledgers for voucher test
  const cashGroup = await prisma.ledgerGroup.findFirst({
    where: { companyId: company.id, name: "Cash-in-Hand" },
  });
  const capitalGroup = await prisma.ledgerGroup.findFirst({
    where: { companyId: company.id, name: "Capital Account" },
  });
  if (!cashGroup || !capitalGroup) throw new Error("Missing seed groups");

  const drLedger = await prisma.ledger.create({
    data: { companyId: company.id, groupId: cashGroup.id, name: "Test Cash", openingBalance: 0, openingType: "Dr" },
  });
  const crLedger = await prisma.ledger.create({
    data: { companyId: company.id, groupId: capitalGroup.id, name: "Test Capital", openingBalance: 0, openingType: "Cr" },
  });

  // 3. Voucher validation
  const validation = validateVoucherLines([
    { ledgerId: drLedger.id, amount: 1000, entryType: "Dr" },
    { ledgerId: crLedger.id, amount: 1000, entryType: "Cr" },
  ]);
  results.push(
    validation.valid
      ? "PASS: Balanced voucher validation"
      : `FAIL: Voucher validation - ${validation.error}`
  );

  // 4. NPR formatting
  const formatted = formatAmount(1234.5);
  results.push(
    formatted.includes("1,234.50") || formatted.includes("Rs")
      ? `PASS: NPR format -> ${formatted}`
      : `FAIL: Unexpected format -> ${formatted}`
  );

  // 5. Create voucher in DB
  if (validation.valid && validation.validLines) {
    const voucher = await prisma.voucher.create({
      data: {
        companyId: company.id,
        type: "Journal",
        number: `JRN-TEST-${Date.now()}`,
        date: new Date(),
        lines: {
          create: validation.validLines.map((line) => ({
            ledgerId: line.ledgerId,
            amount: line.amount,
            entryType: line.entryType,
          })),
        },
      },
    });
    results.push(`PASS: Voucher created (${voucher.id})`);
  }

  // Cleanup
  await prisma.voucher.deleteMany({ where: { companyId: company.id } });
  await prisma.company.delete({ where: { id: company.id } });

  console.log("\n=== Integration Test Results ===");
  results.forEach((r) => console.log(r));
  console.log("================================\n");

  const failed = results.filter((r) => r.startsWith("FAIL"));
  if (failed.length > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
