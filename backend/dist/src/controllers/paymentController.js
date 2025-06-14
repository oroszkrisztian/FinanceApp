"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const paymentService_1 = require("../services/paymentService");
class PaymentsController {
    paymentsService;
    constructor() {
        this.paymentsService = new paymentService_1.PaymentsService();
    }
    async createPayment(c, userId, name, amount, description, accountId, startDate, frequency, emailNotification, notificationDay, automaticPayment, type, currency, categoriesId, paymentId) {
        try {
            if (!name || !amount || !accountId || !frequency || !type || !currency) {
                return c.json({ error: "Fill all necessary fields" }, 400);
            }
            if (amount <= 0) {
                return c.json({ error: "Amount must be greater than zero" }, 400);
            }
            const newPayment = await this.paymentsService.createPayment(userId, name, amount, description, accountId, startDate, frequency, emailNotification || false, notificationDay || 0, automaticPayment || false, type, currency, categoriesId || null, paymentId);
            return c.json(newPayment);
        }
        catch (error) {
            console.error("Create payment error:", error);
            return c.json({ error: "Failed to create payment" }, 500);
        }
    }
    async getAllPayments(c, userId) {
        try {
            if (!userId) {
                return c.json({ error: "User id not found" }, 400);
            }
            const allPayments = await this.paymentsService.getAllPayments(userId);
            return c.json(allPayments);
        }
        catch (error) {
            console.error("Controller.getAllPayments:", error);
            return c.json({ error: "Failed to get all payments" }, 500);
        }
    }
    async deletePayment(c, userId, paymentId) {
        try {
            if (!userId || !paymentId) {
                return c.json({ error: "Missing userId or paymentId" }, 400);
            }
            const deletedPayment = await this.paymentsService.deletePayment(userId, paymentId);
            return c.json({ success: true, data: deletedPayment });
        }
        catch (error) {
            console.error("Delete payment error:", error);
            return c.json({ error: "Failed to delete payment" }, 500);
        }
    }
}
exports.PaymentsController = PaymentsController;
//# sourceMappingURL=paymentController.js.map