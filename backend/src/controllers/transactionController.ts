import { Context } from "hono";
import { TransactionService } from "../services/transactionService";
import { TransactionType } from "@prisma/client";
import { CurrencyType } from "../types/models";

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async getUserAllTransactions(c: Context, userId: number) {
    try {
      if (!userId) {
        return c.json({ error: "User id not found" }, 400);
      }

      const allTransactions =
        await this.transactionService.getUserAllTransactions(userId);
      return c.json(allTransactions);
    } catch (error) {
      console.error("Controller.getUserAllTransactions:", error);
      throw error;
    }
  }

  async addFundsDefaultAccount(
    c: Context,
    userId: number,
    name: string,
    description: string | null,
    amount: number,
    type: TransactionType,
    toAccountId: number,
    customCategoriesId: number[] | null,
    currency: CurrencyType
  ) {
    try {
      if (!userId || !name || !amount || !type || !toAccountId) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      const newFundAccount =
        await this.transactionService.addFundsDefaultAccount(
          userId,
          name,
          description || "",
          amount,
          type,
          toAccountId,
          customCategoriesId,
          currency
        );

      return c.json(newFundAccount);
    } catch (error) {
      console.error("Add funds to default account error:", error);
      return c.json({ error: "Failed to add funds to default account" }, 500);
    }
  }

  async addFundsSaving(
    c: Context,
    userId: number,
    amount: number,
    fromAccountId: number,
    toSavingId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    try {
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

  async addFundsDefault(
    c: Context,
    userId: number,
    amount: number,
    fromSavingId: number,
    toAccountId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    try {
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

  async createExpense(
    c: Context,
    userId: number,
    name: string | null,
    amount: number,
    currency: CurrencyType,
    fromAccountId: number,
    description: string | null,
    customCategoriesId: number[] | null
  ) {
    try {
      if (!userId || !amount || !fromAccountId) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      const expense = await this.transactionService.createExpense(
        amount,
        currency,
        userId,
        name || "",
        fromAccountId,
        description,
        customCategoriesId
      );

      return c.json(expense);
    } catch (error) {
      console.error("Create expense error:", error);
      return c.json({ error: "Failed to create expense" }, 500);
    }
  }

  async transferFundsDefault(
    c: Context,
    userId: number,
    amount: number,
    fromAccountId: number,
    toAccountId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    try {
      if (!userId || !fromAccountId || !toAccountId) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      if (amount <= 0) {
        return c.json({ error: "Amount must be greater than zero" }, 400);
      }

      const defaultTransaction =
        await this.transactionService.transferFundsDefault(
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
      return c.json(
        { error: "Failed to transfer funds to default account" },
        500
      );
    }
  }

  async executeRecurringPayment(
    c: Context,
    userId: number,
    paymentId: number,
    amount: number,
    currency: CurrencyType,
    fromAccountId: number,
    name: string,
    description: string | null,
    customCategoriesId: number[] | null
  ) {
    try {
      if (!userId || !paymentId || !amount || !fromAccountId || !name) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      const transaction = await this.transactionService.executeRecurringPayment(
        userId,
        paymentId,
        amount,
        currency,
        fromAccountId,
        name,
        description,
        customCategoriesId
      );

      return c.json(transaction);
    } catch (error) {
      console.error("Execute recurring payment error:", error);
      return c.json({ error: "Failed to execute recurring payment" }, 500);
    }
  }

  async executeRecurringIncome(
    c: Context,
    userId: number,
    paymentId: number,
    amount: number,
    currency: CurrencyType,
    toAccountId: number,
    name: string,
    description: string | null,
    customCategoriesId: number[] | null
  ) {
    try {
      if (!userId || !paymentId || !amount || !toAccountId || !name) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      const transaction = await this.transactionService.executeRecurringIncome(
        userId,
        paymentId,
        amount,
        currency,
        toAccountId,
        name,
        description,
        customCategoriesId
      );

      return c.json(transaction);
    } catch (error) {
      console.error("Execute recurring income error:", error);
      return c.json({ error: "Failed to execute recurring income" }, 500);
    }
  }
}
