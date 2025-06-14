"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsRepository = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const xml2js_1 = require("xml2js");
class AccountsRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async getUserAllAccount(userId, startDate, endDate) {
        const includeOptions = {
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
    async getUserDefaultAccounts(userId) {
        return await this.prisma.account.findMany({
            where: {
                userId: userId,
                type: client_1.AccountType.DEFAULT,
                deletedAt: null,
            },
        });
    }
    async getUserSavingAccounts(userId) {
        const savingAccount = await this.prisma.account.findMany({
            where: {
                userId: userId,
                type: client_1.AccountType.SAVINGS,
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
    async createDefaultAccount(userId, accountType, currencyType, name, description) {
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
    async createSavingAccount(userId, accountType, currencyType, name, description, targetAmount, targetDate) {
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
    async searchAccountByString(userId, searchString) {
        return await this.prisma.account.findMany({
            where: {
                userId: userId,
                type: client_1.AccountType.SAVINGS,
                name: {
                    contains: searchString,
                },
            },
            include: {
                savingAccount: true,
            },
        });
    }
    async deleteDefaultAccount(userId, accountId) {
        return await this.prisma.account.update({
            where: {
                id: accountId,
                userId: userId,
                type: client_1.AccountType.DEFAULT,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }
    async deleteSavingAccount(userId, accountId) {
        await this.prisma.account.update({
            where: {
                id: accountId,
                userId: userId,
                type: client_1.AccountType.SAVINGS,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }
    async recordBalanceChange(prisma, accountId, previousBalance, newBalance, changeType, currency, description) {
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
    async editDefaultAccount(userId, accountId, name, description, currency, accountType, amount) {
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
            const updateData = {
                name: name,
                description: description,
                currency: currency,
                updatedAt: new Date(),
            };
            if (amount !== undefined) {
                updateData.amount = amount;
                await this.recordBalanceChange(prisma, accountId, account.amount, amount, client_1.BalanceChangeType.MANUAL_ADJUSTMENT, currency, "Manual balance adjustment");
            }
            if (account.currency !== currency && amount === undefined) {
                await this.recordBalanceChange(prisma, accountId, account.amount, account.amount, client_1.BalanceChangeType.MANUAL_ADJUSTMENT, currency, `Currency changed from ${account.currency} to ${currency}`);
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
    async getExchangeRates() {
        try {
            const response = await axios_1.default.get("https://financeapp-bg0k.onrender.com/exchange-rates");
            const xmlText = response.data;
            const result = await (0, xml2js_1.parseStringPromise)(xmlText, {
                explicitArray: false,
                mergeAttrs: false,
            });
            const rates = { RON: 1 };
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
        }
        catch (error) {
            console.error("Error fetching exchange rates:", error);
            throw new Error("Failed to fetch exchange rates");
        }
    }
    async editSavingAccount(userId, accountId, name, description, currency, accountType, targetAmount, targetDate, amount) {
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
            const updateData = {
                name,
                description,
                updatedAt: new Date(),
            };
            if (account.currency !== currency || amount !== undefined) {
                updateData.currency = currency;
                let newAmount;
                if (amount !== undefined) {
                    newAmount = amount;
                }
                else if (account.currency !== currency) {
                    const rates = await this.getExchangeRates();
                    if (!rates[account.currency] || !rates[currency]) {
                        throw new Error(`Exchange rate not found for conversion between ${currency} and ${account.currency}`);
                    }
                    newAmount =
                        account.amount * (rates[account.currency] / rates[currency]);
                }
                else {
                    newAmount = account.amount;
                }
                updateData.amount = newAmount;
                await this.recordBalanceChange(prisma, accountId, account.amount, newAmount, client_1.BalanceChangeType.MANUAL_ADJUSTMENT, currency, account.currency !== currency
                    ? `Currency changed from ${account.currency} to ${currency}`
                    : "Manual balance adjustment");
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
exports.AccountsRepository = AccountsRepository;
//# sourceMappingURL=accountsRepository.js.map