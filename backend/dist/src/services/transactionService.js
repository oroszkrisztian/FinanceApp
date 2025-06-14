"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const transactionRepository_1 = require("../repositories/transactionRepository");
class TransactionService {
    transactionRepo;
    constructor() {
        this.transactionRepo = new transactionRepository_1.TransactionRepository();
    }
    async getUserAllTransactions(userId) {
        try {
            const allTransactions = await this.transactionRepo.getUserAllTransactions(userId);
            return allTransactions;
        }
        catch (error) {
            console.error("Error in TransactionService.getUserAllTransactions:", error);
            throw new Error("Failed to add funds to default account");
        }
    }
    async addFundsDefaultAccount(userId, name, description, amount, type, toAccountId, customCategoriesId, currency) {
        try {
            const newFundAccount = await this.transactionRepo.addFundsDefaultAccount(userId, name, description, amount, type, toAccountId, customCategoriesId, currency);
            return newFundAccount;
        }
        catch (error) {
            console.error("Error in TransactionService.addFundsDefaultAccount:", error);
            throw new Error("Failed to add funds to default account");
        }
    }
    async addFundsSaving(userId, amount, fromAccountId, toSavingId, type, currency) {
        try {
            const savingTransaction = await this.transactionRepo.addFundsSaving(userId, amount, fromAccountId, toSavingId, type, currency);
            return savingTransaction;
        }
        catch (error) {
            console.error("Error in TransactionService.addFundsSaving:", error);
            throw new Error("Failed to add funds to savings account");
        }
    }
    async addFundsDefault(userId, amount, fromSavingId, toAccountId, type, currency) {
        try {
            const defaultTransaction = await this.transactionRepo.addFundsDefault(userId, amount, fromSavingId, toAccountId, type, currency);
            return defaultTransaction;
        }
        catch (error) {
            console.error("Error in TransactionService.addFundsDefault:", error);
            throw new Error("Failed to add funds to default account");
        }
    }
    async createExpense(amount, currency, userId, name, fromAccountId, description, customCategoriesId) {
        try {
            const expenseTransaction = await this.transactionRepo.createExpense(amount, currency, userId, name, fromAccountId, description, customCategoriesId);
            return expenseTransaction;
        }
        catch (error) {
            console.error("Error in TransactionService.createExpense:", error);
            throw new Error("Failed to create expense");
        }
    }
    async transferFundsDefault(userId, amount, fromAccountId, toAccountId, type, currency) {
        try {
            const transferTransaction = await this.transactionRepo.transferFundsDefault(userId, amount, fromAccountId, toAccountId, type, currency);
            return transferTransaction;
        }
        catch (error) {
            console.error("Error in TransactionService.trasnferFundsDefault:", error);
            throw new Error("Failed to transfer funds");
        }
    }
    async executeRecurringPayment(userId, paymentId, amount, currency, fromAccountId, name, description, customCategoriesId) {
        try {
            const transaction = await this.transactionRepo.executeRecurringPayment(userId, paymentId, amount, currency, fromAccountId, name, description, customCategoriesId);
            return transaction;
        }
        catch (error) {
            console.error("Error in TransactionService.executeRecurringPayment:", error);
            throw new Error("Failed to execute recurring payment");
        }
    }
    async executeRecurringIncome(userId, paymentId, amount, currency, toAccountId, name, description, customCategoriesId) {
        try {
            const transaction = await this.transactionRepo.executeRecurringIncome(userId, paymentId, amount, currency, toAccountId, name, description, customCategoriesId);
            return transaction;
        }
        catch (error) {
            console.error("Error in TransactionService.executeRecurringIncome:", error);
            throw new Error("Failed to execute recurring income");
        }
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=transactionService.js.map