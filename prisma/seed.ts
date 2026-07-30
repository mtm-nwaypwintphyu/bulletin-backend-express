import bcrypt from "bcrypt";
import prisma from "../src/config/prisma";
import { UserType } from "@prisma/client";

async function main() {
  const email = "superadmin@mail.com";

  const existingAdmin = await prisma.user.findUnique({ where: { email } });

  if (existingAdmin) {
    console.log("Super admin already exist");
    return;
  }

  const hashedPassword = await bcrypt.hash("Admin123", 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: email,
      password: hashedPassword,
      type: UserType.ADMIN,
      phone: "09123456789",
      address: "System",
      createUserId: 1,
      updatedUserId: 1,
    },
  });

  console.log("Superadmin seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
