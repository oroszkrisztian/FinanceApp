import { CurrencyType, PrismaClient, TransactionType } from "@prisma/client";
import axios from "axios";
import { parseStringPromise } from "xml2js";

export class TransactionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUserAllTransactions(userId: number) {
    const allTransactions = await this.prisma.transaction.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return allTransactions;
  }

  async getExchangeRates() {
    try {
      const rates: { [key: string]: number } = {};

      rates["RON"] = 1;

      const response = await axios.get("http://localhost:3000/exchange-rates");
      const xmlText = response.data;

      const result = await parseStringPromise(xmlText, {
        explicitArray: false,
        mergeAttrs: false,
      });

      if (
        result &&
        result.DataSet &&
        result.DataSet.Body &&
        result.DataSet.Body.Cube &&
        result.DataSet.Body.Cube.Rate
      ) {
        const rateElements = Array.isArray(result.DataSet.Body.Cube.Rate)
          ? result.DataSet.Body.Cube.Rate
          : [result.DataSet.Body.Cube.Rate];

        for (const rate of rateElements) {
          // Extract currency and value
          if (rate && rate.$ && rate.$.currency) {
            const currency = rate.$.currency;
            const multiplier = rate.$.multiplier
              ? parseInt(rate.$.multiplier)
              : 1;
            const value = parseFloat(rate._);

            if (currency && !isNaN(value)) {
              if (multiplier > 1) {
                rates[currency] = value / multiplier;
              } else {
                rates[currency] = value;
              }
            }
          }
        }
      }

      console.log("Exchange rates fetched:", rates);
      return rates;
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      throw new Error("Failed to fetch exchange rates");
    }
  }

  async addFundsDefaultAccount(
    userId: number,
    name: string | null,
    description: string,
    amount: number,
    type: TransactionType,
    toAccountId: number,
    customCategoryId: number | null,
    currency: CurrencyType
  ) {
    const defaultAccount = await this.prisma.account.findFirst({
      where: {
        id: toAccountId,
        userId: userId,
        isDefault: true,
        deletedAt: null,
      },
    });

    if (!defaultAccount) {
      throw new Error("No default account found for the user");
    }

    //log the sent data
    console.log(
      "Adding funds to default account:",
      toAccountId,
      "amount:",
      amount,
      "currency:",
      currency
    );

    // and stop function now

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          name: name,
          description: description,
          amount: amount,
          type: type,
          toAccountId: defaultAccount.id,
          budgetId: customCategoryId,
          currency: currency,
        },
        include: {
          toAccount: true,
          budget: true,
        },
      });

      await prisma.account.update({
        where: {
          id: defaultAccount.id,
        },
        data: {
          amount: {
            increment: amount,
          },
        },
      });

      return transaction;
    });
  }

  async addFundsSaving(
    userId: number,
    amount: number,
    fromAccountId: number,
    toSavingId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    const fromAccount = await this.prisma.account.findFirst({
      where: {
        id: fromAccountId,
        userId,
        deletedAt: null,
      },
    });

    if (!fromAccount) {
      throw new Error("Source account not found or doesn't belong to the user");
    }

    const toAccount = await this.prisma.account.findFirst({
      where: {
        id: toSavingId,
        userId,
        type: "SAVINGS",
        deletedAt: null,
      },
      include: {
        savingAccount: true,
      },
    });

    if (!toAccount) {
      throw new Error(
        "Savings account not found or doesn't belong to the user"
      );
    }

    let amountToWithdraw = amount;

    if (fromAccount.currency !== currency) {
      const rates = await this.getExchangeRates();

      if (!rates[fromAccount.currency]) {
        throw new Error(`Exchange rate for ${fromAccount.currency} not found`);
      }

      if (!rates[currency]) {
        throw new Error(`Exchange rate for ${currency} not found`);
      }

      amountToWithdraw =
        amount * (rates[currency] / rates[fromAccount.currency]);

      console.log(
        `Converting ${amount} ${currency} to ${amountToWithdraw.toFixed(2)} ${fromAccount.currency}`
      );
    }

    if (fromAccount.amount < amountToWithdraw) {
      throw new Error(
        `Insufficient funds in source account. Available: ${fromAccount.amount} ${fromAccount.currency}, Required: ${amountToWithdraw.toFixed(2)} ${fromAccount.currency}`
      );
    }

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          amount,
          type,
          fromAccountId: fromAccountId,
          toAccountId: toSavingId,
          currency,
        },
        include: {
          fromAccount: true,
          toAccount: true,
          budget: true,
        },
      });

      await prisma.account.update({
        where: {
          id: fromAccountId,
        },
        data: {
          amount: {
            decrement: amountToWithdraw,
          },
        },
      });

      await prisma.account.update({
        where: {
          id: toSavingId,
        },
        data: {
          amount: {
            increment: amount,
          },
        },
      });

      if (toAccount.savingAccount && !toAccount.savingAccount.isCompleted) {
        const updatedAmount = toAccount.amount + amount;

        if (updatedAmount >= toAccount.savingAccount.targetAmount) {
          await prisma.savingAccount.update({
            where: {
              id: toAccount.savingAccount.id,
            },
            data: {
              isCompleted: true,
            },
          });
        }
      }

      return transaction;
    });
  }

  async addFundsDefault(
    userId: number,
    amount: number,
    fromSavingId: number,
    toAccountId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    const fromAccount = await this.prisma.account.findFirst({
      where: {
        id: fromSavingId,
        userId,
        type: "SAVINGS",
        deletedAt: null,
      },
      include: {
        savingAccount: true,
      },
    });

    if (!fromAccount) {
      throw new Error(
        "Source savings account not found or doesn't belong to the user"
      );
    }

    const toAccount = await this.prisma.account.findFirst({
      where: {
        id: toAccountId,
        userId,
        deletedAt: null,
      },
    });

    if (!toAccount) {
      throw new Error(
        "Destination account not found or doesn't belong to the user"
      );
    }

    let amountToWithdraw = amount;

    if (fromAccount.currency !== currency) {
      const rates = await this.getExchangeRates();
      if (!rates[fromAccount.currency]) {
        throw new Error(`Exchange rate for ${fromAccount.currency} not found`);
      }
      if (!rates[currency]) {
        throw new Error(`Exchange rate for ${currency} not found`);
      }

      amountToWithdraw =
        amount * (rates[currency] / rates[fromAccount.currency]);
      console.log(
        `Converting ${amount} ${currency} to ${amountToWithdraw.toFixed(2)} ${fromAccount.currency} for withdrawal`
      );
    }

    if (fromAccount.amount < amountToWithdraw) {
      throw new Error(
        `Insufficient funds in savings account. Available: ${fromAccount.amount} ${fromAccount.currency}, Required: ${amountToWithdraw.toFixed(2)} ${fromAccount.currency}`
      );
    }

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          amount,
          type,
          fromAccountId: fromSavingId,
          toAccountId: toAccountId,
          currency,
        },
        include: {
          fromAccount: true,
          toAccount: true,
          budget: true,
        },
      });

      await prisma.account.update({
        where: {
          id: fromSavingId,
        },
        data: {
          amount: {
            decrement: amountToWithdraw,
          },
        },
      });

      console.log("Adding funds to default account:", toAccountId);
      console.log("amount:", amount);
      await prisma.account.update({
        where: {
          id: toAccountId,
        },
        data: {
          amount: {
            increment: amount,
          },
        },
      });

      return transaction;
    });
  }

  async createExpense(
    amount: number,
    currency: CurrencyType,
    userId: number,
    name: string,
    fromAccountId: number,
    budgetId: number | null,
    description: string | null
  ) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: fromAccountId,
        userId: userId,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new Error("Account not found or doesn't belong to the user");
    }

    let amountToWithdraw = amount;
    const rates = await this.getExchangeRates();

    // Convert for account withdrawal if currencies differ
    if (account.currency !== currency) {
      if (!rates[account.currency] || !rates[currency]) {
        throw new Error(
          `Exchange rate not found for conversion between ${currency} and ${account.currency}`
        );
      }
      amountToWithdraw = amount * (rates[currency] / rates[account.currency]);
    }

    if (account.amount < amountToWithdraw) {
      throw new Error(
        `Insufficient funds in account. Available: ${account.amount} ${account.currency}, Required: ${amountToWithdraw.toFixed(2)} ${account.currency}`
      );
    }

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          name: name,
          fromAccountId: fromAccountId,
          description: description,
          type: TransactionType.EXPENSE,
          amount: amount,
          currency: currency,
        },
        include: {
          fromAccount: true,
        },
      });

      await prisma.account.update({
        where: { id: fromAccountId },
        data: { amount: { decrement: amountToWithdraw } },
      });

      if (budgetId) {
        const budget = await prisma.budget.findFirst({
          where: {
            id: budgetId,
            userId: userId,
            deletedAt: null,
          },
        });

        if (budget) {
          let budgetAmount = amount;

          if (currency !== budget.currency) {
            if (!rates[budget.currency]) {
              console.error(
                `Exchange rate not found for ${budget.currency}, skipping budget update`
              );
              return transaction;
            }
            budgetAmount = amount * (rates[currency] / rates[budget.currency]);
          }

          await prisma.budget.update({
            where: { id: budget.id },
            data: {
              currentSpent: { increment: budgetAmount },
              transactions: { connect: { id: transaction.id } },
            },
          });
        }
      }

      return transaction;
    });
  }

  async transferFundsDefault(
    userId: number,
    amount: number,
    fromAccountId: number,
    toAccountId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    const fromAccount = await this.prisma.account.findFirst({
      where: {
        id: fromAccountId,
        userId,
        deletedAt: null,
      },
    });

    if (!fromAccount) {
      throw new Error("Source account not found or doesn't belong to the user");
    }

    const toAccount = await this.prisma.account.findFirst({
      where: {
        id: toAccountId,
        userId,
        deletedAt: null,
      },
    });

    if (!toAccount) {
      throw new Error(
        "Destination account not found or doesn't belong to the user"
      );
    }

    if (fromAccount.amount < amount) {
      throw new Error(
        `Insufficient funds in source account. Available: ${fromAccount.amount} ${fromAccount.currency}, Required: ${amount} ${fromAccount.currency}`
      );
    }

    let amountToDeposit = amount;

    if (toAccount.currency !== currency) {
      const rates = await this.getExchangeRates();
      if (!rates[toAccount.currency]) {
        throw new Error(`Exchange rate for ${toAccount.currency} not found`);
      }
      if (!rates[currency]) {
        throw new Error(`Exchange rate for ${currency} not found`);
      }

      amountToDeposit = amount * (rates[currency] / rates[toAccount.currency]);
      console.log(
        `Converting ${amount} ${currency} to ${amountToDeposit.toFixed(2)} ${toAccount.currency} for deposit`
      );
    }

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          amount,
          type,
          fromAccountId: fromAccountId,
          toAccountId: toAccountId,
          currency,
        },
        include: {
          fromAccount: true,
          toAccount: true,
          budget: true,
        },
      });

      await prisma.account.update({
        where: { id: fromAccountId },
        data: { amount: { decrement: amount } },
      });

      await prisma.account.update({
        where: { id: toAccountId },
        data: { amount: { increment: amountToDeposit } },
      });
      return transaction;
    });
  }
}
