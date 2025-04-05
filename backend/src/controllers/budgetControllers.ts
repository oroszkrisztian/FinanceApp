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
      // Return the budgets directly instead of wrapping them in another json response
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

  async getCategoriesByBudgetId(c: Context, budgetId: number) {
    try {
      if (!budgetId) {
        throw "Budget id not found";
      }
      const categories =
        await this.budgetService.getCategoriesByBudgetId(budgetId);
      return c.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      return c.json({ error: "Failed to get categories" }, 500);
    }
  }
}
