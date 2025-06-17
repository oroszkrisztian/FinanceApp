"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsRepository = void 0;
const client_1 = require("@prisma/client");
class PaymentsRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async createPayment(userId, name, amount, description, accountId, startDate, frequency, emailNotification, notificationDay, automaticPayment, type, currency, categoriesId, paymentId) {
        return await this.prisma.$transaction(async (tx) => {
            if (paymentId) {
                await tx.recurringBillCategory.deleteMany({
                    where: {
                        recurringFundAndBillId: paymentId,
                    },
                });
                const updatedPayment = await tx.recurringFundAndBill.update({
                    where: {
                        id: paymentId,
                        user: {
                            some: {
                                id: userId,
                            },
                        },
                    },
                    data: {
                        name: name,
                        amount: amount,
                        description: description,
                        accountId: accountId,
                        frequency: frequency,
                        emailNotification: emailNotification,
                        notificationDay: notificationDay || 0,
                        automaticAddition: automaticPayment,
                        nextExecution: startDate,
                        type: type,
                        currency: currency,
                        ...(categoriesId &&
                            categoriesId.length > 0 && {
                            categories: {
                                create: categoriesId.map((categoryId) => ({
                                    customCategoryId: categoryId,
                                })),
                            },
                        }),
                    },
                    include: {
                        account: true,
                        user: true,
                        categories: {
                            include: {
                                customCategory: true,
                            },
                        },
                    },
                });
                return updatedPayment;
            }
            else {
                const payment = await tx.recurringFundAndBill.create({
                    data: {
                        name: name,
                        amount: amount,
                        description: description,
                        accountId: accountId,
                        frequency: frequency,
                        emailNotification: emailNotification,
                        notificationDay: notificationDay || 0,
                        automaticAddition: automaticPayment,
                        nextExecution: startDate,
                        type: type,
                        currency: currency,
                        user: {
                            connect: { id: userId },
                        },
                        ...(categoriesId &&
                            categoriesId.length > 0 && {
                            categories: {
                                create: categoriesId.map((categoryId) => ({
                                    customCategoryId: categoryId,
                                })),
                            },
                        }),
                    },
                    include: {
                        account: true,
                        user: true,
                        categories: {
                            include: {
                                customCategory: true,
                            },
                        },
                    },
                });
                return payment;
            }
        });
    }
    async getAllPayments(userId) {
        const payments = await this.prisma.recurringFundAndBill.findMany({
            where: {
                user: {
                    some: {
                        id: userId,
                    },
                },
                deletedAt: null,
            },
            include: {
                account: true,
                user: true,
                categories: {
                    include: {
                        customCategory: true,
                    },
                    where: {
                        deletedAt: null,
                    },
                },
            },
            orderBy: {
                nextExecution: "asc",
            },
        });
        return payments;
    }
    async deletePayment(userId, paymentId) {
        return await this.prisma.$transaction(async (tx) => {
            await tx.recurringBillCategory.deleteMany({
                where: {
                    recurringFundAndBillId: paymentId,
                },
            });
            const deletedPayment = await tx.recurringFundAndBill.update({
                where: {
                    id: paymentId,
                    user: {
                        some: {
                            id: userId,
                        },
                    },
                },
                data: {
                    deletedAt: new Date(),
                },
            });
            return deletedPayment;
        });
    }
}
exports.PaymentsRepository = PaymentsRepository;
//# sourceMappingURL=paymentsRepository.js.map