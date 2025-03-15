import { Account } from "./Account";
import { CustomCategory } from "./CustomCategory";
import { CurrencyType, TransactionType } from "./enums";
import { RecurringFundAndBill } from "./RecurringFundAndBill";
import { SavingAccount } from "./SavingAccount";


export interface Transaction {
  id: number;
  amount: number;
  date: Date;
  name: string;
  description?: string;
  type: TransactionType;
  currency: CurrencyType;
  customCategoryId?: number;
  fromAccountId?: number;
  toAccountId?: number;
  userId: number,
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;  
}