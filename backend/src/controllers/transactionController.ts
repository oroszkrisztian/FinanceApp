import { Context } from "hono";
import { TransactionService } from "../services/transactionService";
import { TransactionType } from "@prisma/client";

export class TransactionController {
  private transactionService: TransactionService;
  
  constructor() {
    this.transactionService = new TransactionService();
  }
  
  async addFundsDefaultAccount(
    c: Context
  ) {
    try {
      const { userId, name, description, amount, type, toAccountId, customCategoryId } = await c.req.json();
      
      if (!userId || !name || !amount || !type || !toAccountId) {
        return c.json({ error: "Fill all necessary fields" }, 400);
      }
      
      const newFundAccount = await this.transactionService.addFundsDefaultAccount(
        userId,
        name,
        description,
        amount,
        type,
        toAccountId,
        customCategoryId
      );
      
      return c.json(newFundAccount);
    } catch (error) {
      console.error("Add funds to default account error:", error);
      return c.json({ error: "Failed to add funds to default account" }, 500);
    }
  }

    async fetchDefaultAccountBalance(c: Context) {
        try {
        const { userId, accountId } = await c.req.json();
        
        if (!userId || !accountId) {
            return c.json({ error: "Fill all necessary fields" }, 400);
        }
        
        const balance = await this.transactionService.fetchDefaultAccountBalance(
            userId,
            accountId
        );
        
        return c.json(balance);
        } catch (error) {
        console.error("Fetch default account balance error:", error);
        return c.json({ error: "Failed to fetch default account balance" }, 500);
        }
    }
}