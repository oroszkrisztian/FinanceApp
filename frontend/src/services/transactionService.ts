import { TransactionType } from "../interfaces/enums";
import { getAuthHeaders, handleApiResponse } from "./apiHelpers";

export const getUserAllTransactions = async () => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/transaction/getUserAllTransactions",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      }
    );

    console.log("Response status:", response.status);
    const data = await handleApiResponse(response);

    console.log("Parsed data type:", typeof data);
    console.log("Is array:", Array.isArray(data));
    console.log("Data length:", Array.isArray(data) ? data.length : "N/A");

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
      "https://financeapp-bg0k.onrender.com/transaction/addFundDefaultAccount",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
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

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error adding funds to default account:", err);
    throw err;
  }
};

export const addFundsSaving = async (
  amount: number,
  fromAccountId: number,
  toSavingId: number,
  type: TransactionType,
  currency: string
) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/transaction/addFundSaving",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount,
          fromAccountId,
          toSavingId,
          type,
          currency,
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error adding funds to savings account:", err);
    throw err;
  }
};

export const addFundsDefault = async (
  amount: number,
  fromSavingId: number,
  toAccountId: number,
  type: TransactionType,
  currency: string
) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/transaction/addFundDefault",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount,
          fromSavingId,
          toAccountId,
          type,
          currency,
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error adding funds to default account:", err);
    throw err;
  }
};

export const createExpense = async (
  name: string | null,
  amount: number,
  currency: string,
  fromAccountId: number,
  description: string | null,
  customCategoriesId: number[] | null
) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/transaction/createExpense",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          amount,
          currency,
          fromAccountId,
          description,
          customCategoriesId,
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error creating expense:", err);
    throw err;
  }
};

export const transferFundsDefault = async (
  amount: number,
  fromAccountId: number,
  toAccountId: number,
  type: TransactionType,
  currency: string
) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/transaction/transferFundsDefault",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount,
          fromAccountId,
          toAccountId,
          type,
          currency,
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error transferring funds to default account:", err);
    throw err;
  }
};

export const executeRecurringPayment = async (
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
      "https://financeapp-bg0k.onrender.com/transaction/executeRecurringPayment",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
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

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error executing recurring payment:", err);
    throw err;
  }
};

export const executeRecurringIncome = async (
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
      "https://financeapp-bg0k.onrender.com/transaction/executeRecurringIncome",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          paymentId,
          amount,
          currency,
          toAccountId,
          name,
          description,
          customCategoriesId,
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error executing recurring income:", err);
    throw err;
  }
};
