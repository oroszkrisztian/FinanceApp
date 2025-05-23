import { CurrencyType, Frequency, PaymentType } from "@prisma/client";
import { PaymentsRepository } from "../repositories/paymentsRepository";

export class PaymentsService {
  private paymentsRepo: PaymentsRepository;

  constructor() {
    this.paymentsRepo = new PaymentsRepository();
  }

  async createPayment(
    userId: number,
    name: string,
    amount: number,
    description: string | null,
    accountId: number,
    startDate: Date,
    frequency: Frequency,
    emailNotification: boolean,
    notificationDay : number,
    automaticPayment: boolean,
    type: PaymentType,
    currency: CurrencyType,
    categoriesId: number[] | null,
    paymentId?: number 
  ) {
    try {
      const newPayment = await this.paymentsRepo.createPayment(
        userId,
        name,
        amount,
        description,
        accountId,
        startDate,
        frequency,
        emailNotification,
        notificationDay ,
        automaticPayment,
        type,
        currency,
        categoriesId,
        paymentId
      );
      return newPayment;
    } catch (error) {
      console.error("Error in PaymentsService.createPayment:", error);
      throw new Error("Failed to create payment");
    }
  }

  async getAllPayments(userId: number) {
    try {
      const allPayments = await this.paymentsRepo.getAllPayments(userId);
      return allPayments;
    } catch (error) {
      console.error("Error in PaymentsService.getAllPayments:", error);
      throw new Error("Failed to get all payments");
    }
  }

  async deletePayment(userId: number, paymentId: number) {
    try {
      const deletedPayment = await this.paymentsRepo.deletePayment(
        userId,
        paymentId
      );
      return deletedPayment;
    } catch (error) {
      console.error("Error in PaymentsService.deletePayment:", error);
      throw new Error("Failed to delete payment");
    }
  }
}
