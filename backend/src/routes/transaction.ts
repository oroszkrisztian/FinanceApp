import { Hono } from "hono";
import { TransactionController } from "../controllers/transactionController";
import { verifyToken } from "../middleware/auth";

const transaction = new Hono();
const transactionController = new TransactionController();

transaction.use("*", verifyToken);

transaction.post("/getUserAllTransactions", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;

    const transactions = await transactionController.getUserAllTransactions(c, userId);

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
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { name, description, amount, type, toAccountId, currency, customCategoriesId } = body;

    if (!name || !amount || !type || !toAccountId) {
      return c.json(
        {
          error: "Missing required fields (name, amount, type, toAccountId)",
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

    const result = await transactionController.addFundsDefaultAccount(
      c,
      userId,
      name,
      description || null,
      amount,
      type,
      toAccountId,
      customCategoriesId || null,
      currency
    );

    return result;
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
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { amount, fromAccountId, toSavingId, type, currency } = body;

    if (!fromAccountId || !toSavingId) {
      return c.json(
        {
          error: "Missing required fields (amount, fromAccountId, toSavingId)",
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

    const result = await transactionController.addFundsSaving(
      c,
      userId,
      amount,
      fromAccountId,
      toSavingId,
      type,
      currency
    );

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
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { amount, fromSavingId, toAccountId, type, currency } = body;

    if (!fromSavingId || !toAccountId) {
      return c.json(
        {
          error: "Missing required fields (amount, fromSavingId, toAccountId)",
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

    const result = await transactionController.addFundsDefault(
      c,
      userId,
      amount,
      fromSavingId,
      toAccountId,
      type,
      currency
    );

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
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const {
      name,
      amount,
      currency,
      fromAccountId,
      budgetId,
      description,
      customCategoriesId,
    } = body;

    if (!amount || !fromAccountId) {
      return c.json(
        {
          error: "Missing required fields (amount, fromAccountId)",
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

    const result = await transactionController.createExpense(
      c,
      userId,
      name || null,
      amount,
      currency,
      fromAccountId,
      budgetId || null,
      description || null,
      customCategoriesId || null
    );

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
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { amount, fromAccountId, toAccountId, type, currency } = body;

    if (!fromAccountId || !toAccountId) {
      return c.json(
        {
          error: "Missing required fields (amount, fromAccountId, toAccountId)",
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

    const result = await transactionController.transferFundsDefault(
      c,
      userId,
      amount,
      fromAccountId,
      toAccountId,
      type,
      currency
    );

    return result;
  } catch (error) {
    console.error("Error in /transferFundsDefault route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

transaction.post("/executeRecurringPayment", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const {
      paymentId,
      amount,
      currency,
      fromAccountId,
      name,
      description,
      customCategoriesId,
    } = body;

    if (!paymentId || !amount || !fromAccountId || !name) {
      return c.json(
        {
          error: "Missing required fields (paymentId, amount, fromAccountId, name)",
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

    const result = await transactionController.executeRecurringPayment(
      c,
      userId,
      paymentId,
      amount,
      currency,
      fromAccountId,
      name,
      description || null,
      customCategoriesId || null
    );

    return result;
  } catch (error) {
    console.error("Error in /executeRecurringPayment route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

transaction.post("/executeRecurringIncome", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const {
      paymentId,
      amount,
      currency,
      toAccountId,
      name,
      description,
      customCategoriesId,
    } = body;

    if (!paymentId || !amount || !toAccountId || !name) {
      return c.json(
        {
          error: "Missing required fields (paymentId, amount, toAccountId, name)",
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

    const result = await transactionController.executeRecurringIncome(
      c,
      userId,
      paymentId,
      amount,
      currency,
      toAccountId,
      name,
      description || null,
      customCategoriesId || null
    );

    return result;
  } catch (error) {
    console.error("Error in /executeRecurringIncome route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default transaction;