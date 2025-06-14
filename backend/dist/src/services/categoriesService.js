"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const categoriesRepository_1 = require("../repositories/categoriesRepository");
class CategoriesService {
    categoriesRepository;
    constructor() {
        this.categoriesRepository = new categoriesRepository_1.CategoriesRepository();
    }
    async getAllSystemCategories() {
        try {
            return await this.categoriesRepository.getAllSystemCategories();
        }
        catch (error) {
            console.log("Error in CategoriesService.getAllSystemCategories:", error);
            throw new Error("Failed to get system categories");
        }
    }
    async getAllCategoriesForUser(userId) {
        try {
            return await this.categoriesRepository.getAllCategoriesForUser(userId);
        }
        catch (error) {
            console.log("Error in CategoriesService.getAllCategoriesForUser:", error);
            throw new Error("Failed to get all categories");
        }
    }
    async createUserCategory(userId, categoryName) {
        try {
            return await this.categoriesRepository.createUserCategory(userId, categoryName);
        }
        catch (error) {
            console.log("Error in CategoriesService.createUserCategory:", error);
            throw new Error("Failed to create user category");
        }
    }
}
exports.CategoriesService = CategoriesService;
//# sourceMappingURL=categoriesService.js.map