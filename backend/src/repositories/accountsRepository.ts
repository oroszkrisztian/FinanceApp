import { AccountType, CurrencyType, PrismaClient } from "@prisma/client";

export class AccountsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUserAllAccount(userId: number) {
    return await this.prisma.account.findMany({
      where: {
        userId: userId,
      },
    });
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

  async deleteDefaultAccount(userId: number, accountId: number) {
    return await this.prisma.account.delete({
      where: {
        id: accountId,
        userId: userId,
        type: AccountType.DEFAULT,
      },
    });
  }

  async editDefaultAccount(
    userId: number,
    accountId: number,
    name: string,
    description: string,
    currency: CurrencyType,
    accountType: AccountType,
    amount?: number
  ) {
    const updateData: any = {
      name: name,
      description: description,
      currency: currency,
      updatedAt: new Date(),
    };

    if (amount !== undefined) {
      updateData.amount = amount;
    }

    return await this.prisma.account.update({
      where: {
        id: accountId,
        userId: userId,
        type: accountType,
      },
      data: updateData,
    });
  }

  async editSavingAccount(
    userId: number,
    accountId: number,
    name: string,
    description: string,
    currency: CurrencyType,
    accountType: AccountType,
    targetAmount: number,
    targetDate: Date
  ) {
    await this.prisma.account.update({
      where: {
        id: accountId,
        userId: userId,
        type: accountType,
      },
      data: {
        name,
        description,
        currency,
        updatedAt: new Date(),
      },
    });

    return await this.prisma.savingAccount.update({
      where: {
        accountId: accountId,
      },
      data: {
        targetAmount: targetAmount,
        targetDate: targetDate,
      },
    });
  }
}
