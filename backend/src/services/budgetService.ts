import { CurrencyType } from "@prisma/client";
import { BudgetRepository } from "../repositories/budgetRepository";

export class BudgetService {
  private budgetRepository: BudgetRepository;

  constructor() {
    this.budgetRepository = new BudgetRepository();
  }

  async getAllBudgets(userId: number) {
    try {
      return await this.budgetRepository.getAllBudgets(userId);
    } catch (error) {
      console.log("Error in BudgetService.getAllBudgets:", error);
      throw new Error("Failed to get budgets");
    }
  }

  async createUserBudgetWithCategories(
    userId: number,
    name: string,
    limitAmount: number,
    currency: CurrencyType,
    categoryIds: number[]
  ) {
    try {
      return await this.budgetRepository.createUserBudgetWithCategories(
        userId,
        name,
        limitAmount,
        currency,
        categoryIds
      );
    } catch (error) {
      console.log(
        "Error in BudgetService.createUserBudgetWithCategories:",
        error
      );
      throw new Error("Failed to create budget");
    }
  }

  async deleteUserBudget(userId: number, budgetId: number) {
    try {
      return await this.budgetRepository.deleteUserBudget(userId, budgetId);
    } catch (error) {
      console.log("Error in BudgetService.deleteUserBudget:", error);
      throw new Error("Failed to delete budget");
    }
  }

  async updateUserBudget(
    userId: number,
    budgetId: number,
    name: string,
    limitAmount: number,
    currency: CurrencyType,
    categoryIds: number[]
  ) {
    try {
      return await this.budgetRepository.updateUserBudget(
        userId,
        budgetId,
        name,
        limitAmount,
        currency,
        categoryIds
      );
    } catch (error) {
      console.log("Error in BudgetService.updateUserBudget:", error);
      throw new Error("Failed to update budget");
    }
  }
}
