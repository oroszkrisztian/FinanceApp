import { Context } from "hono";
import { CategoriesService } from "../services/categoriesService";

export class CategoriesController {
  private categoriesService: CategoriesService;
  constructor() {
    this.categoriesService = new CategoriesService();
  }

  async getAllSystemCategories(c: Context) {
    try {
      const categories = await this.categoriesService.getAllSystemCategories();
      return categories;
    } catch (error) {
      console.log(
        "Error in CategoriesController.getAllSystemCategories:",
        error
      );
      throw new Error("Failed to get system categories");
    }
  }

  async getAllCategoriesForUser(c: Context, userId: number) {
    try {
      const allCategories =
        await this.categoriesService.getAllCategoriesForUser(userId);
      return allCategories;
    } catch (error) {
      console.log(
        "Error in CategoriesController.getAllCategoriesForUser:",
        error
      );
      throw new Error("Failed to get all categories");
    }
  }

  async createUserCategory(c: Context, userId: number, categoryName: string) {
    try {
      const createUserCategory =
        await this.categoriesService.createUserCategory(userId, categoryName);
      return c.json(createUserCategory);
    } catch (error) {
      console.log(
        "Error in CategoriesController.createUserCategory:",
        error
      );
      throw new Error("Failed to create user category");
    }
  }
}
