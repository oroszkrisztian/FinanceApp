"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const budgetControllers_1 = require("../controllers/budgetControllers");
const auth_1 = require("../middleware/auth");
const budget = new hono_1.Hono();
const budgetController = new budgetControllers_1.BudgetController();
budget.use("*", auth_1.verifyToken);
budget.post("/getAllUserBudgets", async (c) => {
    try {
        const userId = c.get("userId");
        const budgets = await budgetController.getAllBudgets(c, userId);
        return c.json(budgets);
    }
    catch (error) {
        console.error("Error in /getAllUserBudgets route:", error);
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
});
budget.post("/createUserBudgetWithCategories", async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        const { name, limitAmount, currency, categoryIds } = body;
        const budget = await budgetController.createUserBudgetWithCategories(c, userId, name, limitAmount, currency, categoryIds);
        return c.json(budget);
    }
    catch (error) {
        console.error("Error in /createUserBudgetWithCategories route:", error);
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
});
budget.post("/deleteUserBudget", async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        const { budgetId } = body;
        const budget = await budgetController.deleteUserBudget(c, userId, Number(budgetId));
        return c.json(budget);
    }
    catch (error) {
        console.error("Error in /deleteUserBudget route:", error);
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
});
budget.post("/updateUserBudget", async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        const { budgetId, name, limitAmount, currency, categoryIds } = body;
        const budget = await budgetController.updateUserBudget(c, userId, Number(budgetId), name, limitAmount, currency, categoryIds);
        return c.json(budget);
    }
    catch (error) {
        console.error("Error in /updateUserBudget route:", error);
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
});
exports.default = budget;
//# sourceMappingURL=budget.js.map