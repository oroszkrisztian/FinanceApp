"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const paymentsRepository_1 = require("../repositories/paymentsRepository");
class PaymentsService {
    paymentsRepo;
    constructor() {
        this.paymentsRepo = new paymentsRepository_1.PaymentsRepository();
    }
    async createPayment(userId, name, amount, description, accountId, startDate, frequency, emailNotification, notificationDay, automaticPayment, type, currency, categoriesId, paymentId) {
        try {
            const newPayment = await this.paymentsRepo.createPayment(userId, name, amount, description, accountId, startDate, frequency, emailNotification, notificationDay, automaticPayment, type, currency, categoriesId, paymentId);
            return newPayment;
        }
        catch (error) {
            console.error("Error in PaymentsService.createPayment:", error);
            throw new Error("Failed to create payment");
        }
    }
    async getAllPayments(userId) {
        try {
            const allPayments = await this.paymentsRepo.getAllPayments(userId);
            return allPayments;
        }
        catch (error) {
            console.error("Error in PaymentsService.getAllPayments:", error);
            throw new Error("Failed to get all payments");
        }
    }
    async deletePayment(userId, paymentId) {
        try {
            const deletedPayment = await this.paymentsRepo.deletePayment(userId, paymentId);
            return deletedPayment;
        }
        catch (error) {
            console.error("Error in PaymentsService.deletePayment:", error);
            throw new Error("Failed to delete payment");
        }
    }
}
exports.PaymentsService = PaymentsService;
//# sourceMappingURL=paymentService.js.map