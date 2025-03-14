import { Hono } from "hono";
import { TransactionController } from "../controllers/transactionController";

const transaction = new Hono();
const transactionController = new TransactionController();

transaction.post("/getUserAllTransactions", async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json(
        {
          error: "Missing userId in /getUserAllTransactions",
        },
        400
      );
    }

    const transactions = await transactionController.getUserAllTransactions(c);

    console.log("Sending transactions to client:", transactions);

    return c.json(transactions);
  } catch (error) {
    console.error("Error in /getUserAllTransactions route:", error);

    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});
transaction.post("/addFundDefaultAccount", async (c) => {
  try {
    const body = await c.req.json();

    const { userId, name, amount, type, toAccountId, currency } = body;
    if (!userId || !name || !amount || !type || !toAccountId) {
      return c.json(
        {
          error:
            "Missing required fields (userId, name, amount, type, toAccountId)",
        },
        400
      );
    }

    if (!currency) {
      return c.json({
        error: "Missing currency",
      });
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

transaction.post("/addFundSaving", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, amount, fromAccountId, toSavingId, currency } = body;

    if (!userId || !fromAccountId || !toSavingId) {
      return c.json(
        {
          error:
            "Missing required fields (userId, name, amount, fromAccountId, toSavingId)",
        },
        400
      );
    }

    if (!currency) {
      return c.json({
        error: "Missing currency",
      });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return c.json({ error: "Amount must be a positive number" }, 400);
    }

    const result = await transactionController.addFundsSaving(c);
    return result;
  } catch (error) {
    console.error("Error in /addFundSaving route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default transaction;
