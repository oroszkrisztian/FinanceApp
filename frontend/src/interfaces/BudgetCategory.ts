import { Budget } from "./Budget";
import { CustomCategory } from "./CustomCategory";

export interface BudgetCategory {
  id: number;
  budgetId: number;
  customCategoryId: number;
  
  budget: Budget;
  customCategory: CustomCategory;
}