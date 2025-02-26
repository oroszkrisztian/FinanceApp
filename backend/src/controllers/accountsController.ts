import { Context } from "hono";
import { AccountsService } from "../services/accountsService";
import { AccountType, CurrencyType } from "@prisma/client";

export class AccountsController {
  private accountService: AccountsService;
  constructor() {
    this.accountService = new AccountsService();
  }

  async getAllAccounts(c: Context, userId: number) {
    try {
      if (!userId) {
        throw "User id not found";
      }
      const funds = await this.accountService.getAllAccounts(userId);
      return c.json(funds);
    } catch (error) {
      console.error("Get accounts error:", error);
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
}
