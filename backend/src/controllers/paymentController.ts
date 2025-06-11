import { Context } from "hono";
import { CurrencyType, Frequency, PaymentType } from "@prisma/client";
import { PaymentsService } from "../services/paymentService";

export class PaymentsController {
  private paymentsService: PaymentsService;

  constructor() {
    this.paymentsService = new PaymentsService();
  }

  async createPayment(
    c: Context,
    userId: number,
    name: string,
    amount: number,
    description: string,
    accountId: number,
    startDate: Date,
    frequency: Frequency,
    emailNotification: boolean,
    notificationDay: number,
    automaticPayment: boolean,
    type: PaymentType,
    currency: CurrencyType,
    categoriesId?: number[],
    paymentId?: number
  ) {
    try {
      if (!name || !amount || !accountId || !frequency || !type || !currency) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }

      if (amount <= 0) {
        return c.json({ error: "Amount must be greater than zero" }, 400);
      }

      const newPayment = await this.paymentsService.createPayment(
        userId,
        name,
        amount,
        description,
        accountId,
        startDate,
        frequency,
        emailNotification || false,
        notificationDay || 0,
        automaticPayment || false,
        type,
        currency,
        categoriesId || null,
        paymentId
      );

      return c.json(newPayment);
    } catch (error) {
      console.error("Create payment error:", error);
      return c.json({ error: "Failed to create payment" }, 500);
    }
  }

  async getAllPayments(c: Context, userId: number) {
    try {
      if (!userId) {
        return c.json({ error: "User id not found" }, 400);
      }

      const allPayments = await this.paymentsService.getAllPayments(userId);
      return c.json(allPayments);
    } catch (error) {
      console.error("Controller.getAllPayments:", error);
      return c.json({ error: "Failed to get all payments" }, 500);
    }
  }

  async deletePayment(c: Context, userId: number, paymentId: number) {
    try {
      if (!userId || !paymentId) {
        return c.json({ error: "Missing userId or paymentId" }, 400);
      }

      const deletedPayment = await this.paymentsService.deletePayment(
        userId,
        paymentId
      );

      return c.json({ success: true, data: deletedPayment });
    } catch (error) {
      console.error("Delete payment error:", error);
      return c.json({ error: "Failed to delete payment" }, 500);
    }
  }
}
