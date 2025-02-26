import { User } from "./User";
import { Budget } from "./Budget";
import { RecurringFundAndBill } from "./RecurringFundAndBill";
import { Transaction } from "./Transaction";

export interface CustomCategory {
  id: number;
  name: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  user: User;
  budgets: Budget[];
  recurringBills: RecurringFundAndBill[];
  transactions: Transaction[];
}