import { Hono } from "hono";
import { CategoriesController } from "../controllers/categoriesController";
import { TransactionRepository } from "../repositories/transactionRepository";
import { CategoriesRepository } from "../repositories/categoriesRepository";
import { verifyToken } from "../middleware/auth";

const categories = new Hono();
const categoriesController = new CategoriesController();
const categoriesRepository = new CategoriesRepository();

categories.use("*", verifyToken);

categories.post("/getAllCategoriesForUser", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;

    const allcategories = await categoriesController.getAllCategoriesForUser(
      c,
      userId
    );
    return c.json(allcategories);
  } catch (error) {
    console.error("Error in /getAllCategoriesForUser route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

categories.post("/createUserCategory", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    const body = await c.req.json();
    const { categoryName } = body;

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