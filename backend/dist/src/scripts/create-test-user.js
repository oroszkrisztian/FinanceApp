"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function createTestUser() {
    try {
        await prisma.user.deleteMany({
            where: {
                OR: [{ username: "testuser" }, { email: "test@test.com" }],
            },
        });
        const hashedPassword = await bcryptjs_1.default.hash("password123", 10);
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
    }
    catch (error) {
        console.error("Error creating test user:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createTestUser();
//# sourceMappingURL=create-test-user.js.map