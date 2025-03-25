import { Context } from "hono";
import { CategoriesService } from "../services/categoriesService";


export class CategoriesController {
    private categoriesService: CategoriesService
    constructor() {
      this.categoriesService = new CategoriesService();
    }

    async getAllSystemCategories(c: Context) {
      try {
        const categories = await this.categoriesService.getAllSystemCategories();
        return categories
      } catch (error) {
        console.log("Error in CategoriesController.getAllSystemCategories:", error);
        throw new Error("Failed to get system categories");
      }
    }
}