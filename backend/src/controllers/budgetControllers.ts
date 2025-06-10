import { Context } from "hono";
import { BudgetService } from "../services/budgetService";
import { CurrencyType } from "@prisma/client";

export class BudgetController {
  private budgetService: BudgetService;

  constructor() {
    this.budgetService = new BudgetService();
  }

  async getAllBudgets(c: Context, userId: number) {
    try {
      if (!userId) {
        throw "User id not found";
      }
      const budgets = await this.budgetService.getAllBudgets(userId);
      return budgets;
    } catch (error) {
      console.error("Get budgets error:", error);
      return c.json({ error: "Failed to get budgets" }, 500);
    }
  }

  async createUserBudgetWithCategories(
    c: Context,
    userId: number,
    name: string,
    limitAmount: number,
    currency: CurrencyType,
    categoryIds: number[]
  ) {
    try {
      if (!userId) {
        throw "User id not found";
      }
      const budget = await this.budgetService.createUserBudgetWithCategories(
        userId,
        name,
        limitAmount,
        currency,
        categoryIds
      );
      return c.json(budget);
    } catch (error) {
      console.error("Create budget error:", error);
      return c.json({ error: "Failed to create budget" }, 500);
    }
  }

  async deleteUserBudget(c: Context, userId: number, budgetId: number) {
    try {
      if (!userId) {
        throw "User id not found";
      }
      const budget = await this.budgetService.deleteUserBudget(
        userId,
        budgetId
      );
      return c.json(budget);
    } catch (error) {
      console.error("Delete budget error:", error);
      return c.json({ error: "Failed to delete budget" }, 500);
    }
  }

  async updateUserBudget(
    c: Context,
    userId: number,
    budgetId: number,
    name: string,
    limitAmount: number,
    currency: CurrencyType,
    categoryIds: number[]
  ) {
    try {
      if (!userId) {
        throw "User id not found";
      }
      const budget = await this.budgetService.updateUserBudget(
        userId,
        budgetId,
        name,
        limitAmount,
        currency,
        categoryIds
      );
      return c.json(budget);
    } catch (error) {
      console.error("Update budget error:", error);
      return c.json({ error: "Failed to update budget" }, 500);
    }
  }
}
