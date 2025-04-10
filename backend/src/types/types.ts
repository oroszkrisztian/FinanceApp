export interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  categoryId: number;
}

export interface Budget {
  id: number;
  name: string;
  amount: number;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  id: number;
  budgetId: number;
  customCategoryId: number;
}
