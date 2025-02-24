import { Context } from "hono";
import { PaymentsService } from "../services/paymentsService";

export class PaymentsController {
  private paymentsService: PaymentsService;

  constructor() {
    this.paymentsService = new PaymentsService();
  }

  async createPayment(c: Context) {
    const {
      name,
      date,
      cost,
      currencyId,
      userId,
      emailNotification,
      automaticPayment,
    } = await c.req.json();

    // Validate required fields
    if (!name || !date || !cost || !currencyId || !userId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log("Pamyent control " + emailNotification + " " + automaticPayment)

    try {
      const newPayment = await this.paymentsService.insertPayment(
        name,
        new Date(date),
        parseFloat(cost),
        parseInt(currencyId, 10),
        parseInt(userId, 10),
        emailNotification,
        automaticPayment
      );

      return c.json(newPayment, 201);
    } catch (error) {
      console.error("Error in PaymentsController.createPayment:", error);
      return c.json({ error: "Failed to create payment" }, 500);
    }
  }

  async disconnect() {
    await this.paymentsService.disconnect();
  }
}
