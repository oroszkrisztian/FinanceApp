import { AccountType, CurrencyType, PrismaClient } from "@prisma/client";

export class AccountsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUserAccounts(userId: number) {
    return await this.prisma.account.findMany({
      where: {
        userId: userId,
      },
    });
  }

  async createDefaultAccount(
    userId: number,
    accountType: AccountType,
    currencyType: CurrencyType,
    name: string ,
    description: string 
  ) {
    
    return await this.prisma.account.create({
      data: {
        name: name, 
        description: description, 
        userId: userId, 
        type: accountType,
        currency: currencyType, 
        isDefault: true, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
      },
    });
  }
}
