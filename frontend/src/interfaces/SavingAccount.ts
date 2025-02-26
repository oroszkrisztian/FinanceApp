import { Account } from "./Account";
import { CurrencyType } from "./enums";
import { Transaction } from "./Transaction";


export interface SavingAccount {
  id: number;
  accountId: number;
  targetAmount: number;
  startDate: Date;
  targetDate?: Date;
  description?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  currency: CurrencyType;
  transactions: Transaction[];
  account: Account;
}