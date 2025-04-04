import { Account } from "./Account";




export interface SavingAccount {
  id: number;
  accountId: number;
  targetAmount: number;
  startDate: Date;
  targetDate?: Date;
  isCompleted: boolean;
  account: Account;
} 