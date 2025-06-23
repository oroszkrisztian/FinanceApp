import { api } from "./apiHelpers";

export const getAllBudgets = async () => {
  try {
    const data = await api.post("budget/getAllUserBudgets", {});

    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      return [];
    }

    return data;
  } catch (error) {
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
    throw error;
  }
};

export const deleteUserBudget = async (budgetId: number) => {
  try {
    return await api.post("budget/deleteUserBudget", {
      budgetId,
    });
  } catch (error) {
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
  try {
    return await api.post("budget/updateUserBudget", {
      budgetId,
      name,
      limitAmount,
      currency,
      categoryIds,
    });
  } catch (error) {
    throw error;
  }
};
