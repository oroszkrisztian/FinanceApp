import { CurrencyType, PrismaClient, TransactionType } from "@prisma/client";
import { TransactionRepository } from "../repositories/transactionRepository";

export class TransactionService {
  private transactionRepo: TransactionRepository;

  constructor() {
    this.transactionRepo = new TransactionRepository();
  }

  async getUserAllTransactions(userId: number) {
    try {
      const allTransactions =
        await this.transactionRepo.getUserAllTransactions(userId);

      return allTransactions;
    } catch (error) {
      console.error(
        "Error in TransactionService.getUserAllTransactions:",
        error
      );
      throw new Error("Failed to add funds to default account");
    }
  }

  async addFundsDefaultAccount(
    userId: number,
    name: string,
    description: string,
    amount: number,
    type: TransactionType,
    toAccountId: number,
    customCategoriesId: number[] | null,
    currency: CurrencyType
  ) {
    try {
      const newFundAccount = await this.transactionRepo.addFundsDefaultAccount(
        userId,
        name,
        description,
        amount,
        type,
        toAccountId,
        customCategoriesId,
        currency
      );
      return newFundAccount;
    } catch (error) {
      console.error(
        "Error in TransactionService.addFundsDefaultAccount:",
        error
      );
      throw new Error("Failed to add funds to default account");
    }
  }

  async addFundsSaving(
    userId: number,
    amount: number,
    fromAccountId: number,
    toSavingId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    try {
      const savingTransaction = await this.transactionRepo.addFundsSaving(
        userId,
        amount,
        fromAccountId,
        toSavingId,
        type,
        currency
      );
      return savingTransaction;
    } catch (error) {
      console.error("Error in TransactionService.addFundsSaving:", error);
      throw new Error("Failed to add funds to savings account");
    }
  }

  async addFundsDefault(
    userId: number,
    amount: number,
    fromSavingId: number,
    toAccountId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    try {
      const defaultTransaction = await this.transactionRepo.addFundsDefault(
        userId,
        amount,
        fromSavingId,
        toAccountId,
        type,
        currency
      );
      return defaultTransaction;
    } catch (error) {
      console.error("Error in TransactionService.addFundsDefault:", error);
      throw new Error("Failed to add funds to default account");
    }
  }

  async createExpense(
    amount: number,
    currency: CurrencyType,
    userId: number,
    name: string,
    fromAccountId: number,
    budgetId: number | null,
    description: string | null,
    customCategoriesId: number[] | null
  ) {
    try {
      const expenseTransaction = await this.transactionRepo.createExpense(
        amount,
        currency,
        userId,
        name,
        fromAccountId,
        budgetId,
        description,
        customCategoriesId
      );
      return expenseTransaction;
    } catch (error) {
      console.error("Error in TransactionService.createExpense:", error);
      throw new Error("Failed to create expense");
    }
  }

  async transferFundsDefault(
    userId: number,
    amount: number,
    fromAccountId: number,
    toAccountId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    try {
      const transferTransaction =
        await this.transactionRepo.transferFundsDefault(
          userId,
          amount,
          fromAccountId,
          toAccountId,
          type,
          currency
        );
      return transferTransaction;
    } catch (error) {
      console.error("Error in TransactionService.trasnferFundsDefault:", error);
      throw new Error("Failed to transfer funds");
    }
  }
  async executeRecurringPayment(
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
      const transaction = await this.transactionRepo.executeRecurringPayment(
        userId,
        paymentId,
        amount,
        currency,
        fromAccountId,
        name,
        description,
        customCategoriesId
      );
      return transaction;
    } catch (error) {
      console.error(
        "Error in TransactionService.executeRecurringPayment:",
        error
      );
      throw new Error("Failed to execute recurring payment");
    }
  }

  async executeRecurringIncome(
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
      const transaction = await this.transactionRepo.executeRecurringIncome(
        userId,
        paymentId,
        amount,
        currency,
        toAccountId,
        name,
        description,
        customCategoriesId
      );
      return transaction;
    } catch (error) {
      console.error(
        "Error in TransactionService.executeRecurringIncome:",
        error
      );
      throw new Error("Failed to execute recurring income");
    }
  }
}
