import { CategoriesRepository } from "../repositories/categoriesRepository";

export class CategoriesService {
  private categoriesRepository: CategoriesRepository;
  constructor() {
    this.categoriesRepository = new CategoriesRepository();
  }

  async getAllSystemCategories() {
    try {
      return await this.categoriesRepository.getAllSystemCategories();
    } catch (error) {
      console.log("Error in CategoriesService.getAllSystemCategories:", error);
      throw new Error("Failed to get system categories");
    }
  }
}
