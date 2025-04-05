import { PrismaClient, CurrencyType } from "@prisma/client";

export class BudgetRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAllBudgets(userId: number) {
    const allBudgets = await this.prisma.budget.findMany({
      where: {
        userId: userId,
      },
      include: {
        customCategories: {
          select: {
            customCategory: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return allBudgets.map((budget) => ({
      ...budget,
      customCategories: budget.customCategories.map((bc) => bc.customCategory),
    }));
  }

  async createUserBudgetWithCategories(
    userId: number,
    name: string,
    limitAmount: number,
    currency: CurrencyType,
    categoryIds: number[]
  ) {
    const budget = await this.prisma.budget.create({
      data: {
        name,
        limitAmount,
        currentSpent: 0,
        userId,
        currency,
      },
    });

    if (categoryIds && categoryIds.length > 0) {
      await this.prisma.budgetCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          budgetId: budget.id,
          customCategoryId: categoryId,
        })),
      });
    }

    return await this.prisma.budget.findUnique({
      where: { id: budget.id },
      include: {
        customCategories: {
          include: {
            customCategory: true,
          },
        },
      },
    });
  }
}
