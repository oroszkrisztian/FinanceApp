import { CurrencyType, Frequency, PaymentType } from "./enums";
import { Account } from "./Account";
import { User } from "./User";
import { CustomCategory } from "./CustomCategory";

export interface Payments {
  id: number;
  name: string;
  amount: number;
  description?: string;
  accountId: number;
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
  
  account: Account;
  user: User[];
  categories: RecurringBillCategory[];
}

export interface RecurringBillCategory {
  id: number;
  recurringFundAndBillId: number;
  customCategoryId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  recurringFundAndBill: Payments;
  customCategory: CustomCategory;
}