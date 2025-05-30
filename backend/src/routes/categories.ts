import { Hono } from "hono";
import { CategoriesController } from "../controllers/categoriesController";
import { TransactionRepository } from "../repositories/transactionRepository"; 
import { CategoriesRepository } from "../repositories/categoriesRepository";

const categories = new Hono();
const categoriesController = new CategoriesController();


categories.post("/getAllSystemCategories", async (c) => {
  try {
    const systemCategories = await categoriesController.getAllSystemCategories(c);
    return c.json(systemCategories);
  } catch (error) {
    console.error("Error in /getAllSystemCategories route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});



export default categories;