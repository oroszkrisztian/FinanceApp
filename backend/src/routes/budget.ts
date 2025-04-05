import { Hono } from "hono";
import { BudgetController } from "../controllers/budgetControllers";

const budget = new Hono();
const budgetController = new BudgetController();

budget.post("/getAllUserBudgets", async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json(
        {
          error: "Missing userId in /getAllUserBudgets",
        },
        400
      );
    }

    const budgets = await budgetController.getAllBudgets(c, Number(userId));

    console.log("Sending budgets to client:", budgets);

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
    const body = await c.req.json();
    const { userId, name, limitAmount, currency, categoryIds } = body;

    if (!userId) {
      return c.json(
        {
          error: "Missing userId in /createUserBudgetWithCategories",
        },
        400
      );
    }

    const budget = await budgetController.createUserBudgetWithCategories(
      c,
      Number(userId),
      name,
      limitAmount,
      currency,
      categoryIds
    );

    console.log("Sending created budget to client:", budget);

    return c.json(budget);
  } catch (error) {
    console.error("Error in /createUserBudgetWithCategories route:", error);

    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});


export default budget;
