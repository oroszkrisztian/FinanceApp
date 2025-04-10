import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default system categories
  const defaultCategories = [
    { name: 'Food & Drinks', type: CategoryType.SYSTEM },
    { name: 'Shopping', type: CategoryType.SYSTEM },
    { name: 'Housing', type: CategoryType.SYSTEM },
    { name: 'Transportation', type: CategoryType.SYSTEM },
    { name: 'Entertainment', type: CategoryType.SYSTEM },
    { name: 'Healthcare', type: CategoryType.SYSTEM },
    { name: 'Utilities', type: CategoryType.SYSTEM },
    { name: 'Salary', type: CategoryType.SYSTEM },
    { name: 'Investment', type: CategoryType.SYSTEM },
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
