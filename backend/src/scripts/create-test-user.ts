import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // First, clean up any existing test user
    await prisma.user.deleteMany({
      where: {
        OR: [{ username: "testuser" }, { email: "test@test.com" }],
      },
    });

    // Create new test user
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
      password: "[HASHED]", // Don't log the actual hash
    });
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
