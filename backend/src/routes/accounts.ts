import { Hono } from "hono";
import { AccountsController } from "../controllers/accountsController";

const accounts = new Hono();
const accountsController = new AccountsController();

accounts.get("/getAllAccounts", async (c) => {
  try {
    const userId = c.req.query("userId");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    // Parse optional date parameters
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate && endDate) {
      try {
        parsedStartDate = new Date(startDate);
        parsedEndDate = new Date(endDate);

        // Validate that the dates are valid
        if (
          isNaN(parsedStartDate.getTime()) ||
          isNaN(parsedEndDate.getTime())
        ) {
          return c.json({ error: "Invalid date format" }, 400);
        }

        // Validate that startDate is before endDate
        if (parsedStartDate > parsedEndDate) {
          return c.json({ error: "startDate must be before endDate" }, 400);
        }
      } catch (error) {
        return c.json({ error: "Invalid date format" }, 400);
      }
    }

    return await accountsController.getAllAccounts(
      c,
      Number(userId),
      parsedStartDate,
      parsedEndDate
    );
  } catch (error) {
    console.error("Error in /getAllAccounts route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

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

    const account = await accountsController.createDefaultAccount(
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

accounts.delete("/deleteDefaultAccount", async (c) => {
  try {
    const userId = c.req.query("userId");
    const accountId = c.req.query("accountId");

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    if (!accountId || isNaN(Number(accountId))) {
      return c.json({ error: "Invalid or missing accountId" }, 400);
    }

    await accountsController.deleteDefaultAccount(
      c,
      Number(userId),
      Number(accountId)
    );

    return c.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error in /deleteAccount route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

accounts.delete("/deleteSavingAccount", async (c) => {
  try {
    const userId = c.req.query("userId");
    const accountId = c.req.query("accountId");

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    if (!accountId || isNaN(Number(accountId))) {
      return c.json({ error: "Invalid or missing accountId" }, 400);
    }

    await accountsController.deleteSavingAccount(
      c,
      Number(userId),
      Number(accountId)
    );

    return c.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error in /deleteAccount route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

accounts.post("/editDefaultAccount", async (c) => {
  try {
    const userId = c.req.query("userId");
    const accountId = c.req.query("accountId");
    const body = await c.req.json();
    const { name, description, currency, accountType, amount } = body;

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    if (!accountId || isNaN(Number(accountId))) {
      return c.json({ error: "Invalid or missing accountId" }, 400);
    }

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    await accountsController.editDefaultAccount(
      c,
      Number(userId),
      Number(accountId),
      name,
      description || "",
      currency,
      accountType,
      amount
    );

    return c.json({ message: "Account edited successfully" });
  } catch (error) {
    console.error("Error in /editDefaultAccount route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

accounts.post("/editSavingAccount", async (c) => {
  try {
    const userId = c.req.query("userId");
    const accountId = c.req.query("accountId");
    const body = await c.req.json();
    console.log("Request Body:", body);

    const { name, description, currency, accountType } = body;

    const targetAmount = body.savingAccount?.update?.targetAmount;
    const targetDate = body.savingAccount?.update?.targetDate;

    console.log("targetDate:", targetDate);

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    if (!accountId || isNaN(Number(accountId))) {
      return c.json({ error: "Invalid or missing accountId" }, 400);
    }

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    if (targetDate === undefined) {
      return c.json({ error: "Date is required" }, 400);
    }

    await accountsController.editSavingAccount(
      c,
      Number(userId),
      Number(accountId),
      name,
      description || "",
      currency,
      accountType,
      targetAmount,
      new Date(targetDate)
    );

    return c.json({ message: "Account edited successfully" });
  } catch (error) {
    console.error("Error in /editSavingAccount route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default accounts;
