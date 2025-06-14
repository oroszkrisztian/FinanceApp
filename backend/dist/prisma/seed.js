"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const defaultCategories = [
        { name: 'Food & Drinks', type: client_1.CategoryType.SYSTEM },
        { name: 'Shopping', type: client_1.CategoryType.SYSTEM },
        { name: 'Housing', type: client_1.CategoryType.SYSTEM },
        { name: 'Transportation', type: client_1.CategoryType.SYSTEM },
        { name: 'Entertainment', type: client_1.CategoryType.SYSTEM },
        { name: 'Healthcare', type: client_1.CategoryType.SYSTEM },
        { name: 'Utilities', type: client_1.CategoryType.SYSTEM },
        { name: 'Salary', type: client_1.CategoryType.SYSTEM },
        { name: 'Investment', type: client_1.CategoryType.SYSTEM },
    ];
    for (const category of defaultCategories) {
        await prisma.customCategory.upsert({
            where: {
                name_type: {
                    name: category.name,
                    type: category.type,
                },
            },
            update: {},
            create: category,
        });
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
//# sourceMappingURL=seed.js.map