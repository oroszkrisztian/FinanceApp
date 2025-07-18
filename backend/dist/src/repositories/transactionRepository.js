"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const xml2js_1 = require("xml2js");
class TransactionRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async recordBalanceChange(prisma, accountId, transactionId, previousBalance, newBalance, changeType, currency, description) {
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
    async updateAccountBalance(prisma, accountId, amount, isIncrement, transactionId, changeType, description) {
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
        await this.recordBalanceChange(prisma, accountId, transactionId, previousBalance, newBalance, changeType, account.currency, description);
        return { previousBalance, newBalance };
    }
    async getUserAllTransactions(userId) {
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
    async getAccountBalanceHistory(accountId, userId, limit) {
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
            const rates = {};
            rates["RON"] = 1;
            const response = await axios_1.default.get("https://financeapp-bg0k.onrender.com/exchange-rates");
            const xmlText = response.data;
            const result = await (0, xml2js_1.parseStringPromise)(xmlText, {
                explicitArray: false,
                mergeAttrs: false,
            });
            if (result &&
                result.DataSet &&
                result.DataSet.Body &&
                result.DataSet.Body.Cube &&
                result.DataSet.Body.Cube.Rate) {
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
                            }
                            else {
                                rates[currency] = value;
                            }
                        }
                    }
                }
            }
            return rates;
        }
        catch (error) {
            console.error("Error fetching exchange rates:", error);
            throw new Error("Failed to fetch exchange rates");
        }
    }
    async addFundsDefaultAccount(userId, name, description, amount, type, toAccountId, customCategoriesId, currency) {
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
            await this.updateAccountBalance(prisma, defaultAccount.id, amount, true, transaction.id, client_1.BalanceChangeType.TRANSACTION_INCOME, `Income: ${name || "Funds added"}`);
            if (customCategoriesId && customCategoriesId.length > 0) {
                const validCategories = await prisma.customCategory.findMany({
                    where: {
                        id: { in: customCategoriesId },
                        OR: [{ userId: userId }, { type: "SYSTEM" }],
                        deletedAt: null,
                    },
                });
                if (validCategories.length !== customCategoriesId.length) {
                    throw new Error("One or more categories are invalid or don't belong to the user");
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
    async addFundsSaving(userId, amount, fromAccountId, toSavingId, type, currency) {
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
            throw new Error("Savings account not found or doesn't belong to the user");
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
        }
        if (fromAccount.amount < amountToWithdraw) {
            throw new Error(`Insufficient funds in source account. Available: ${fromAccount.amount} ${fromAccount.currency}, Required: ${amountToWithdraw.toFixed(2)} ${fromAccount.currency}`);
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
            await this.updateAccountBalance(prisma, fromAccountId, amountToWithdraw, false, transaction.id, client_1.BalanceChangeType.TRANSACTION_TRANSFER_OUT, `Transfer to savings account`);
            await this.updateAccountBalance(prisma, toSavingId, amount, true, transaction.id, client_1.BalanceChangeType.TRANSACTION_TRANSFER_IN, `Transfer from main account`);
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
    async addFundsDefault(userId, amount, fromSavingId, toAccountId, type, currency) {
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
            throw new Error("Source savings account not found or doesn't belong to the user");
        }
        const toAccount = await this.prisma.account.findFirst({
            where: {
                id: toAccountId,
                userId,
                deletedAt: null,
            },
        });
        if (!toAccount) {
            throw new Error("Destination account not found or doesn't belong to the user");
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
        }
        if (fromAccount.amount < amountToWithdraw) {
            throw new Error(`Insufficient funds in savings account. Available: ${fromAccount.amount} ${fromAccount.currency}, Required: ${amountToWithdraw.toFixed(2)} ${fromAccount.currency}`);
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
            await this.updateAccountBalance(prisma, fromSavingId, amountToWithdraw, false, transaction.id, client_1.BalanceChangeType.TRANSACTION_TRANSFER_OUT, `Transfer from savings to main account`);
            await this.updateAccountBalance(prisma, toAccountId, amount, true, transaction.id, client_1.BalanceChangeType.TRANSACTION_TRANSFER_IN, `Transfer from savings account`);
            return transaction;
        });
    }
    async createExpense(amount, currency, userId, name, fromAccountId, description, customCategoriesId) {
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
                throw new Error(`Exchange rate not found for conversion between ${currency} and ${account.currency}`);
            }
            amountToWithdraw = amount * (rates[currency] / rates[account.currency]);
        }
        if (account.amount < amountToWithdraw) {
            throw new Error(`Insufficient funds in account. Available: ${account.amount} ${account.currency}, Required: ${amountToWithdraw.toFixed(2)} ${account.currency}`);
        }
        return await this.prisma.$transaction(async (prisma) => {
            const transaction = await prisma.transaction.create({
                data: {
                    userId: userId,
                    name: name,
                    fromAccountId: fromAccountId,
                    description: description,
                    type: client_1.TransactionType.EXPENSE,
                    amount: amount,
                    currency: currency,
                },
                include: {
                    fromAccount: true,
                },
            });
            await this.updateAccountBalance(prisma, fromAccountId, amountToWithdraw, false, transaction.id, client_1.BalanceChangeType.TRANSACTION_EXPENSE, `Expense: ${name}`);
            if (customCategoriesId && customCategoriesId.length > 0) {
                const validCategories = await prisma.customCategory.findMany({
                    where: {
                        id: { in: customCategoriesId },
                        OR: [{ userId: userId }, { type: "SYSTEM" }],
                        deletedAt: null,
                    },
                });
                if (validCategories.length !== customCategoriesId.length) {
                    throw new Error("One or more categories are invalid or don't belong to the user");
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
    async transferFundsDefault(userId, amount, fromAccountId, toAccountId, type, currency) {
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
            throw new Error("Destination account not found or doesn't belong to the user");
        }
        if (fromAccount.amount < amount) {
            throw new Error(`Insufficient funds in source account. Available: ${fromAccount.amount} ${fromAccount.currency}, Required: ${amount} ${fromAccount.currency}`);
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
            await this.updateAccountBalance(prisma, fromAccountId, amount, false, transaction.id, client_1.BalanceChangeType.TRANSACTION_TRANSFER_OUT, `Transfer to account ${toAccount.name}`);
            await this.updateAccountBalance(prisma, toAccountId, amountToDeposit, true, transaction.id, client_1.BalanceChangeType.TRANSACTION_TRANSFER_IN, `Transfer from account ${fromAccount.name}`);
            return transaction;
        });
    }
    async executeRecurringPayment(userId, paymentId, amount, currency, fromAccountId, name, description, customCategoriesId) {
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
                throw new Error(`Exchange rate not found for conversion between ${currency} and ${account.currency}`);
            }
            amountToWithdraw = amount * (rates[currency] / rates[account.currency]);
        }
        if (account.amount < amountToWithdraw) {
            throw new Error(`Insufficient funds in account. Available: ${account.amount} ${account.currency}, Required: ${amountToWithdraw.toFixed(2)} ${account.currency}`);
        }
        return await this.prisma.$transaction(async (prisma) => {
            const transaction = await prisma.transaction.create({
                data: {
                    userId: userId,
                    name: name,
                    fromAccountId: fromAccountId,
                    description: description,
                    type: client_1.TransactionType.EXPENSE,
                    amount: amount,
                    currency: currency,
                },
                include: {
                    fromAccount: true,
                },
            });
            await this.updateAccountBalance(prisma, fromAccountId, amountToWithdraw, false, transaction.id, client_1.BalanceChangeType.TRANSACTION_EXPENSE, `Recurring payment: ${name}`);
            if (customCategoriesId && customCategoriesId.length > 0) {
                const validCategories = await prisma.customCategory.findMany({
                    where: {
                        id: { in: customCategoriesId },
                        OR: [{ userId: userId }, { type: "SYSTEM" }],
                        deletedAt: null,
                    },
                });
                if (validCategories.length !== customCategoriesId.length) {
                    throw new Error("One or more categories are invalid or don't belong to the user");
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
                }
                else {
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
                }
            }
            return transaction;
        });
    }
    async executeRecurringIncome(userId, paymentId, amount, currency, toAccountId, name, description, customCategoriesId) {
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
                throw new Error(`Exchange rate not found for conversion between ${currency} and ${account.currency}`);
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
                    type: client_1.TransactionType.INCOME,
                    amount: amount,
                    currency: currency,
                },
                include: {
                    toAccount: true,
                },
            });
            await this.updateAccountBalance(prisma, toAccountId, amountToDeposit, true, transaction.id, client_1.BalanceChangeType.TRANSACTION_INCOME, `Recurring income: ${name}`);
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
                }
                else {
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
                }
            }
            return transaction;
        });
    }
    async manualBalanceAdjustment(userId, accountId, amount, changeType, description) {
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
            await this.updateAccountBalance(prisma, accountId, Math.abs(amount), amount > 0, null, changeType, description);
            return { success: true, message: `Balance adjusted by ${amount}` };
        });
    }
}
exports.TransactionRepository = TransactionRepository;
//# sourceMappingURL=transactionRepository.js.map