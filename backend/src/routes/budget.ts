import { Hono } from "hono";
import { BudgetController } from "../controllers/budgetControllers";
import { verifyToken } from "../middleware/auth";

const budget = new Hono();
const budgetController = new BudgetController();

budget.use("*", verifyToken);

budget.post("/getAllUserBudgets", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;

    const budgets = await budgetController.getAllBudgets(c, userId);


    return c.json(budgets);
  } catch (error) {
    console.error("Error in /getAllUserBudgets route:", error);

    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});

budget.post("/createUserBudgetWithCategories", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { name, limitAmount, currency, categoryIds } = body;

    const budget = await budgetController.createUserBudgetWithCategories(
      c,
      userId,
      name,
      limitAmount,
      currency,
      categoryIds
    );


    return c.json(budget);
  } catch (error) {
    console.error("Error in /createUserBudgetWithCategories route:", error);

    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});

budget.post("/deleteUserBudget", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { budgetId } = body;

    const budget = await budgetController.deleteUserBudget(
      c,
      userId,
      Number(budgetId)
    );
    return c.json(budget);
  } catch (error) {
    console.error("Error in /deleteUserBudget route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

budget.post("/updateUserBudget", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { budgetId, name, limitAmount, currency, categoryIds } = body;

    const budget = await budgetController.updateUserBudget(
      c,
      userId,
      Number(budgetId),
      name,
      limitAmount,
      currency,
      categoryIds
    );


    return c.json(budget);
  } catch (error) {
    console.error("Error in /updateUserBudget route:", error);

    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});

export default budget;