import { Hono } from "hono";
import { TransactionController } from "../controllers/transactionController";

const transaction = new Hono();
const transactionController = new TransactionController();

transaction.post("/addFundDefaultAccount", async (c) => {
  try {
    const body = await c.req.json();

    const { userId, name, amount, type, toAccountId } = body;
    if (!userId || !name || !amount || !type || !toAccountId) {
      return c.json(
        {
          error:
            "Missing required fields (userId, name, amount, type, toAccountId)",
        },
        400
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return c.json({ error: "Amount must be a positive number" }, 400);
    }

    const result = await transactionController.addFundsDefaultAccount(c);

    return c.json(result, 200);
  } catch (error) {
    console.error("Error in /addFundDefaultAccount route:", error);

    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});

export default transaction;
