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
    });

    console.log("Budgets found repo:", allBudgets);
    return allBudgets;
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

  async getBudgetWithCategories(budgetId: number) {
    return await this.prisma.budget.findUnique({
      where: { id: budgetId },
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
