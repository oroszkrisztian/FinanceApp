import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    await prisma.user.deleteMany({
      where: {
        OR: [{ username: "testuser" }, { email: "test@test.com" }],
      },
    });

    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        firstName: "Test",
        lastName: "User",
        username: "testuser",
        email: "test@test.com",
        password: hashedPassword,
      },
    });

    console.log("Test user created successfully:", {
      ...user,
      password: "[HASHED]", 
    });
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
