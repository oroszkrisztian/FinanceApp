import { Hono } from "hono";
import { AccountsController } from "../controllers/accountsController";

const accounts = new Hono();
const accountsController = new AccountsController();

accounts.get("/getDefault", async (c) => {
  try {
    const userId = c.req.query("userId");

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    return await accountsController.getDefaultAccounts(c, Number(userId));
  } catch (error) {
    console.error("Error in /getDefault route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

accounts.get("/getSavings", async (c) => {
  try {
    const userId = c.req.query("userId");

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    return await accountsController.getSavingAccounts(c, Number(userId));
  } catch (error) {
    console.error("Error in /getSavings route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

accounts.post("/insertDefault", async (c) => {
  try {
    const userId = c.req.query("userId");
    const body = await c.req.json();
    const { accountType, currencyType, name, description } = body;

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    if (!accountType || !currencyType || !name) {
      return c.json({ error: "Fill all necessary fields" }, 400);
    }

    const account = await accountsController.createDEfaultAccount(
      c,
      Number(userId),
      accountType,
      currencyType,
      name,
      description || ""
    );

    return c.json(
      {
        message: "Default account inserted successfully",
        account,
      },
      201
    );
  } catch (error) {
    console.error("Error in /insertDefault route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

accounts.post("/insertSaving", async (c) => {
  try {
    const userId = c.req.query("userId");
    const body = await c.req.json();
    const {
      accountType,
      currencyType,
      name,
      description,
      targetAmount,
      targetDate,
    } = body;

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    if (!accountType || !currencyType || !name || !targetAmount) {
      return c.json({ error: "Fill all necessary fields" }, 400);
    }

    const account = await accountsController.createSavingAccount(
      c,
      Number(userId),
      accountType,
      currencyType,
      name,
      description || "",
      targetAmount,
      targetDate
    );

    return c.json(
      {
        message: "Saving account inserted successfully",
        account,
      },
      201
    );
  } catch (error) {
    console.error("Error in /insertSaving route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

accounts.get("/searchAccount", async (c) => {
  try {
    const userId = c.req.query("userId");
    const searchString = c.req.query("search");

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    if (!searchString) {
      return c.json({ error: "Search string is required" }, 400);
    }

    return await accountsController.searchAccountByString(
      c,
      Number(userId),
      searchString
    );

    
  } catch (error) {
    console.error("Error in /searchAccount route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default accounts;
