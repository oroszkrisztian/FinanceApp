import { Context } from "hono";
import { AccountsService } from "../services/accountsService";
import { AccountType, CurrencyType } from "@prisma/client";

export class AccountsController {
  private accountService: AccountsService;
  constructor() {
    this.accountService = new AccountsService();
  }

  async getDefaultAccounts(c: Context, userId: number) {
    try {
      if (!userId) {
        throw "User id not found";
      }
      const accounts = await this.accountService.getDefaultAccounts(userId);
      return c.json(accounts);
    } catch (error) {
      console.error("Get accounts error:", error);
    }
  }

  async getSavingAccounts(c: Context, userId: number) {
    try {
      if (!userId) {
        throw "User id not found";
      }
      const savingAccounts =
        await this.accountService.getSavingAccounts(userId);
      return c.json(savingAccounts);
    } catch (error) {
      console.error("Get savingAccounts error:", error);
    }
  }

  async createDEfaultAccount(
    c: Context,
    userId: number,
    accountType: AccountType,
    currencyType: CurrencyType,
    name: string,
    description: string
  ) {
    if (!accountType || !currencyType || !name) {
      throw "Fill all necessary fields";
    } else if (!userId) {
      throw "User id not found";
    }

    try {
      const account = await this.accountService.createDefaultAccount(
        userId,
        accountType,
        currencyType,
        name,
        description
      );
      return c.json(account);
    } catch (error) {
      console.error("Create default account error:", error);
    }
  }

  async createSavingAccount(
    c: Context,
    userId: number,
    accountType: AccountType,
    currencyType: CurrencyType,
    name: string,
    description: string,
    targetAmount: number,
    targetDate: Date
  ) {
    if (!accountType || !currencyType || !name) {
      throw "Fill all necessary fields";
    } else if (!userId) {
      throw "User id not found";
    }

    try {
      const account = await this.accountService.createSavingAccount(
        userId,
        accountType,
        currencyType,
        name,
        description,
        targetAmount,
        targetDate
      );
      return c.json(account);
    } catch (error) {
      console.error("Create saving account error:", error);
    }
  }

  async searchAccountByString(
    c: Context,
    userId: number,
    searchString: string
  ) {
    try {
      if (!userId) {
        throw new Error("User id not found");
      }

      const accounts = await this.accountService.searchAccountByString(
        userId,
        searchString
      );

      return c.json(accounts);
    } catch (error) {
      console.error("Search account error:", error);
      throw error; 
    }
  }
}
