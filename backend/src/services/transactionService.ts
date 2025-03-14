import { CurrencyType, PrismaClient, TransactionType } from "@prisma/client";
import { TransactionRepository } from "../repositories/transactionRepository";

export class TransactionService {
  private transactionRepo: TransactionRepository;
  
  constructor() {
    this.transactionRepo = new TransactionRepository();
  }


  async getUserAllTransactions(
    userId : number
  ){
    try {
      const allTransactions = await this.transactionRepo.getUserAllTransactions(
        userId
      )
      console.log("Service layer transactions:", allTransactions);
      return allTransactions
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
    customCategoryId: number | null,
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
        customCategoryId,
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
      console.error(
        "Error in TransactionService.addFundsSaving:",
        error
      );
      throw new Error("Failed to add funds to savings account");
    }
  }

  
}