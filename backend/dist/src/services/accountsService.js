"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const accountsRepository_1 = require("../repositories/accountsRepository");
class AccountsService {
    accountRepo;
    constructor() {
        this.accountRepo = new accountsRepository_1.AccountsRepository();
    }
    async getAllAccounts(userId, startDate, endDate) {
        try {
            return await this.accountRepo.getUserAllAccount(userId, startDate, endDate);
        }
        catch (error) {
            console.error("Service - Get accounts error:", error);
            throw error;
        }
    }
    async getDefaultAccounts(userId) {
        const accounts = await this.accountRepo.getUserDefaultAccounts(userId);
        return accounts;
    }
    async getSavingAccounts(userId) {
        const savingAccounts = await this.accountRepo.getUserSavingAccounts(userId);
        return savingAccounts;
    }
    async createDefaultAccount(userId, accountType, currencyType, name, description) {
        try {
            const newDefaultAccount = this.accountRepo.createDefaultAccount(userId, accountType, currencyType, name, description);
            return newDefaultAccount;
        }
        catch (error) {
            console.error("Error in AccountsService.createDefaultAccount:", error);
            throw new Error("Failed to create default account");
        }
    }
    async createSavingAccount(userId, accountType, currencyType, name, description, targetAmount, targetDate) {
        try {
            const newDefaultAccount = this.accountRepo.createSavingAccount(userId, accountType, currencyType, name, description, targetAmount, targetDate);
            return newDefaultAccount;
        }
        catch (error) {
            console.error("Error in AccountsService.createSavingAccount:", error);
            throw new Error("Failed to create saving account");
        }
    }
    async searchAccountByString(userId, searchString) {
        try {
            const accounts = await this.accountRepo.searchAccountByString(userId, searchString);
            return accounts;
        }
        catch (error) {
            console.error("Error in AccountsService.searchAccountByString:", error);
            throw new Error("Failed to search accounts");
        }
    }
    async deleteDefaultAccount(userId, accountId) {
        try {
            await this.accountRepo.deleteDefaultAccount(userId, accountId);
        }
        catch (error) {
            console.error("Error in AccountsService.deleteAccount:", error);
            throw new Error("Failed to delete account");
        }
    }
    async deleteSavingAccount(userId, accountId) {
        try {
            await this.accountRepo.deleteSavingAccount(userId, accountId);
        }
        catch (error) {
            console.error("Error in AccountsService.deleteSavingAccount:", error);
            throw new Error("Failed to delete saving account");
        }
    }
    async editDefaultAccount(userId, accountId, name, description, currency, accountType, amount) {
        try {
            await this.accountRepo.editDefaultAccount(userId, accountId, name, description, currency, accountType, amount);
        }
        catch (error) {
            console.error("Error in AccountsService.editDefaultAccount:", error);
            throw new Error("Failed to edit account");
        }
    }
    async editSavingAccount(userId, accountId, name, description, currency, accountType, targetAmount, targetDate) {
        try {
            await this.accountRepo.editSavingAccount(userId, accountId, name, description, currency, accountType, targetAmount, targetDate);
        }
        catch (error) {
            console.error("Error in AccountsService.editSavingAccount:", error);
            throw new Error("Failed to edit saving account");
        }
    }
}
exports.AccountsService = AccountsService;
//# sourceMappingURL=accountsService.js.map