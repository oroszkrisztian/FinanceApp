import { PrismaClient, CurrencyType } from "@prisma/client";
import { TransactionRepository } from "./transactionRepository";

export class BudgetRepository {
  private prisma: PrismaClient;
  private transactionRepo: TransactionRepository;

  constructor() {
    this.prisma = new PrismaClient();
    this.transactionRepo = new TransactionRepository();
  }

  async getAllBudgets(userId: number) {
    const allBudgets = await this.prisma.budget.findMany({
      where: {
        userId: userId,
      },
      include: {
        budgetCategories: {
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
      customCategories: budget.budgetCategories.map((bc) => bc.customCategory),
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
        budgetCategories: {
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
  }

  async deleteUserBudget(userId: number, budgetId: number) {
    return await this.prisma.budget.update({
      where: {
        id: budgetId,
        userId: userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async updateUserBudget(
    userId: number,
    budgetId: number,
    name: string,
    limitAmount: number,
    currency: CurrencyType,
    categoryIds: number[]
  ) {
    const existingBudget = await this.prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: userId,
      },
    });

    if (!existingBudget) {
      throw new Error("Budget not found or doesn't belong to the user");
    }

    let updatedCurrentSpent = existingBudget.currentSpent;

    if (existingBudget.currency !== currency) {
      const rates = await this.transactionRepo.getExchangeRates();

      if (!rates[existingBudget.currency] || !rates[currency]) {
        throw new Error(
          `Exchange rate not found for conversion between ${existingBudget.currency} and ${currency}`
        );
      }

      updatedCurrentSpent =
        existingBudget.currentSpent *
        (rates[existingBudget.currency] / rates[currency]);
    }

    const updatedBudget = await this.prisma.budget.update({
      where: {
        id: budgetId,
        userId: userId,
      },
      data: {
        name,
        limitAmount,
        currency,
        currentSpent: updatedCurrentSpent,
      },
    });

    // Update budget categories
    await this.prisma.budgetCategory.deleteMany({
      where: { budgetId },
    });

    if (categoryIds && categoryIds.length > 0) {
      await this.prisma.budgetCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          budgetId: updatedBudget.id,
          customCategoryId: categoryId,
        })),
      });
    }

    return await this.prisma.budget.findUnique({
      where: { id: updatedBudget.id },
      include: {
        budgetCategories: {
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
  }
}
