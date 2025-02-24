import { PrismaClient } from "@prisma/client";

export class PaymentsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
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
      console.log("Pamyent Repo " + emailNotification + " " + automaticPayment);
      const newPayment = await this.prisma.bill.create({
        data: {
          name,
          date,
          cost,
          currencyId,
          userId,
          emailNotification,
          automaticPayment,
        },
      });
      return newPayment;
    } catch (error) {
      console.error("Failed to insert payment:", error);
      throw new Error("Failed to insert payment");
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}
