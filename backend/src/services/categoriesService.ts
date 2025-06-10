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
  async getAllCategoriesForUser(userId:number){
    try {
      return await this.categoriesRepository.getAllCategoriesForUser(userId);
    } catch (error) {
      console.log("Error in CategoriesService.getAllCategoriesForUser:", error);
      throw new Error("Failed to get all categories");
    }
  }

  async createUserCategory(userId:number,categoryName:string){
    try {
      return await this.categoriesRepository.createUserCategory(userId,categoryName);
    } catch (error) {
      console.log("Error in CategoriesService.createUserCategory:", error);
      throw new Error("Failed to create user category");
    }
  }

}
