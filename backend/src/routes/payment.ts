import { Hono } from "hono";
import { PaymentsController } from "../controllers/paymentController";
import { verifyToken } from "../middleware/auth";

const payments = new Hono();
const paymentsController = new PaymentsController();

payments.use("*", verifyToken);

payments.post("/createPayment", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { 
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
      categoriesId,
      paymentId 
    } = body;

    if (
      !name ||
      !amount ||
      !accountId ||
      !startDate ||
      !frequency ||
      !type ||
      !currency
    ) {
      return c.json(
        {
          error:
            "Missing required fields (name, amount, accountId, frequency, type, currency)",
        },
        400
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return c.json({ error: "Amount must be a positive number" }, 400);
    }

    if (categoriesId && !Array.isArray(categoriesId)) {
      return c.json({ error: "categoriesId must be an array" }, 400);
    }

    const result = await paymentsController.createPayment(
      c,
      userId,
      name,
      amount,
      description,
      accountId,
      new Date(startDate),
      frequency,
      emailNotification || false,
      notificationDay || 0,
      automaticPayment || false,
      type,
      currency,
      categoriesId,
      paymentId
    );
    
    return result;
  } catch (error) {
    console.error("Error in /createPayment route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

payments.post("/getAllPayments", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;

    const result = await paymentsController.getAllPayments(c, userId);
    return result;
  } catch (error) {
    console.error("Error in /getAllPayments route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

payments.delete("/deletePayment", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { paymentId } = body;

    if (!paymentId) {
      return c.json(
        { error: "Missing required field (paymentId)" },
        400
      );
    }

    const result = await paymentsController.deletePayment(c, userId, Number(paymentId));
    return result;
  } catch (error) {
    console.error("Error in /deletePayment route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default payments;