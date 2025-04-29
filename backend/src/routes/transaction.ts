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

transaction.post("/addFundDefault", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, amount, fromSavingId, toAccountId, currency } = body;

    if (!userId || !fromSavingId || !toAccountId) {
      return c.json(
        {
          error:
            "Missing required fields (userId, amount, fromSavingId, toAccountId)",
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

    const result = await transactionController.addFundsDefault(c);

    return result;
  } catch (error) {
    console.error("Error in /addFundDefault route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

transaction.post("/createExpense", async (c) => {
  try {
    const body = await c.req.json();
    const {
      userId,
      amount,
      currency,
      fromAccountId,
      budgetId,
      customCategoriesId,
    } = body;

    if (!userId || !amount || !fromAccountId) {
      return c.json(
        {
          error: "Missing required fields (userId, amount, fromAccountId)",
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

    if (budgetId && customCategoriesId) {
      return c.json(
        { error: "Cannot specify both budgetId and customCategoriesId" },
        400
      );
    }

    if (customCategoriesId && !Array.isArray(customCategoriesId)) {
      return c.json({ error: "customCategoriesId must be an array" }, 400);
    }

    const result = await transactionController.createExpense(c);
    return result;
  } catch (error) {
    console.error("Error in /createExpense route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

transaction.post("/transferFundsDefault", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, amount, fromAccountId, toAccountId, type, currency } = body;
    if (!userId || !fromAccountId || !toAccountId) {
      return c.json(
        {
          error:
            "Missing required fields (userId, amount, fromAccountId, toAccountId)",
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
    const result = await transactionController.transferFundsDefault(c);
    return result;
  } catch (error) {
    console.error("Error in /trasnferFundsDefault route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default transaction;
