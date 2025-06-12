import {
  CurrencyType,
  PrismaClient,
  TransactionType,
  BalanceChangeType,
} from "@prisma/client";
import axios from "axios";
import { parseStringPromise } from "xml2js";

export class TransactionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private async recordBalanceChange(
    prisma: any,
    accountId: number,
    transactionId: number | null,
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
        transactionId,
        previousBalance,
        newBalance,
        amountChanged,
        changeType,
        currency,
        description,
      },
    });

    console.log(
      `Balance change recorded for account ${accountId}: ${previousBalance} -> ${newBalance} (${amountChanged >= 0 ? "+" : ""}${amountChanged})`
    );
  }

  private async updateAccountBalance(
    prisma: any,
    accountId: number,
    amount: number,
    isIncrement: boolean,
    transactionId: number | null,
    changeType: BalanceChangeType,
    description?: string
  ) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { amount: true, currency: true },
    });

    if (!account) {
      throw new Error(`Account with id ${accountId} not found`);
    }

    const previousBalance = account.amount;
    const newBalance = isIncrement
      ? previousBalance + amount
      : previousBalance - amount;

    await prisma.account.update({
      where: { id: accountId },
      data: {
        amount: isIncrement ? { increment: amount } : { decrement: amount },
      },
    });

    await this.recordBalanceChange(
      prisma,
      accountId,
      transactionId,
      previousBalance,
      newBalance,
      changeType,
      account.currency,
      description
    );

    return { previousBalance, newBalance };
  }

  async getUserAllTransactions(userId: number) {
    const allTransactions = await this.prisma.transaction.findMany({
      where: {
        userId: userId,
      },
      include: {
        transactionCategories: {
          select: {
            customCategoryId: true,
            customCategory: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        fromAccount: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return allTransactions;
  }

  async getAccountBalanceHistory(
    accountId: number,
    userId: number,
    limit?: number
  ) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new Error("Account not found or doesn't belong to the user");
    }

    return await this.prisma.accountBalanceHistory.findMany({
      where: {
        accountId: accountId,
      },
      include: {
        transaction: {
          select: {
            id: true,
            name: true,
            type: true,
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  }

  async getExchangeRates() {
    try {
      const rates: { [key: string]: number } = {};

      rates["RON"] = 1;

      const response = await axios.get("https://financeapp-bg0k.onrender.com/exchange-rates");
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
    customCategoriesId: number[] | null,
    currency: CurrencyType
  ) {
    console.log("Sent account id ", toAccountId);
    const defaultAccount = await this.prisma.account.findFirst({
      where: {
        id: toAccountId,
        userId: userId,
        deletedAt: null,
      },
    });

    if (!defaultAccount) {
      throw new Error("No default account found for the user");
    }

    console.log(
      "Adding funds to default account:",
      toAccountId,
      "amount:",
      amount,
      "currency:",
      currency
    );

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          name: name,
          description: description,
          amount: amount,
          type: type,
          toAccountId: defaultAccount.id,
          currency: currency,
        },
        include: {
          toAccount: true,
          budget: true,
        },
      });

      await this.updateAccountBalance(
        prisma,
        defaultAccount.id,
        amount,
        true,
        transaction.id,
        BalanceChangeType.TRANSACTION_INCOME,
        `Income: ${name || "Funds added"}`
      );

      if (customCategoriesId && customCategoriesId.length > 0) {
        const validCategories = await prisma.customCategory.findMany({
          where: {
            id: { in: customCategoriesId },
            OR: [{ userId: userId }, { type: "SYSTEM" }],
            deletedAt: null,
          },
        });

        if (validCategories.length !== customCategoriesId.length) {
          throw new Error(
            "One or more categories are invalid or don't belong to the user"
          );
        }

        await prisma.transactionCategory.createMany({
          data: customCategoriesId.map((categoryId) => ({
            transactionId: transaction.id,
            customCategoryId: categoryId,
          })),
        });
      }

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

      await this.updateAccountBalance(
        prisma,
        fromAccountId,
        amountToWithdraw,
        false,
        transaction.id,
        BalanceChangeType.TRANSACTION_TRANSFER_OUT,
        `Transfer to savings account`
      );

      await this.updateAccountBalance(
        prisma,
        toSavingId,
        amount,
        true,
        transaction.id,
        BalanceChangeType.TRANSACTION_TRANSFER_IN,
        `Transfer from main account`
      );

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

      await this.updateAccountBalance(
        prisma,
        fromSavingId,
        amountToWithdraw,
        false,
        transaction.id,
        BalanceChangeType.TRANSACTION_TRANSFER_OUT,
        `Transfer from savings to main account`
      );

      console.log("Adding funds to default account:", toAccountId);
      console.log("amount:", amount);
      await this.updateAccountBalance(
        prisma,
        toAccountId,
        amount,
        true,
        transaction.id,
        BalanceChangeType.TRANSACTION_TRANSFER_IN,
        `Transfer from savings account`
      );

      return transaction;
    });
  }

  async createExpense(
    amount: number,
    currency: CurrencyType,
    userId: number,
    name: string,
    fromAccountId: number,
    description: string | null,
    customCategoriesId: number[] | null
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

      await this.updateAccountBalance(
        prisma,
        fromAccountId,
        amountToWithdraw,
        false,
        transaction.id,
        BalanceChangeType.TRANSACTION_EXPENSE,
        `Expense: ${name}`
      );

      if (customCategoriesId && customCategoriesId.length > 0) {
        const validCategories = await prisma.customCategory.findMany({
          where: {
            id: { in: customCategoriesId },
            OR: [{ userId: userId }, { type: "SYSTEM" }],
            deletedAt: null,
          },
        });

        if (validCategories.length !== customCategoriesId.length) {
          throw new Error(
            "One or more categories are invalid or don't belong to the user"
          );
        }

        await prisma.transactionCategory.createMany({
          data: customCategoriesId.map((categoryId) => ({
            transactionId: transaction.id,
            customCategoryId: categoryId,
          })),
        });
      }

      if (customCategoriesId && customCategoriesId.length > 0) {
        const budgets = await prisma.budget.findMany({
          where: {
            userId: userId,
            deletedAt: null,
            budgetCategories: {
              some: {
                customCategoryId: {
                  in: customCategoriesId,
                },
              },
            },
          },
        });

        for (const budget of budgets) {
          let budgetAmount = amount;
          if (currency !== budget.currency && rates[budget.currency]) {
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

      await this.updateAccountBalance(
        prisma,
        fromAccountId,
        amount,
        false,
        transaction.id,
        BalanceChangeType.TRANSACTION_TRANSFER_OUT,
        `Transfer to account ${toAccount.name}`
      );

      await this.updateAccountBalance(
        prisma,
        toAccountId,
        amountToDeposit,
        true,
        transaction.id,
        BalanceChangeType.TRANSACTION_TRANSFER_IN,
        `Transfer from account ${fromAccount.name}`
      );

      return transaction;
    });
  }

  async executeRecurringPayment(
    userId: number,
    paymentId: number,
    amount: number,
    currency: CurrencyType,
    fromAccountId: number,
    name: string,
    description: string | null,
    customCategoriesId: number[] | null
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

      await this.updateAccountBalance(
        prisma,
        fromAccountId,
        amountToWithdraw,
        false,
        transaction.id,
        BalanceChangeType.TRANSACTION_EXPENSE,
        `Recurring payment: ${name}`
      );

      if (customCategoriesId && customCategoriesId.length > 0) {
        const validCategories = await prisma.customCategory.findMany({
          where: {
            id: { in: customCategoriesId },
            OR: [{ userId: userId }, { type: "SYSTEM" }],
            deletedAt: null,
          },
        });

        if (validCategories.length !== customCategoriesId.length) {
          throw new Error(
            "One or more categories are invalid or don't belong to the user"
          );
        }

        await prisma.transactionCategory.createMany({
          data: customCategoriesId.map((categoryId) => ({
            transactionId: transaction.id,
            customCategoryId: categoryId,
          })),
        });
      }

      if (customCategoriesId && customCategoriesId.length > 0) {
        const budgets = await prisma.budget.findMany({
          where: {
            userId: userId,
            deletedAt: null,
            budgetCategories: {
              some: {
                customCategoryId: {
                  in: customCategoriesId,
                },
              },
            },
          },
          include: {
            budgetCategories: {
              include: {
                customCategory: true,
              },
            },
          },
        });

        for (const budget of budgets) {
          let budgetAmount = amount;

          if (currency !== budget.currency && rates[budget.currency]) {
            budgetAmount = amount * (rates[currency] / rates[budget.currency]);
          }

          await prisma.budget.update({
            where: { id: budget.id },
            data: {
              currentSpent: { increment: budgetAmount },
              transactions: { connect: { id: transaction.id } },
            },
          });

          console.log(
            `Updated budget "${budget.name}" with ${budgetAmount} ${budget.currency} for recurring payment`
          );
        }
      }

      const payment = await prisma.recurringFundAndBill.findUnique({
        where: { id: paymentId },
      });

      if (payment) {
        if (payment.frequency === "ONCE") {
          const today = new Date();
          await prisma.recurringFundAndBill.update({
            where: { id: paymentId },
            data: {
              nextExecution: null,
              deletedAt: today,
            },
          });

          console.log(
            `One-time payment "${payment.name}" has been executed and completed`
          );
        } else {
          const scheduledDate = payment.nextExecution || new Date();
          let nextExecution = new Date(scheduledDate);

          switch (payment.frequency) {
            case "WEEKLY":
              nextExecution.setDate(nextExecution.getDate() + 7);
              break;
            case "BIWEEKLY":
              nextExecution.setDate(nextExecution.getDate() + 14);
              break;
            case "MONTHLY":
              nextExecution.setMonth(nextExecution.getMonth() + 1);
              break;
            case "QUARTERLY":
              nextExecution.setMonth(nextExecution.getMonth() + 3);
              break;
            case "YEARLY":
              nextExecution.setFullYear(nextExecution.getFullYear() + 1);
              break;
            default:
              nextExecution.setMonth(nextExecution.getMonth() + 1);
          }

          await prisma.recurringFundAndBill.update({
            where: { id: paymentId },
            data: { nextExecution: nextExecution },
          });

          console.log(
            `Updated payment "${payment.name}" next execution from ${scheduledDate.toDateString()} to ${nextExecution.toDateString()}`
          );
        }
      }

      return transaction;
    });
  }

  async executeRecurringIncome(
    userId: number,
    paymentId: number,
    amount: number,
    currency: CurrencyType,
    toAccountId: number,
    name: string,
    description: string | null,
    customCategoriesId: number[] | null
  ) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: toAccountId,
        userId: userId,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new Error("Account not found or doesn't belong to the user");
    }

    let amountToDeposit = amount;
    const rates = await this.getExchangeRates();

    if (account.currency !== currency) {
      if (!rates[account.currency] || !rates[currency]) {
        throw new Error(
          `Exchange rate not found for conversion between ${currency} and ${account.currency}`
        );
      }
      amountToDeposit = amount * (rates[currency] / rates[account.currency]);
    }

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          name: name,
          toAccountId: toAccountId,
          description: description,
          type: TransactionType.INCOME,
          amount: amount,
          currency: currency,
        },
        include: {
          toAccount: true,
        },
      });

      await this.updateAccountBalance(
        prisma,
        toAccountId,
        amountToDeposit,
        true,
        transaction.id,
        BalanceChangeType.TRANSACTION_INCOME,
        `Recurring income: ${name}`
      );

      const payment = await prisma.recurringFundAndBill.findUnique({
        where: { id: paymentId },
      });

      if (payment) {
        if (payment.frequency === "ONCE") {
          const today = new Date();
          await prisma.recurringFundAndBill.update({
            where: { id: paymentId },
            data: {
              nextExecution: null,
              deletedAt: today,
            },
          });

          console.log(
            `One-time income "${payment.name}" has been executed and completed`
          );
        } else {
          const scheduledDate = payment.nextExecution || new Date();
          let nextExecution = new Date(scheduledDate);

          switch (payment.frequency) {
            case "WEEKLY":
              nextExecution.setDate(nextExecution.getDate() + 7);
              break;
            case "BIWEEKLY":
              nextExecution.setDate(nextExecution.getDate() + 14);
              break;
            case "MONTHLY":
              nextExecution.setMonth(nextExecution.getMonth() + 1);
              break;
            case "QUARTERLY":
              nextExecution.setMonth(nextExecution.getMonth() + 3);
              break;
            case "YEARLY":
              nextExecution.setFullYear(nextExecution.getFullYear() + 1);
              break;
            default:
              nextExecution.setMonth(nextExecution.getMonth() + 1);
          }

          await prisma.recurringFundAndBill.update({
            where: { id: paymentId },
            data: { nextExecution: nextExecution },
          });

          console.log(
            `Updated income "${payment.name}" next execution from ${scheduledDate.toDateString()} to ${nextExecution.toDateString()}`
          );
        }
      }

      return transaction;
    });
  }

  async manualBalanceAdjustment(
    userId: number,
    accountId: number,
    amount: number,
    changeType: BalanceChangeType,
    description: string
  ) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new Error("Account not found or doesn't belong to the user");
    }

    return await this.prisma.$transaction(async (prisma) => {
      await this.updateAccountBalance(
        prisma,
        accountId,
        Math.abs(amount),
        amount > 0,
        null,
        changeType,
        description
      );

      return { success: true, message: `Balance adjusted by ${amount}` };
    });
  }
}
