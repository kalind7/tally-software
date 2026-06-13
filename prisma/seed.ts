import "dotenv/config";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../src/lib/prisma-client";

const prisma = createPrismaClient();

async function main() {
  const email = "admin@tallyco.local";
  let admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    admin = await prisma.user.create({
      data: {
        email,
        name: "Admin",
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log("Created admin user: admin@tallyco.local / admin123");
  } else if (admin.role !== "ADMIN") {
    admin = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    console.log("Updated existing user to ADMIN role.");
  } else {
    console.log("Admin user already exists.");
  }

  const orphaned = await prisma.company.updateMany({
    where: { ownerId: null },
    data: { ownerId: admin.id },
  });
  if (orphaned.count > 0) {
    console.log(`Assigned ${orphaned.count} legacy company(ies) to admin.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
