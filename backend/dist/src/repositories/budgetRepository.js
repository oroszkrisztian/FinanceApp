"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetRepository = void 0;
const client_1 = require("@prisma/client");
const transactionRepository_1 = require("./transactionRepository");
class BudgetRepository {
    prisma;
    transactionRepo;
    constructor() {
        this.prisma = new client_1.PrismaClient();
        this.transactionRepo = new transactionRepository_1.TransactionRepository();
    }
    async getAllBudgets(userId) {
        const allBudgets = await this.prisma.budget.findMany({
            where: {
                userId: userId,
                deletedAt: null,
            },
            include: {
                budgetCategories: {
                    where: {
                        deletedAt: null,
                    },
                    select: {
                        customCategory: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        });
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const rates = await this.transactionRepo.getExchangeRates();
        const updatedBudgets = [];
        for (const budget of allBudgets) {
            try {
                const budgetCategoryIds = budget.budgetCategories.map((bc) => bc.customCategory.id);
                let totalSpent = 0;
                if (budgetCategoryIds.length > 0) {
                    const transactions = await this.prisma.transaction.findMany({
                        where: {
                            userId: userId,
                            type: "EXPENSE",
                            deletedAt: null,
                            date: {
                                gte: new Date(currentYear, currentMonth, 1),
                                lt: new Date(currentYear, currentMonth + 1, 1),
                            },
                            transactionCategories: {
                                some: {
                                    customCategoryId: {
                                        in: budgetCategoryIds,
                                    },
                                    deletedAt: null,
                                },
                            },
                        },
                        select: {
                            amount: true,
                            currency: true,
                        },
                    });
                    for (const transaction of transactions) {
                        let transactionAmount = Math.abs(transaction.amount);
                        if (transaction.currency !== budget.currency) {
                            if (rates[transaction.currency] && rates[budget.currency]) {
                                transactionAmount =
                                    transactionAmount *
                                        (rates[transaction.currency] / rates[budget.currency]);
                            }
                        }
                        totalSpent += transactionAmount;
                    }
                }
                const updatedBudget = await this.prisma.budget.update({
                    where: { id: budget.id },
                    data: { currentSpent: totalSpent },
                    include: {
                        budgetCategories: {
                            where: {
                                deletedAt: null,
                            },
                            select: {
                                customCategory: {
                                    select: {
                                        id: true,
                                        name: true,
                                        type: true,
                                    },
                                },
                            },
                        },
                    },
                });
                updatedBudgets.push({
                    ...updatedBudget,
                    customCategories: updatedBudget.budgetCategories.map((bc) => bc.customCategory),
                });
            }
            catch (error) {
                console.error(`Error calculating spent for budget ${budget.id}:`, error);
                updatedBudgets.push({
                    ...budget,
                    customCategories: budget.budgetCategories.map((bc) => bc.customCategory),
                });
            }
        }
        return updatedBudgets;
    }
    async createUserBudgetWithCategories(userId, name, limitAmount, currency, categoryIds) {
        const budget = await this.prisma.budget.create({
            data: {
                name,
                limitAmount,
                currentSpent: 0,
                userId,
                currency,
            },
        });
        if (categoryIds && categoryIds.length > 0) {
            await this.prisma.budgetCategory.createMany({
                data: categoryIds.map((categoryId) => ({
                    budgetId: budget.id,
                    customCategoryId: categoryId,
                })),
            });
        }
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const rates = await this.transactionRepo.getExchangeRates();
        try {
            if (categoryIds && categoryIds.length > 0) {
                const transactions = await this.prisma.transaction.findMany({
                    where: {
                        userId: userId,
                        type: "EXPENSE",
                        deletedAt: null,
                        date: {
                            gte: new Date(currentYear, currentMonth, 1),
                            lt: new Date(currentYear, currentMonth + 1, 1),
                        },
                        transactionCategories: {
                            some: {
                                customCategoryId: {
                                    in: categoryIds,
                                },
                                deletedAt: null,
                            },
                        },
                    },
                    select: {
                        amount: true,
                        currency: true,
                    },
                });
                let totalSpent = 0;
                for (const transaction of transactions) {
                    let transactionAmount = Math.abs(transaction.amount);
                    if (transaction.currency !== currency) {
                        if (rates[transaction.currency] && rates[currency]) {
                            transactionAmount =
                                transactionAmount *
                                    (rates[transaction.currency] / rates[currency]);
                        }
                    }
                    totalSpent += transactionAmount;
                }
                await this.prisma.budget.update({
                    where: { id: budget.id },
                    data: { currentSpent: totalSpent },
                });
            }
        }
        catch (error) {
            console.error(`Error calculating initial spent for budget ${budget.id}:`, error);
        }
        return await this.prisma.budget.findUnique({
            where: { id: budget.id },
            include: {
                budgetCategories: {
                    where: {
                        deletedAt: null,
                    },
                    select: {
                        customCategory: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async deleteUserBudget(userId, budgetId) {
        return await this.prisma.budget.update({
            where: {
                id: budgetId,
                userId: userId,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }
    async updateUserBudget(userId, budgetId, name, limitAmount, currency, categoryIds) {
        const existingBudget = await this.prisma.budget.findFirst({
            where: {
                id: budgetId,
                userId: userId,
                deletedAt: null,
            },
        });
        if (!existingBudget) {
            throw new Error("Budget not found or doesn't belong to the user");
        }
        let updatedCurrentSpent = existingBudget.currentSpent;
        if (existingBudget.currency !== currency) {
            const rates = await this.transactionRepo.getExchangeRates();
            if (!rates[existingBudget.currency] || !rates[currency]) {
                throw new Error(`Exchange rate not found for conversion between ${existingBudget.currency} and ${currency}`);
            }
            updatedCurrentSpent =
                existingBudget.currentSpent *
                    (rates[existingBudget.currency] / rates[currency]);
        }
        const updatedBudget = await this.prisma.budget.update({
            where: {
                id: budgetId,
                userId: userId,
            },
            data: {
                name,
                limitAmount,
                currency,
                currentSpent: updatedCurrentSpent,
            },
        });
        await this.prisma.budgetCategory.deleteMany({
            where: { budgetId },
        });
        if (categoryIds && categoryIds.length > 0) {
            await this.prisma.budgetCategory.createMany({
                data: categoryIds.map((categoryId) => ({
                    budgetId: updatedBudget.id,
                    customCategoryId: categoryId,
                })),
            });
        }
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const rates = await this.transactionRepo.getExchangeRates();
        try {
            if (categoryIds && categoryIds.length > 0) {
                const transactions = await this.prisma.transaction.findMany({
                    where: {
                        userId: userId,
                        type: "EXPENSE",
                        deletedAt: null,
                        date: {
                            gte: new Date(currentYear, currentMonth, 1),
                            lt: new Date(currentYear, currentMonth + 1, 1),
                        },
                        transactionCategories: {
                            some: {
                                customCategoryId: {
                                    in: categoryIds,
                                },
                                deletedAt: null,
                            },
                        },
                    },
                    select: {
                        amount: true,
                        currency: true,
                    },
                });
                let totalSpent = 0;
                for (const transaction of transactions) {
                    let transactionAmount = Math.abs(transaction.amount);
                    if (transaction.currency !== currency) {
                        if (rates[transaction.currency] && rates[currency]) {
                            transactionAmount =
                                transactionAmount *
                                    (rates[transaction.currency] / rates[currency]);
                        }
                    }
                    totalSpent += transactionAmount;
                }
                await this.prisma.budget.update({
                    where: { id: updatedBudget.id },
                    data: { currentSpent: totalSpent },
                });
            }
            else {
                await this.prisma.budget.update({
                    where: { id: updatedBudget.id },
                    data: { currentSpent: 0 },
                });
            }
        }
        catch (error) {
            console.error(`Error recalculating spent for budget ${budgetId}:`, error);
        }
        return await this.prisma.budget.findUnique({
            where: { id: updatedBudget.id },
            include: {
                budgetCategories: {
                    where: {
                        deletedAt: null,
                    },
                    select: {
                        customCategory: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        });
    }
}
exports.BudgetRepository = BudgetRepository;
//# sourceMappingURL=budgetRepository.js.map