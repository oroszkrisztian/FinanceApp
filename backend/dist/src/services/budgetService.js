"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetService = void 0;
const budgetRepository_1 = require("../repositories/budgetRepository");
class BudgetService {
    budgetRepository;
    constructor() {
        this.budgetRepository = new budgetRepository_1.BudgetRepository();
    }
    async getAllBudgets(userId) {
        try {
            return await this.budgetRepository.getAllBudgets(userId);
        }
        catch (error) {
            console.log("Error in BudgetService.getAllBudgets:", error);
            throw new Error("Failed to get budgets");
        }
    }
    async createUserBudgetWithCategories(userId, name, limitAmount, currency, categoryIds) {
        try {
            return await this.budgetRepository.createUserBudgetWithCategories(userId, name, limitAmount, currency, categoryIds);
        }
        catch (error) {
            console.log("Error in BudgetService.createUserBudgetWithCategories:", error);
            throw new Error("Failed to create budget");
        }
    }
    async deleteUserBudget(userId, budgetId) {
        try {
            return await this.budgetRepository.deleteUserBudget(userId, budgetId);
        }
        catch (error) {
            console.log("Error in BudgetService.deleteUserBudget:", error);
            throw new Error("Failed to delete budget");
        }
    }
    async updateUserBudget(userId, budgetId, name, limitAmount, currency, categoryIds) {
        try {
            return await this.budgetRepository.updateUserBudget(userId, budgetId, name, limitAmount, currency, categoryIds);
        }
        catch (error) {
            console.log("Error in BudgetService.updateUserBudget:", error);
            throw new Error("Failed to update budget");
        }
    }
}
exports.BudgetService = BudgetService;
//# sourceMappingURL=budgetService.js.map