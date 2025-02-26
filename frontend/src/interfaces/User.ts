import { Account } from "./Account";
import { Budget } from "./Budget";
import { CustomCategory } from "./CustomCategory";
import { RecurringFundAndBill } from "./RecurringFundAndBill";
import { Transaction } from "./Transaction";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  recurringFundsAndBills: RecurringFundAndBill[];
  customCategories: CustomCategory[];
}