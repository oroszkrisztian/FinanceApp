import {
  AccountType,
  CurrencyType,
  PrismaClient,
  BalanceChangeType,
} from "@prisma/client";
import axios from "axios";
import { parseStringPromise } from "xml2js";

export class AccountsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUserAllAccount(userId: number, startDate?: Date, endDate?: Date) {
    const includeOptions: any = {
      savingAccount: true, 
    };

   
    if (startDate && endDate) {
      includeOptions.balanceHistory = {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: "asc", 
        },
      };
    }

    return await this.prisma.account.findMany({
      where: {
        userId: userId,
      },
      include: includeOptions,
    });
  }

  async getUserDefaultAccounts(userId: number) {
    return await this.prisma.account.findMany({
      where: {
        userId: userId,
        type: AccountType.DEFAULT,
        deletedAt: null,
      },
    });
  }

  async getUserSavingAccounts(userId: number) {
    const savingAccount = await this.prisma.account.findMany({
      where: {
        userId: userId,
        type: AccountType.SAVINGS,
        deletedAt: null,
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
    return await this.prisma.account.update({
      where: {
        id: accountId,
        userId: userId,
        type: AccountType.DEFAULT,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async deleteSavingAccount(userId: number, accountId: number) {
    await this.prisma.account.update({
      where: {
        id: accountId,
        userId: userId,
        type: AccountType.SAVINGS,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // Helper function to record balance changes
  private async recordBalanceChange(
    prisma: any,
    accountId: number,
    previousBalance: number,
    newBalance: number,
    changeType: BalanceChangeType,
    currency: CurrencyType,
    description?: string
  ) {
    const amountChanged = newBalance - previousBalance;

    await prisma.accountBalanceHistory.create({
      data: {
        accountId,
        transactionId: null,
        previousBalance,
        newBalance,
        amountChanged,
        changeType,
        currency,
        description,
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
    return await this.prisma.$transaction(async (prisma) => {
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: userId,
          type: accountType,
        },
      });

      if (!account) {
        throw new Error("Account not found");
      }

      const updateData: any = {
        name: name,
        description: description,
        currency: currency,
        updatedAt: new Date(),
      };

      if (amount !== undefined) {
        updateData.amount = amount;

        // Record balance change if amount is updated
        await this.recordBalanceChange(
          prisma,
          accountId,
          account.amount,
          amount,
          BalanceChangeType.MANUAL_ADJUSTMENT,
          currency,
          "Manual balance adjustment"
        );
      }

      // Record balance history for currency change if currency is different
      if (account.currency !== currency && amount === undefined) {
        await this.recordBalanceChange(
          prisma,
          accountId,
          account.amount,
          account.amount, // Same amount but different currency
          BalanceChangeType.MANUAL_ADJUSTMENT,
          currency,
          `Currency changed from ${account.currency} to ${currency}`
        );
      }

      return await prisma.account.update({
        where: {
          id: accountId,
          userId: userId,
          type: accountType,
        },
        data: updateData,
      });
    });
  }

  private async getExchangeRates() {
    try {
      const response = await axios.get("http://localhost:3000/exchange-rates");
      const xmlText = response.data;
      const result = await parseStringPromise(xmlText, {
        explicitArray: false,
        mergeAttrs: false,
      });
      const rates: { [key: string]: number } = { RON: 1 };

      if (result?.DataSet?.Body?.Cube?.Rate) {
        const rateElements = Array.isArray(result.DataSet.Body.Cube.Rate)
          ? result.DataSet.Body.Cube.Rate
          : [result.DataSet.Body.Cube.Rate];

        for (const rate of rateElements) {
          if (rate?.$?.currency) {
            const currency = rate.$.currency;
            const multiplier = rate.$.multiplier
              ? parseInt(rate.$.multiplier)
              : 1;
            const value = parseFloat(rate._);
            if (currency && !isNaN(value)) {
              rates[currency] = multiplier > 1 ? value / multiplier : value;
            }
          }
        }
      }
      return rates;
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      throw new Error("Failed to fetch exchange rates");
    }
  }

  async editSavingAccount(
    userId: number,
    accountId: number,
    name: string,
    description: string,
    currency: CurrencyType,
    accountType: AccountType,
    targetAmount: number,
    targetDate: Date,
    amount?: number
  ) {
    return await this.prisma.$transaction(async (prisma) => {
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: userId,
          type: accountType,
        },
      });

      if (!account) {
        throw new Error("Account not found");
      }

      const updateData: any = {
        name,
        description,
        updatedAt: new Date(),
      };

      // Handle currency change and amount update
      if (account.currency !== currency || amount !== undefined) {
        updateData.currency = currency;

        let newAmount: number;

        if (amount !== undefined) {
          newAmount = amount;
        } else if (account.currency !== currency) {
          // Convert amount when currency changes
          const rates = await this.getExchangeRates();
          if (!rates[account.currency] || !rates[currency]) {
            throw new Error(
              `Exchange rate not found for conversion between ${currency} and ${account.currency}`
            );
          }
          newAmount =
            account.amount * (rates[account.currency] / rates[currency]);
        } else {
          newAmount = account.amount;
        }

        updateData.amount = newAmount;

        await this.recordBalanceChange(
          prisma,
          accountId,
          account.amount,
          newAmount,
          BalanceChangeType.MANUAL_ADJUSTMENT,
          currency,
          account.currency !== currency
            ? `Currency changed from ${account.currency} to ${currency}`
            : "Manual balance adjustment"
        );
      }

      await prisma.account.update({
        where: {
          id: accountId,
          userId: userId,
          type: accountType,
        },
        data: updateData,
      });

      return await prisma.savingAccount.update({
        where: {
          accountId: accountId,
        },
        data: {
          targetAmount: targetAmount,
          targetDate: targetDate,
        },
      });
    });
  }
}
