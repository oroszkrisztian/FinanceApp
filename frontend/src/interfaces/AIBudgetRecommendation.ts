export interface AIBudgetRecommendation {
  action: "create" | "update" | "delete";
  budgetId: number | null;
  name: string;
  limitAmount: number;
  currency: string;
  categoryIds: number[];
  reason?: string;
}
