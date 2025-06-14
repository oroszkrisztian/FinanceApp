"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesController = void 0;
const categoriesService_1 = require("../services/categoriesService");
class CategoriesController {
    categoriesService;
    constructor() {
        this.categoriesService = new categoriesService_1.CategoriesService();
    }
    async getAllSystemCategories(c) {
        try {
            const categories = await this.categoriesService.getAllSystemCategories();
            return categories;
        }
        catch (error) {
            console.log("Error in CategoriesController.getAllSystemCategories:", error);
            throw new Error("Failed to get system categories");
        }
    }
    async getAllCategoriesForUser(c, userId) {
        try {
            const allCategories = await this.categoriesService.getAllCategoriesForUser(userId);
            return allCategories;
        }
        catch (error) {
            console.log("Error in CategoriesController.getAllCategoriesForUser:", error);
            throw new Error("Failed to get all categories");
        }
    }
    async createUserCategory(c, userId, categoryName) {
        try {
            const createUserCategory = await this.categoriesService.createUserCategory(userId, categoryName);
            return c.json(createUserCategory);
        }
        catch (error) {
            console.log("Error in CategoriesController.createUserCategory:", error);
            throw new Error("Failed to create user category");
        }
    }
}
exports.CategoriesController = CategoriesController;
//# sourceMappingURL=categoriesController.js.map