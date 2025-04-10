export type CurrencyType =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "AUD"
  | "CAD"
  | "CHF"
  | "CNY"
  | "SEK"
  | "NZD";

export type TransactionType = "income" | "expense" | "transfer";

export type Budget = {
  id: number;
  name: string;
  limitAmount: number;
  currentSpent: number;
  userId: number;
  currency: CurrencyType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  transactions?: Transaction[];
};

export type Transaction = {
  id: number;
  amount: number;
  date: Date;
  name?: string | null;
  description?: string | null;
  type: TransactionType;
  currency: CurrencyType;
  customCategoryId?: number | null;
  fromAccountId?: number | null;
  toAccountId?: number | null;
  userId: number;
  budgetId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};
