"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsController = void 0;
const accountsService_1 = require("../services/accountsService");
class AccountsController {
    accountService;
    constructor() {
        this.accountService = new accountsService_1.AccountsService();
    }
    async getAllAccounts(c, userId, startDate, endDate) {
        try {
            if (!userId) {
                throw "User id not found";
            }
            const accounts = await this.accountService.getAllAccounts(userId, startDate, endDate);
            return c.json(accounts);
        }
        catch (error) {
            console.error("Get accounts error:", error);
        }
    }
    async getDefaultAccounts(c, userId) {
        try {
            if (!userId) {
                throw "User id not found";
            }
            const accounts = await this.accountService.getDefaultAccounts(userId);
            return c.json(accounts);
        }
        catch (error) {
            console.error("Get accounts error:", error);
        }
    }
    async getSavingAccounts(c, userId) {
        try {
            if (!userId) {
                throw "User id not found";
            }
            const savingAccounts = await this.accountService.getSavingAccounts(userId);
            return c.json(savingAccounts);
        }
        catch (error) {
            console.error("Get savingAccounts error:", error);
        }
    }
    async createDefaultAccount(c, userId, accountType, currencyType, name, description) {
        if (!accountType || !currencyType || !name) {
            throw "Fill all necessary fields";
        }
        else if (!userId) {
            throw "User id not found";
        }
        try {
            const account = await this.accountService.createDefaultAccount(userId, accountType, currencyType, name, description);
            return c.json(account);
        }
        catch (error) {
            console.error("Create default account error:", error);
        }
    }
    async createSavingAccount(c, userId, accountType, currencyType, name, description, targetAmount, targetDate) {
        if (!accountType || !currencyType || !name) {
            throw "Fill all necessary fields";
        }
        else if (!userId) {
            throw "User id not found";
        }
        try {
            const account = await this.accountService.createSavingAccount(userId, accountType, currencyType, name, description, targetAmount, targetDate);
            return c.json(account);
        }
        catch (error) {
            console.error("Create saving account error:", error);
        }
    }
    async searchAccountByString(c, userId, searchString) {
        try {
            if (!userId) {
                throw new Error("User id not found");
            }
            const accounts = await this.accountService.searchAccountByString(userId, searchString);
            return c.json(accounts);
        }
        catch (error) {
            console.error("Search account error:", error);
            throw error;
        }
    }
    async deleteDefaultAccount(c, userId, accountId) {
        try {
            if (!userId) {
                throw new Error("User id not found");
            }
            await this.accountService.deleteDefaultAccount(userId, accountId);
            return c.json({ message: "Account deleted successfully" });
        }
        catch (error) {
            console.error("Delete account error:", error);
            throw error;
        }
    }
    async deleteSavingAccount(c, userId, accountId) {
        try {
            if (!userId) {
                throw new Error("User id not found");
            }
            await this.accountService.deleteSavingAccount(userId, accountId);
            return c.json({ message: "Account deleted successfully" });
        }
        catch (error) {
            console.error("Delete account error:", error);
            throw error;
        }
    }
    async editDefaultAccount(c, userId, accountId, name, description, currency, accountType, amount) {
        try {
            if (!userId) {
                throw new Error("User id not found");
            }
            await this.accountService.editDefaultAccount(userId, accountId, name, description, currency, accountType, amount);
            return c.json({ message: "Account edited successfully" });
        }
        catch (error) {
            console.error("Edit account error:", error);
            throw error;
        }
    }
    async editSavingAccount(c, userId, accountId, name, description, currency, accountType, targetAmount, targetDate) {
        try {
            if (!userId) {
                throw new Error("User id not found");
            }
            await this.accountService.editSavingAccount(userId, accountId, name, description, currency, accountType, targetAmount, targetDate);
            return c.json({ message: "Account edited successfully" });
        }
        catch (error) {
            console.error("Edit account error:", error);
            throw error;
        }
    }
}
exports.AccountsController = AccountsController;
//# sourceMappingURL=accountsController.js.map