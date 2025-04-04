import { User } from "./User";
import { BudgetCategory } from "./BudgetCategory";
import { RecurringFundAndBill } from "./RecurringFundAndBill";
import { Transaction } from "./Transaction";
import { CategoryType } from "./enums";

export interface CustomCategory {
  id: number;
  name: string;
  type: CategoryType;
  userId?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  user?: User;
  budgets: BudgetCategory[];
  recurringBills: RecurringFundAndBill[];
  transactions: Transaction[];
}