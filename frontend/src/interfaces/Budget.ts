import { CustomCategory } from "./CustomCategory";
import { CurrencyType } from "./enums";
import { Transaction } from "./Transaction";
import { User } from "./User";

export interface Budget {
  id: number;
  name: string;
  limitAmount: number;
  currentSpent: number;
  customCategoryId?: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  currency: CurrencyType;
  user: User;
  customCategory?: CustomCategory;
  transactions: Transaction[];
}