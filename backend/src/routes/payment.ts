import { Hono } from "hono";
import { PaymentsController } from "../controllers/paymentController";

const payments = new Hono();
const paymentsController = new PaymentsController();

payments.post("/createPayment", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, name, amount, accountId, startDate, frequency, type, currency } = body;

    if (
      !userId ||
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
            "Missing required fields (userId, name, amount, accountId, frequency, type, currency)",
        },
        400
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return c.json({ error: "Amount must be a positive number" }, 400);
    }

    if (body.categoriesId && !Array.isArray(body.categoriesId)) {
      return c.json({ error: "categoriesId must be an array" }, 400);
    }

    const result = await paymentsController.createPayment(c);
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
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json(
        {
          error: "Missing userId in /getAllPayments",
        },
        400
      );
    }

    const payments = await paymentsController.getAllPayments(c);
    return payments;
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
    const body = await c.req.json();
    const { userId, paymentId } = body;

    if (!userId || !paymentId) {
      return c.json(
        { error: "Missing required fields (userId, paymentId)" },
        400
      );
    }

    const result = await paymentsController.deletePayment(c);
    return result;
  } catch (error) {
    console.error("Error in /deletePayment route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default payments;
