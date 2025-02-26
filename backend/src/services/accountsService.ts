import { AccountType, CurrencyType } from "@prisma/client";
import { AccountsRepository } from "../repositories/accountsRepository";

export class AccountsService {
  private accountRepo: AccountsRepository;

  constructor() {
    this.accountRepo = new AccountsRepository();
  }

  async getAllAccounts(userId: number) {
    const accounts = await this.accountRepo.getUserAccounts(userId);
    return accounts;
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
        )
        return newDefaultAccount;
    } catch (error) {
      console.error("Error in AccountsService.createDefaultAccount:", error);
      throw new Error("Failed to create default account");
    }
  }
}
