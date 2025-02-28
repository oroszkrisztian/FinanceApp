import { AccountType, CurrencyType, PrismaClient } from "@prisma/client";

export class AccountsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUserDefaultAccounts(userId: number) {
    return await this.prisma.account.findMany({
      where: {
        userId: userId,
        type: AccountType.DEFAULT,
      },
    });
  }

  async getUserSavingAccounts(userId: number) {
    const savingAccount = await this.prisma.account.findMany({
      where: {
        userId: userId,
        type: AccountType.SAVINGS,
      },
      include: {
        savingAccount: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return savingAccount;
  }

  async createDefaultAccount(
    userId: number,
    accountType: AccountType,
    currencyType: CurrencyType,
    name: string,
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

  async createSavingAccount(
    userId: number,
    accountType: AccountType,
    currencyType: CurrencyType,
    name: string,
    description: string,
    targetAmount: number,
    targetDate?: Date
  ) {
    const account = await this.prisma.account.create({
      data: {
        name: name,
        description: description,
        userId: userId,
        type: accountType,
        currency: currencyType,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const formattedDate = targetDate ? new Date(targetDate) : undefined;

    const savingAccount = await this.prisma.savingAccount.create({
      data: {
        accountId: account.id,
        targetAmount: targetAmount,
        targetDate: formattedDate,
        isCompleted: false,
      },
    });

    return { account, savingAccount };
  }

  async searchAccountByString(userId: number, searchString: string) {
    
      return await this.prisma.account.findMany({
        where: {
          userId: userId,
          type: AccountType.SAVINGS, 
          name: {
            contains: searchString,
            
          },
        },
        include: {
          savingAccount: true, 
        },
      });
   
  }
}
