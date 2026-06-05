import "dotenv/config";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../src/lib/prisma-client";

const prisma = createPrismaClient();

async function main() {
  const email = "admin@tallyco.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email,
        name: "Admin",
        passwordHash,
      },
    });
    console.log("Created demo user: admin@tallyco.local / admin123");
  } else {
    console.log("Demo user already exists.");
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
