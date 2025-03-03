import { TransactionType } from "../interfaces/enums";

export const addFundsDefaultAccount = async (
  userId: number,
  name: string,
  description: string,
  amount: number,
  type: TransactionType,
  toAccountId: number,
  customCategoryId: number | null
) => {
  try {
    const response = await fetch(
      "http://localhost:3000/transaction/addFundDefaultAccount",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name,
          description,
          amount,
          type,
          toAccountId,
          customCategoryId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to add funds to default account"
      );
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error adding funds to default account:", err);
    throw err;
  }
};
