import { CurrencyType, TransactionType } from "./enums";

export interface Transaction {
  id: number;
  amount: number;
  date: Date;
  name: string;
  description?: string;
  type: TransactionType;
  currency: CurrencyType;
  fromAccountId?: number;
  toAccountId?: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  transactionCategories?: {
    customCategoryId: number;
    customCategory?: {
      name: string;
    };
  }[];
}
