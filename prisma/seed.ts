import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/util/prisma";

async function main() {
  const email = "staff@example.com";
  const existingStaff = await prisma.staff.findUnique({
    where: { email },
  });

  if (!existingStaff) {
    const password_hash = await bcrypt.hash("password", 10);
    const staff = await prisma.staff.create({
      data: {
        name: "Test Staff",
        email,
        password_hash,
        role: "STAFF",
      },
    });
    console.log("Seeded test staff account:", staff.email);
  } else {
    console.log("Test staff account already exists:", existingStaff.email);
  }
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
