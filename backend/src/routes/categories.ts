import { Hono } from "hono";
import { CategoriesController } from "../controllers/categoriesController";
import { TransactionRepository } from "../repositories/transactionRepository";
import { CategoriesRepository } from "../repositories/categoriesRepository";

const categories = new Hono();
const categoriesController = new CategoriesController();
const categoriesRepository = new CategoriesRepository();

categories.post("/getAllCategoriesForUser", async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json(
        {
          error: "Missing userId in /getAllCategoriesForUser",
        },
        400
      );
    }

    const allcategories= await categoriesController.getAllCategoriesForUser(
      c,
      Number(userId)
    );
    return c.json(allcategories);
  } catch (error) {
    console.error("Error in /getAllCategoriesForUser route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

categories.post("/createUserCategory", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, categoryName } = body;

    if (!userId) {
      return c.json(
        {
          error: "Missing userId in /createUserCategory",
        },
        400
      );
    }

    const result = await categoriesController.createUserCategory(
      c,
      userId,
      categoryName
    );
    return c.json(result);
  } catch (error) {
    console.error("Error in /createUserCategory route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default categories;
