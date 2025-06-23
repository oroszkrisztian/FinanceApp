import { TransactionType } from "../interfaces/enums";
import { api } from "./apiHelpers";

export const getUserAllTransactions = async () => {
  try {
    const data = await api.post("transaction/getUserAllTransactions", {});

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
    return await api.post("transaction/addFundDefaultAccount", {
      name,
      description,
      amount,
      type,
      toAccountId,
      customCategoriesId,
      currency,
    });
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
    return await api.post("transaction/addFundSaving", {
      amount,
      fromAccountId,
      toSavingId,
      type,
      currency,
    });
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
    return await api.post("transaction/addFundDefault", {
      amount,
      fromSavingId,
      toAccountId,
      type,
      currency,
    });
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
    return await api.post("transaction/createExpense", {
      name,
      amount,
      currency,
      fromAccountId,
      description,
      customCategoriesId,
    });
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
    return await api.post("transaction/transferFundsDefault", {
      amount,
      fromAccountId,
      toAccountId,
      type,
      currency,
    });
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
    return await api.post("transaction/executeRecurringPayment", {
      paymentId,
      amount,
      currency,
      fromAccountId,
      name,
      description,
      customCategoriesId,
    });
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
    return await api.post("transaction/executeRecurringIncome", {
      paymentId,
      amount,
      currency,
      toAccountId,
      name,
      description,
      customCategoriesId,
    });
  } catch (err) {
    console.error("Error executing recurring income:", err);
    throw err;
  }
};
