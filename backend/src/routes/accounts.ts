import { Hono } from "hono";
import { AccountsController } from "../controllers/accountsController";

const accounts = new Hono();
const accountsController = new AccountsController();

accounts.get("/getAll", async (c) => {
  try {
    const userId = c.req.query("userId");

    if (!userId || isNaN(Number(userId))) {
      return c.json({ error: "Invalid or missing userId" }, 400);
    }

    return await accountsController.getAllAccounts(c, Number(userId));
  } catch (error) {
    console.error("Error in /getAll route:", error);
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

export default accounts;
