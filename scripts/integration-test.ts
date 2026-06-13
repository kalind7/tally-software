import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma-client";
import { seedLedgerGroupsForCompany } from "../src/lib/groups";
import { getCompaniesForUser } from "../src/lib/access";

const prisma = createPrismaClient();

async function main() {
  const results: string[] = [];

  const admin = await prisma.user.findUnique({
    where: { email: "admin@tallyco.local" },
  });
  results.push(
    admin?.role === "ADMIN"
      ? "PASS: Admin user has ADMIN role"
      : `FAIL: Admin role is ${admin?.role}`
  );

  const userA = await prisma.user.create({
    data: {
      email: `usera-${Date.now()}@test.local`,
      passwordHash: "x",
      role: "USER",
    },
  });
  const userB = await prisma.user.create({
    data: {
      email: `userb-${Date.now()}@test.local`,
      passwordHash: "x",
      role: "USER",
    },
  });

  const companyA = await prisma.company.create({
    data: {
      name: "User A Co",
      booksBeginDate: new Date(),
      ownerId: userA.id,
    },
  });
  await seedLedgerGroupsForCompany(companyA.id);

  const companyB = await prisma.company.create({
    data: {
      name: "User B Co",
      booksBeginDate: new Date(),
      ownerId: userB.id,
    },
  });
  await seedLedgerGroupsForCompany(companyB.id);

  const aCompanies = await getCompaniesForUser(userA.id, "USER");
  const bCompanies = await getCompaniesForUser(userB.id, "USER");
  const adminCompanies = await getCompaniesForUser(admin!.id, "ADMIN");

  results.push(
    aCompanies.length === 1 && aCompanies[0].id === companyA.id
      ? "PASS: User A sees only own company"
      : `FAIL: User A sees ${aCompanies.length} companies`
  );
  results.push(
    bCompanies.length === 1 && bCompanies[0].id === companyB.id
      ? "PASS: User B sees only own company"
      : `FAIL: User B sees ${bCompanies.length} companies`
  );
  results.push(
    adminCompanies.length >= 2
      ? `PASS: Admin sees ${adminCompanies.length} companies`
      : "FAIL: Admin cannot see all companies"
  );

  const ledgerCount = await prisma.ledger.count({ where: { companyId: companyA.id } });
  results.push(
    ledgerCount === 6
      ? "PASS: Nepal starter chart has 6 ledgers"
      : `FAIL: Expected 6 starter ledgers, got ${ledgerCount}`
  );

  await prisma.company.deleteMany({
    where: { id: { in: [companyA.id, companyB.id] } },
  });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });

  console.log("\n=== Access & Voucher-First Test Results ===");
  results.forEach((r) => console.log(r));
  console.log("===========================================\n");

  if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
