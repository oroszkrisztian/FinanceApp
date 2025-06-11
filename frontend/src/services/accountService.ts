import { AccountType } from "../interfaces/enums";
import { Account } from "../interfaces/Account";
import { getAuthHeaders, handleApiResponse } from "./apiHelpers";

interface CreateDefaultAccountParams {
  accountType: AccountType;
  currencyType: string;
  name: string;
  description: string;
}

export const createDefaultAccount = async ({
  accountType,
  currencyType,
  name,
  description,
}: CreateDefaultAccountParams) => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/accounts/insertDefault`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          accountType,
          currencyType,
          name,
          description,
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error creating account:", err);
    throw err;
  }
};

export const createSavingAccount = async (
  accountType: AccountType,
  currencyType: string,
  name: string,
  description: string,
  targetAmount: number,
  targetDate: Date
) => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/accounts/insertSaving`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          accountType,
          currencyType,
          name,
          description,
          targetAmount,
          targetDate,
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error creating account:", err);
    throw err;
  }
};

export const fetchAllAccounts = async (
  startDate?: Date,
  endDate?: Date,
  signal?: AbortSignal
): Promise<Account[]> => {
  try {
    const queryParams = new URLSearchParams();

    if (startDate && endDate) {
      const adjustedStartDate = new Date(
        startDate.getTime() - startDate.getTimezoneOffset() * 60000
      );
      const adjustedEndDate = new Date(
        endDate.getTime() - endDate.getTimezoneOffset() * 60000
      );

      queryParams.append("startDate", adjustedStartDate.toISOString());
      queryParams.append("endDate", adjustedEndDate.toISOString());
    }

    const url = `https://financeapp-bg0k.onrender.com/accounts/getAllAccounts${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, { 
      headers: getAuthHeaders(),
      signal 
    });

    const data = await handleApiResponse(response);
    console.log("Fetched accounts:", data);

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format: Expected an array");
    }

    return data;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

export const fetchDefaultAccounts = async (
  signal?: AbortSignal
): Promise<Account[]> => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/accounts/getDefault`,
      { 
        headers: getAuthHeaders(),
        signal 
      }
    );

    const data = await handleApiResponse(response);
    console.log("Fetched accounts:", data);

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format: Expected an array");
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

export const fetchSavings = async (
  signal?: AbortSignal
): Promise<Account[]> => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/accounts/getSavings`,
      { 
        headers: getAuthHeaders(),
        signal 
      }
    );

    const data = await handleApiResponse(response);
    console.log("Fetched savings:", data);

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format: Expected an array");
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching savings:", error);
    throw error;
  }
};

export const searchAccount = async (
  search: string,
  signal?: AbortSignal
): Promise<Account[]> => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/accounts/searchAccount?search=${search}`,
      { 
        headers: getAuthHeaders(),
        signal 
      }
    );

    const data = await handleApiResponse(response);
    console.log("Backend response:", data);
    return data;
  } catch (error) {
    console.error("Error searching accounts:", error);
    throw error;
  }
};

export const deleteDefaultAccount = async (accountId: number) => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/accounts/deleteDefaultAccount?accountId=${accountId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error deleting account:", err);
    throw err;
  }
};

export const deleteSavingAccount = async (accountId: number) => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/accounts/deleteSavingAccount?accountId=${accountId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    return await handleApiResponse(response);
  } catch (err) {
    console.error("Error deleting account:", err);
    throw err;
  }
};

export const editDefaultAccount = async (
  accountId: number,
  requestData: {
    name: string;
    description: string;
    currency: string;
    accountType: AccountType;
    amount?: number;
  }
) => {
  try {
    console.log("Should update to amount" + requestData.amount);
    const { name, description, currency, accountType, amount } = requestData;

    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/accounts/editDefaultAccount?accountId=${accountId}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          description,
          currency,
          accountType,
          ...(amount !== undefined && { amount }),
        }),
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error("Error editing account:", error);
    throw error;
  }
};

export const editSavingAccount = async (
  accountId: number,
  requestData: {
    name: string;
    description: string;
    currency: string;
    savingAccount: {
      update: {
        targetAmount: number;
        targetDate: string;
      };
    };
  }
) => {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/accounts/editSavingAccount?accountId=${accountId}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData),
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error("Error editing account:", error);
    throw error;
  }
};