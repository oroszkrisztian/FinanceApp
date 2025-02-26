import { Account } from "./Account";
import { CustomCategory } from "./CustomCategory";
import { CurrencyType, Frequency, PaymentType } from "./enums";
import { Transaction } from "./Transaction";


export interface RecurringFundAndBill {
  id: number;
  name: string;
  amount: number;
  description?: string;
  accountId: number;
  startDate: Date;
  frequency: Frequency;
  isActive: boolean;
  emailNotification: boolean;
  notificationDay?: number;
  automaticAddition: boolean;
  lastExecution?: Date;
  nextExecution?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  type: PaymentType;
  currency: CurrencyType;
  customCategoryId?: number;
  account: Account;
  customCategory?: CustomCategory;
  transactions: Transaction[];
}