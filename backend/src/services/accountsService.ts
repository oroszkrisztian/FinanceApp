import { AccountType, CurrencyType } from "@prisma/client";
import { AccountsRepository } from "../repositories/accountsRepository";

export class AccountsService {
  private accountRepo: AccountsRepository;

  constructor() {
    this.accountRepo = new AccountsRepository();
  }

  async getDefaultAccounts(userId: number) {
    const accounts = await this.accountRepo.getUserDefaultAccounts(userId);
    return accounts;
  }

  async getSavingAccounts(userId: number) {
    const savingAccounts = await this.accountRepo.getUserSavingAccounts(userId);
    return savingAccounts;
  }

  async createDefaultAccount(
    userId: number,
    accountType: AccountType,
    currencyType: CurrencyType,
    name: string,
    description: string
  ) {
    try {
      const newDefaultAccount = this.accountRepo.createDefaultAccount(
        userId,
        accountType,
        currencyType,
        name,
        description
      );
      return newDefaultAccount;
    } catch (error) {
      console.error("Error in AccountsService.createDefaultAccount:", error);
      throw new Error("Failed to create default account");
    }
  }

  async createSavingAccount(
    userId: number,
    accountType: AccountType,
    currencyType: CurrencyType,
    name: string,
    description: string,
    targetAmount: number,
    targetDate: Date
  ) {
    try {
      const newDefaultAccount = this.accountRepo.createSavingAccount(
        userId,
        accountType,
        currencyType,
        name,
        description,
        targetAmount,
        targetDate
      );
      return newDefaultAccount;
    } catch (error) {
      console.error("Error in AccountsService.createSavingAccount:", error);
      throw new Error("Failed to create saving account");
    }
  }

  async searchAccountByString(userId: number, searchString: string) {
    try {
      const accounts = await this.accountRepo.searchAccountByString(
        userId,
        searchString
      );
      return accounts;
    } catch (error) {
      console.error("Error in AccountsService.searchAccountByString:", error);
      throw new Error("Failed to search accounts");
    }
  }
}
