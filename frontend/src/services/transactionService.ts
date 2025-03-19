import { CurrencyType, TransactionType } from "../interfaces/enums";

export const getUserAllTransactions = async (userId: number) => {
  try {
    console.log("Fetching transactions for userId:", userId);

    const response = await fetch(
      "http://localhost:3000/transaction/getUserAllTransactions",
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      }
    );

    console.log("Response status:", response.status);
    const responseText = await response.text();
    console.log("Raw response text:", responseText);

    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Parsed data type:", typeof data);
      console.log("Is array:", Array.isArray(data));
      console.log("Data length:", Array.isArray(data) ? data.length : "N/A");
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      throw new Error("Failed to parse server response");
    }

    if (!response.ok) {
      throw new Error(
        (typeof data === "object" && data?.error) ||
          "Failed to get all transactions"
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Error getUserAllTransactions in frontend transactionService.ts:",
      error
    );
    throw error;
  }
};

export const addFundsDefaultAccount = async (
  userId: number,
  name: string | null,
  description: string | null,
  amount: number,
  type: TransactionType,
  toAccountId: number,
  customCategoryId: number | null,
  currency: CurrencyType
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
          currency,
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

export const addFundsSaving = async (
  userId: number,
  amount: number,
  fromAccountId: number,
  toSavingId: number,
  type: TransactionType,
  currency: CurrencyType
) => {
  try {
    const response = await fetch(
      "http://localhost:3000/transaction/addFundSaving",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
          fromAccountId,
          toSavingId,
          type,
          currency,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to add funds to savings account"
      );
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error adding funds to savings account:", err);
    throw err;
  }
};
