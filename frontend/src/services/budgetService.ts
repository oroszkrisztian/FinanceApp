import { CurrencyType } from "../interfaces/enums";

export const getAllBudgets = async (userId: number) => {
  try {
    const response = await fetch(
      `http://localhost:3000/budget/getAllUserBudgets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch budgets: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();
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
  userId: number,
  name: string,
  limitAmount: number,
  currency: CurrencyType,
  categoryIds: number[]
) => {
  try {
    const response = await fetch(
      `http://localhost:3000/budget/createUserBudgetWithCategories`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name,
          limitAmount,
          currency,
          categoryIds,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to create budget");
    }
    const data = await response.json();
    console.log("Created budget data:", data);
    return data;
  } catch (error) {
    console.error("Error creating budget:", error);
    throw error;
  }
};
