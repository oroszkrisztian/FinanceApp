import { api } from "./apiHelpers";

export const getAllBudgets = async () => {
  try {
    const data = await api.post("budget/getAllUserBudgets", {});
    console.log("Budgets data:", data);

    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      console.warn("Empty budget data received from the server");
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw error;
  }
};

export const createUserBudgetWithCategories = async (
  name: string,
  limitAmount: number,
  currency: string,
  categoryIds: number[]
) => {
  try {
    return await api.post("budget/createUserBudgetWithCategories", {
      name,
      limitAmount,
      currency,
      categoryIds,
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    throw error;
  }
};

export const deleteUserBudget = async (budgetId: number) => {
  try {
    return await api.post("budget/deleteUserBudget", {
      budgetId,
    });
  } catch (error) {
    console.error("Error deleting budget:", error);
    throw error;
  }
};

export const updateUserBudget = async (
  budgetId: number,
  name: string,
  limitAmount: number,
  currency: string,
  categoryIds: number[]
) => {
  console.log("Updating budget with data:", {
    budgetId,
    name,
    limitAmount,
    currency,
    categoryIds,
  });

  try {
    return await api.post("budget/updateUserBudget", {
      budgetId,
      name,
      limitAmount,
      currency,
      categoryIds,
    });
  } catch (error) {
    console.error("Error updating budget:", error);
    throw error;
  }
};
