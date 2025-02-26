import { Account } from "./Account";
import { CustomCategory } from "./CustomCategory";
import { TransactionType } from "./enums";
import { RecurringFundAndBill } from "./RecurringFundAndBill";
import { SavingAccount } from "./SavingAccount";


export interface Transaction {
  id: number;
  amount: number;
  date: Date;
  name: string;
  description?: string;
  type: TransactionType;
  customCategoryId?: number;
  fromAccountId?: number;
  toAccountId?: number;
  savingAccountId?: number;
  recurringFundId?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  fromAccount?: Account;
  toAccount?: Account;
  customCategory?: CustomCategory;
  savingAccount?: SavingAccount;
  recurringFund?: RecurringFundAndBill;
}