import { Context } from "hono";
import { TransactionService } from "../services/transactionService";
import { TransactionType } from "@prisma/client";

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async getUserAllTransactions(c: Context) {
    try {
      const { userId } = await c.req.json();
      if (!userId) {
        return c.json({ error: "User id not found" }, 400);
      }

      const allTransactions =
        await this.transactionService.getUserAllTransactions(userId);

     

      return allTransactions;
    } catch (error) {
      console.error("Controller.getUserAllTransactions:", error);
      throw error;
    }
  }

  async addFundsDefaultAccount(c: Context) {
    try {
      const {
        userId,
        name,
        description,
        amount,
        type,
        toAccountId,
        customCategoryId,
        currency,
      } = await c.req.json();

      if (!userId || !name || !amount || !type || !toAccountId) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      const newFundAccount =
        await this.transactionService.addFundsDefaultAccount(
          userId,
          name,
          description,
          amount,
          type,
          toAccountId,
          customCategoryId,
          currency
        );

      return c.json(newFundAccount);
    } catch (error) {
      console.error("Add funds to default account error:", error);
      return c.json({ error: "Failed to add funds to default account" }, 500);
    }
  }

  async addFundsSaving(c: Context) {
    try {
      const { userId, amount, fromAccountId, toSavingId, type, currency } =
        await c.req.json();

      if (!userId || !fromAccountId || !toSavingId) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      if (amount <= 0) {
        return c.json({ error: "Amount must be greater than zero" }, 400);
      }

      const savingTransaction = await this.transactionService.addFundsSaving(
        userId,
        amount,
        fromAccountId,
        toSavingId,
        type || TransactionType.TRANSFER,
        currency
      );

      return c.json(savingTransaction);
    } catch (error) {
      console.error("Add funds to saving account error:", error);
      return c.json({ error: "Failed to add funds to saving account" }, 500);
    }
  }

  async addFundsDefault(c: Context) {
    try {
      const { userId, amount, fromSavingId, toAccountId, type, currency } =
        await c.req.json();

      if (!userId || !fromSavingId || !toAccountId) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      if (amount <= 0) {
        return c.json({ error: "Amount must be greater than zero" }, 400);
      }

      const defaultTransaction = await this.transactionService.addFundsDefault(
        userId,
        amount,
        fromSavingId,
        toAccountId,
        type || TransactionType.TRANSFER,
        currency
      );

      return c.json(defaultTransaction);
    } catch (error) {
      console.error("Add funds to default account error:", error);
      return c.json({ error: "Failed to add funds to default account" }, 500);
    }
  }

  async createExpense(c: Context) { 
    try {
      const {
        amount,
        currency,
        userId,
        name,
        fromAccountId,
        budgetId,
        description,
      } = await c.req.json();

      if (!userId || !amount || !fromAccountId) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      const expense = await this.transactionService.createExpense(
        amount,
        currency,
        userId,
        name,
        fromAccountId,
        budgetId,
        description
      );

      return c.json(expense);
    } catch (error) {
      console.error("Create expense error:", error);
      return c.json({ error: "Failed to create expense" }, 500);
    }
  }

  async transferFundsDefault(c: Context) {
    try {
      const { userId, amount, fromAccountId, toAccountId, type, currency } =
        await c.req.json();

      if (!userId || !fromAccountId || !toAccountId) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      if (amount <= 0) {
        return c.json({ error: "Amount must be greater than zero" }, 400);
      }

      const defaultTransaction = await this.transactionService.transferFundsDefault(
        userId,
        amount,
        fromAccountId,
        toAccountId,
        type || TransactionType.TRANSFER,
        currency
      );

      return c.json(defaultTransaction);
    } catch (error) {
      console.error("Transfer funds to default account error:", error);
      return c.json({ error: "Failed to transfer funds to default account" }, 500);
    }
  }

}
