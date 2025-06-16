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
  private exchangeRatesCache: { rates: any, timestamp: number } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

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

    await Promise.all([
      prisma.account.update({
        where: { id: accountId },
        data: {
          amount: isIncrement ? { increment: amount } : { decrement: amount },
        },
      }),
      this.recordBalanceChange(
        prisma,
        accountId,
        transactionId,
        previousBalance,
        newBalance,
        changeType,
        account.currency,
        description
      )
    ]);

    return { previousBalance, newBalance };
  }

  async getUserAllTransactions(userId: number) {
    return await this.prisma.transaction.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        type: true,
        currency: true,
        createdAt: true,
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
      orderBy: { createdAt: "desc" },
    });
  }

  async getAccountBalanceHistory(accountId: number, userId: number, limit?: number) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Account not found or doesn't belong to the user");
    }

    return await this.prisma.accountBalanceHistory.findMany({
      where: { accountId },
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
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getExchangeRates() {
    const now = Date.now();
    
    if (this.exchangeRatesCache && 
        (now - this.exchangeRatesCache.timestamp) < this.CACHE_DURATION) {
      return this.exchangeRatesCache.rates;
    }

    try {
      const rates: { [key: string]: number } = { "RON": 1 };
      const response = await axios.get("https://financeapp-bg0k.onrender.com/exchange-rates");
      const result = await parseStringPromise(response.data, {
        explicitArray: false,
        mergeAttrs: false,
      });

      if (result?.DataSet?.Body?.Cube?.Rate) {
        const rateElements = Array.isArray(result.DataSet.Body.Cube.Rate)
          ? result.DataSet.Body.Cube.Rate
          : [result.DataSet.Body.Cube.Rate];

        for (const rate of rateElements) {
          if (rate?.$?.currency) {
            const currency = rate.$.currency;
            const multiplier = rate.$.multiplier ? parseInt(rate.$.multiplier) : 1;
            const value = parseFloat(rate._);

            if (currency && !isNaN(value)) {
              rates[currency] = multiplier > 1 ? value / multiplier : value;
            }
          }
        }
      }

      this.exchangeRatesCache = { rates, timestamp: now };
      return rates;
    } catch (error) {
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
    const defaultAccount = await this.prisma.account.findFirst({
      where: {
        id: toAccountId,
        userId: userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!defaultAccount) {
      throw new Error("No default account found for the user");
    }

    let validatedCategoryIds: number[] = [];
    if (customCategoriesId?.length) {
      const validCategories = await this.prisma.customCategory.findMany({
        where: {
          id: { in: customCategoriesId },
          OR: [{ userId: userId }, { type: "SYSTEM" }],
          deletedAt: null,
        },
        select: { id: true },
      });

      if (validCategories.length !== customCategoriesId.length) {
        throw new Error("One or more categories are invalid or don't belong to the user");
      }
      validatedCategoryIds = validCategories.map(cat => cat.id);
    }

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
        select: { id: true },
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

      if (validatedCategoryIds.length > 0) {
        await prisma.transactionCategory.createMany({
          data: validatedCategoryIds.map((categoryId) => ({
            transactionId: transaction.id,
            customCategoryId: categoryId,
          })),
        });
      }

      return prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          toAccount: true,
          budget: true,
        },
      });
    }, { timeout: 15000 });
  }

  async addFundsSaving(
    userId: number,
    amount: number,
    fromAccountId: number,
    toSavingId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    const [fromAccount, toAccount, rates] = await Promise.all([
      this.prisma.account.findFirst({
        where: { id: fromAccountId, userId, deletedAt: null },
        select: { amount: true, currency: true },
      }),
      this.prisma.account.findFirst({
        where: { id: toSavingId, userId, type: "SAVINGS", deletedAt: null },
        include: { savingAccount: true },
      }),
      this.getExchangeRates()
    ]);

    if (!fromAccount) {
      throw new Error("Source account not found or doesn't belong to the user");
    }

    if (!toAccount) {
      throw new Error("Savings account not found or doesn't belong to the user");
    }

    let amountToWithdraw = amount;
    if (fromAccount.currency !== currency) {
      if (!rates[fromAccount.currency] || !rates[currency]) {
        throw new Error(`Exchange rate not found for conversion between ${currency} and ${fromAccount.currency}`);
      }
      amountToWithdraw = amount * (rates[currency] / rates[fromAccount.currency]);
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
        select: { id: true },
      });

      await Promise.all([
        this.updateAccountBalance(
          prisma,
          fromAccountId,
          amountToWithdraw,
          false,
          transaction.id,
          BalanceChangeType.TRANSACTION_TRANSFER_OUT,
          `Transfer to savings account`
        ),
        this.updateAccountBalance(
          prisma,
          toSavingId,
          amount,
          true,
          transaction.id,
          BalanceChangeType.TRANSACTION_TRANSFER_IN,
          `Transfer from main account`
        )
      ]);

      if (toAccount.savingAccount && !toAccount.savingAccount.isCompleted) {
        const updatedAmount = toAccount.amount + amount;
        if (updatedAmount >= toAccount.savingAccount.targetAmount) {
          await prisma.savingAccount.update({
            where: { id: toAccount.savingAccount.id },
            data: { isCompleted: true },
          });
        }
      }

      return prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          fromAccount: true,
          toAccount: true,
          budget: true,
        },
      });
    }, { timeout: 15000 });
  }

  async addFundsDefault(
    userId: number,
    amount: number,
    fromSavingId: number,
    toAccountId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    const [fromAccount, toAccount, rates] = await Promise.all([
      this.prisma.account.findFirst({
        where: { id: fromSavingId, userId, type: "SAVINGS", deletedAt: null },
        include: { savingAccount: true },
      }),
      this.prisma.account.findFirst({
        where: { id: toAccountId, userId, deletedAt: null },
        select: { id: true, currency: true },
      }),
      this.getExchangeRates()
    ]);

    if (!fromAccount) {
      throw new Error("Source savings account not found or doesn't belong to the user");
    }

    if (!toAccount) {
      throw new Error("Destination account not found or doesn't belong to the user");
    }

    let amountToWithdraw = amount;
    if (fromAccount.currency !== currency) {
      if (!rates[fromAccount.currency] || !rates[currency]) {
        throw new Error(`Exchange rate not found for conversion between ${currency} and ${fromAccount.currency}`);
      }
      amountToWithdraw = amount * (rates[currency] / rates[fromAccount.currency]);
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
        select: { id: true },
      });

      await Promise.all([
        this.updateAccountBalance(
          prisma,
          fromSavingId,
          amountToWithdraw,
          false,
          transaction.id,
          BalanceChangeType.TRANSACTION_TRANSFER_OUT,
          `Transfer from savings to main account`
        ),
        this.updateAccountBalance(
          prisma,
          toAccountId,
          amount,
          true,
          transaction.id,
          BalanceChangeType.TRANSACTION_TRANSFER_IN,
          `Transfer from savings account`
        )
      ]);

      return prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          fromAccount: true,
          toAccount: true,
          budget: true,
        },
      });
    }, { timeout: 15000 });
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
    const [account, rates] = await Promise.all([
      this.prisma.account.findFirst({
        where: { id: fromAccountId, userId: userId, deletedAt: null },
        select: { amount: true, currency: true },
      }),
      this.getExchangeRates()
    ]);

    if (!account) {
      throw new Error("Account not found or doesn't belong to the user");
    }

    let amountToWithdraw = amount;
    if (account.currency !== currency) {
      if (!rates[account.currency] || !rates[currency]) {
        throw new Error(`Exchange rate not found for conversion between ${currency} and ${account.currency}`);
      }
      amountToWithdraw = amount * (rates[currency] / rates[account.currency]);
    }

    if (account.amount < amountToWithdraw) {
      throw new Error(
        `Insufficient funds in account. Available: ${account.amount} ${account.currency}, Required: ${amountToWithdraw.toFixed(2)} ${account.currency}`
      );
    }

    let validatedCategoryIds: number[] = [];
    let budgetUpdates: Array<{id: number, budgetAmount: number}> = [];

    if (customCategoriesId?.length) {
      const [validCategories, budgets] = await Promise.all([
        this.prisma.customCategory.findMany({
          where: {
            id: { in: customCategoriesId },
            OR: [{ userId: userId }, { type: "SYSTEM" }],
            deletedAt: null,
          },
          select: { id: true },
        }),
        this.prisma.budget.findMany({
          where: {
            userId: userId,
            deletedAt: null,
            budgetCategories: {
              some: { customCategoryId: { in: customCategoriesId } },
            },
          },
          select: { id: true, currency: true },
        })
      ]);

      if (validCategories.length !== customCategoriesId.length) {
        throw new Error("One or more categories are invalid or don't belong to the user");
      }

      validatedCategoryIds = validCategories.map(cat => cat.id);
      budgetUpdates = budgets.map(budget => {
        let budgetAmount = amount;
        if (currency !== budget.currency && rates[budget.currency]) {
          budgetAmount = amount * (rates[currency] / rates[budget.currency]);
        }
        return { id: budget.id, budgetAmount };
      });
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
        select: { id: true },
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

      if (validatedCategoryIds.length > 0) {
        await prisma.transactionCategory.createMany({
          data: validatedCategoryIds.map((categoryId) => ({
            transactionId: transaction.id,
            customCategoryId: categoryId,
          })),
        });

        if (budgetUpdates.length > 0) {
          await Promise.all(
            budgetUpdates.map(({ id, budgetAmount }) =>
              prisma.budget.update({
                where: { id },
                data: {
                  currentSpent: { increment: budgetAmount },
                  transactions: { connect: { id: transaction.id } },
                },
              })
            )
          );
        }
      }

      return prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: { fromAccount: true },
      });
    }, { timeout: 15000 });
  }

  async transferFundsDefault(
    userId: number,
    amount: number,
    fromAccountId: number,
    toAccountId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    const [fromAccount, toAccount, rates] = await Promise.all([
      this.prisma.account.findFirst({
        where: { id: fromAccountId, userId, deletedAt: null },
        select: { amount: true, currency: true, name: true },
      }),
      this.prisma.account.findFirst({
        where: { id: toAccountId, userId, deletedAt: null },
        select: { currency: true, name: true },
      }),
      this.getExchangeRates()
    ]);

    if (!fromAccount) {
      throw new Error("Source account not found or doesn't belong to the user");
    }

    if (!toAccount) {
      throw new Error("Destination account not found or doesn't belong to the user");
    }

    if (fromAccount.amount < amount) {
      throw new Error(
        `Insufficient funds in source account. Available: ${fromAccount.amount} ${fromAccount.currency}, Required: ${amount} ${fromAccount.currency}`
      );
    }

    let amountToDeposit = amount;
    if (toAccount.currency !== currency) {
      if (!rates[toAccount.currency] || !rates[currency]) {
        throw new Error(`Exchange rate not found for conversion between ${currency} and ${toAccount.currency}`);
      }
      amountToDeposit = amount * (rates[currency] / rates[toAccount.currency]);
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
        select: { id: true },
      });

      await Promise.all([
        this.updateAccountBalance(
          prisma,
          fromAccountId,
          amount,
          false,
          transaction.id,
          BalanceChangeType.TRANSACTION_TRANSFER_OUT,
          `Transfer to account ${toAccount.name}`
        ),
        this.updateAccountBalance(
          prisma,
          toAccountId,
          amountToDeposit,
          true,
          transaction.id,
          BalanceChangeType.TRANSACTION_TRANSFER_IN,
          `Transfer from account ${fromAccount.name}`
        )
      ]);

      return prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          fromAccount: true,
          toAccount: true,
          budget: true,
        },
      });
    }, { timeout: 15000 });
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
    const [account, rates] = await Promise.all([
      this.prisma.account.findFirst({
        where: { id: fromAccountId, userId: userId, deletedAt: null },
        select: { amount: true, currency: true },
      }),
      this.getExchangeRates()
    ]);

    if (!account) {
      throw new Error("Account not found or doesn't belong to the user");
    }

    let amountToWithdraw = amount;
    if (account.currency !== currency) {
      if (!rates[account.currency] || !rates[currency]) {
        throw new Error(`Exchange rate not found for conversion between ${currency} and ${account.currency}`);
      }
      amountToWithdraw = amount * (rates[currency] / rates[account.currency]);
    }

    if (account.amount < amountToWithdraw) {
      throw new Error(
        `Insufficient funds in account. Available: ${account.amount} ${account.currency}, Required: ${amountToWithdraw.toFixed(2)} ${account.currency}`
      );
    }

    let validatedCategoryIds: number[] = [];
    let budgetUpdates: Array<{id: number, budgetAmount: number}> = [];
    
    const [validCategories, budgets, payment] = await Promise.all([
      customCategoriesId?.length ? this.prisma.customCategory.findMany({
        where: {
          id: { in: customCategoriesId },
          OR: [{ userId: userId }, { type: "SYSTEM" }],
          deletedAt: null,
        },
        select: { id: true },
      }) : Promise.resolve([]),
      customCategoriesId?.length ? this.prisma.budget.findMany({
        where: {
          userId: userId,
          deletedAt: null,
          budgetCategories: {
            some: { customCategoryId: { in: customCategoriesId } },
          },
        },
        select: { id: true, currency: true },
      }) : Promise.resolve([]),
      this.prisma.recurringFundAndBill.findUnique({
        where: { id: paymentId },
        select: { id: true, name: true, frequency: true, nextExecution: true },
      })
    ]);

    if (customCategoriesId?.length && validCategories.length !== customCategoriesId.length) {
      throw new Error("One or more categories are invalid or don't belong to the user");
    }

    if (validCategories.length > 0) {
      validatedCategoryIds = validCategories.map(cat => cat.id);
      budgetUpdates = budgets.map(budget => {
        let budgetAmount = amount;
        if (currency !== budget.currency && rates[budget.currency]) {
          budgetAmount = amount * (rates[currency] / rates[budget.currency]);
        }
        return { id: budget.id, budgetAmount };
      });
    }

    let nextExecutionUpdate: { nextExecution?: Date | null, deletedAt?: Date } = {};
    if (payment) {
      if (payment.frequency === "ONCE") {
        nextExecutionUpdate = {
          nextExecution: null,
          deletedAt: new Date(),
        };
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

        nextExecutionUpdate = { nextExecution };
      }
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
        select: { id: true },
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

      if (validatedCategoryIds.length > 0) {
        await prisma.transactionCategory.createMany({
          data: validatedCategoryIds.map((categoryId) => ({
            transactionId: transaction.id,
            customCategoryId: categoryId,
          })),
        });

        if (budgetUpdates.length > 0) {
          await Promise.all(
            budgetUpdates.map(({ id, budgetAmount }) =>
              prisma.budget.update({
                where: { id },
                data: {
                  currentSpent: { increment: budgetAmount },
                  transactions: { connect: { id: transaction.id } },
                },
              })
            )
          );
        }
      }

      if (payment && Object.keys(nextExecutionUpdate).length > 0) {
        await prisma.recurringFundAndBill.update({
          where: { id: paymentId },
          data: nextExecutionUpdate,
        });
      }

      return prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: { fromAccount: true },
      });
    }, { timeout: 15000 });
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
    const [account, rates, payment] = await Promise.all([
      this.prisma.account.findFirst({
        where: { id: toAccountId, userId: userId, deletedAt: null },
        select: { currency: true },
      }),
      this.getExchangeRates(),
      this.prisma.recurringFundAndBill.findUnique({
        where: { id: paymentId },
        select: { id: true, name: true, frequency: true, nextExecution: true },
      })
    ]);

    if (!account) {
      throw new Error("Account not found or doesn't belong to the user");
    }

    let amountToDeposit = amount;
    if (account.currency !== currency) {
      if (!rates[account.currency] || !rates[currency]) {
        throw new Error(`Exchange rate not found for conversion between ${currency} and ${account.currency}`);
      }
      amountToDeposit = amount * (rates[currency] / rates[account.currency]);
    }

    let nextExecutionUpdate: { nextExecution?: Date | null, deletedAt?: Date } = {};
    if (payment) {
      if (payment.frequency === "ONCE") {
        nextExecutionUpdate = {
          nextExecution: null,
          deletedAt: new Date(),
        };
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

        nextExecutionUpdate = { nextExecution };
      }
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
        select: { id: true },
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

      if (payment && Object.keys(nextExecutionUpdate).length > 0) {
        await prisma.recurringFundAndBill.update({
          where: { id: paymentId },
          data: nextExecutionUpdate,
        });
      }

      return prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: { toAccount: true },
      });
    }, { timeout: 15000 });
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
      select: { id: true },
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
    }, { timeout: 10000 });
  }
}