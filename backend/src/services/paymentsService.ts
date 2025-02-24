import { PaymentsRepository } from "../repositories/paymentsRepository";

export class PaymentsService {
  private paymentsRepo: PaymentsRepository;

  constructor() {
    this.paymentsRepo = new PaymentsRepository();
  }

  async insertPayment(
    name: string,
    date: Date,
    cost: number,
    currencyId: number,
    userId: number,
    emailNotification: boolean = false,
    automaticPayment: boolean = false
  ) {
    try {
      console.log(
        "Pamyent service " + emailNotification + " " + automaticPayment
      );
      const newPayment = await this.paymentsRepo.insertPayment(
        name,
        date,
        cost,
        currencyId,
        userId,
        emailNotification,
        automaticPayment
      );
      return newPayment;
    } catch (error) {
      console.error("Error in PaymentsService.insertPayment:", error);
      throw new Error("Failed to insert payment");
    }
  }

  async disconnect() {
    await this.paymentsRepo.disconnect();
  }
}
