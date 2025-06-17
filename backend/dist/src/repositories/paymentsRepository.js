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
                console.log("🔄 Starting payment update process...");
                console.log("📊 Update parameters:", {
                    paymentId,
                    userId,
                    name,
                    amount,
                    description,
                    accountId,
                    startDate,
                    frequency,
                    emailNotification,
                    notificationDay,
                    automaticPayment,
                    type,
                    currency,
                    categoriesId
                });
                console.log("🗑️ Deleting existing categories for payment:", paymentId);
                await tx.recurringBillCategory.deleteMany({
                    where: {
                        recurringFundAndBillId: paymentId,
                    },
                });
                console.log("✅ Existing categories deleted");
                console.log("📝 Preparing update data...");
                const updateData = {
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
                };
                console.log("💾 Update data prepared:", updateData);
                console.log("🎯 automaticAddition value:", automaticPayment);
                const updatedPayment = await tx.recurringFundAndBill.update({
                    where: {
                        id: paymentId,
                        user: {
                            some: {
                                id: userId,
                            },
                        },
                    },
                    data: updateData,
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
                console.log("✅ Payment updated successfully!");
                console.log("📋 Updated payment result:", {
                    id: updatedPayment.id,
                    name: updatedPayment.name,
                    amount: updatedPayment.amount,
                    automaticAddition: updatedPayment.automaticAddition,
                    emailNotification: updatedPayment.emailNotification,
                    notificationDay: updatedPayment.notificationDay,
                    frequency: updatedPayment.frequency,
                    categoriesCount: updatedPayment.categories.length
                });
                return updatedPayment;
            }
            else {
                console.log("🆕 Creating new payment...");
                console.log("📊 Create parameters:", {
                    userId,
                    name,
                    amount,
                    automaticPayment,
                    emailNotification
                });
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
                console.log("✅ Payment created successfully!");
                console.log("📋 Created payment result:", {
                    id: payment.id,
                    name: payment.name,
                    automaticAddition: payment.automaticAddition
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