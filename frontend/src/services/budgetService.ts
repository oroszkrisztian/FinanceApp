import { getAuthHeaders, handleApiResponse } from "./apiHelpers";

export const getAllBudgets = async () => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/budget/getAllUserBudgets`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      }
    );

    const data = await handleApiResponse(response);
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
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/budget/createUserBudgetWithCategories`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          limitAmount,
          currency,
          categoryIds,
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error("Error creating budget:", error);
    throw error;
  }
};

export const deleteUserBudget = async (budgetId: number) => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/budget/deleteUserBudget`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          budgetId,
        }),
      }
    );

    return await handleApiResponse(response);
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
    categoryIds
  });
  
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/budget/updateUserBudget`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          budgetId,
          name,
          limitAmount,
          currency,
          categoryIds,
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error("Error updating budget:", error);
    throw error;
  }
};