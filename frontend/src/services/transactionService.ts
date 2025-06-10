import { TransactionType } from "../interfaces/enums";

export const getUserAllTransactions = async (userId: number) => {
  try {
    const response = await fetch(
      "http://localhost:3000/transaction/getUserAllTransactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
  customCategoriesId: number[] | null,
  currency: string
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
          customCategoriesId,
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
  currency: string
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

export const addFundsDefault = async (
  userId: number,
  amount: number,
  fromSavingId: number,
  toAccountId: number,
  type: TransactionType,
  currency: string
) => {
  try {
    const response = await fetch(
      "http://localhost:3000/transaction/addFundDefault",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
          fromSavingId,
          toAccountId,
          type,
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

export const createExpense = async (
  userId: number,
  name: string | null,
  amount: number,
  currency: string,
  fromAccountId: number,
  budgetId: number | null,
  description: string | null,
  customCategoriesId: number[] | null
) => {
  try {
    const response = await fetch(
      "http://localhost:3000/transaction/createExpense",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name,
          amount,
          currency,
          fromAccountId,
          budgetId,
          description,
          customCategoriesId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create expense");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating expense:", err);
    throw err;
  }
};

export const transferFundsDefault = async (
  userId: number,
  amount: number,
  fromAccountId: number,
  toAccountId: number,
  type: TransactionType,
  currency: string
) => {
  try {
    const response = await fetch(
      "http://localhost:3000/transaction/transferFundsDefault",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
          fromAccountId,
          toAccountId,
          type,
          currency,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to transfer funds to default account"
      );
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error transferring funds to default account:", err);
    throw err;
  }
};

export const executeRecurringPayment = async (
  userId: number,
  paymentId: number,
  amount: number,
  currency: string,
  fromAccountId: number,
  name: string,
  description: string | null,
  customCategoriesId: number[] | null
) => {
  try {
    const response = await fetch(
      "http://localhost:3000/transaction/executeRecurringPayment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          paymentId,
          amount,
          currency,
          fromAccountId,
          name,
          description,
          customCategoriesId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to execute recurring payment");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error executing recurring payment:", err);
    throw err;
  }
};

export const executeRecurringIncome = async (
  userId: number,
  paymentId: number,
  amount: number,
  currency: string,
  toAccountId: number,
  name: string,
  description: string | null,
  customCategoriesId: number[] | null
) => {
  try {
    const response = await fetch(
      "http://localhost:3000/transaction/executeRecurringIncome",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          paymentId,
          amount,
          currency,
          toAccountId,
          name,
          description,
          customCategoriesId
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to execute recurring income");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error executing recurring income:", err);
    throw err;
  }
};
