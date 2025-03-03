import { PrismaClient, TransactionType } from "@prisma/client";
import { TransactionRepository } from "../repositories/transactionRepository";

export class TransactionService {
  private transactionRepo: TransactionRepository;
  
  constructor() {
    this.transactionRepo = new TransactionRepository();
  }
  
  async addFundsDefaultAccount(
    userId: number,
    name: string,
    description: string,
    amount: number,
    type: TransactionType,
    toAccountId: number,
    customCategoryId: number | null
  ) {
    try {
      const newFundAccount = await this.transactionRepo.addFundsDefaultAccount(
        userId,
        name,
        description,
        amount,
        type,
        toAccountId,
        customCategoryId
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

  async fetchDefaultAccountBalance(userId: number, accountId: number) {
    try {
      const balance = await this.transactionRepo.fetchDefaultAccountBalance(
        userId,
        accountId
      );
      return balance;
    } catch (error) {
      console.error(
        "Error in TransactionService.fetchDefaultAccountBalance:",
        error
      );
      throw new Error("Failed to fetch default account balance");
    }
  }
}