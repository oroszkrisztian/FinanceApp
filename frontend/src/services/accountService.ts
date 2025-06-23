import { AccountType } from "../interfaces/enums";
import { Account } from "../interfaces/Account";
import { api } from "./apiHelpers";

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
    return await api.post("accounts/insertDefault", {
      accountType,
      currencyType,
      name,
      description,
    });
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
    return await api.post("accounts/insertSaving", {
      accountType,
      currencyType,
      name,
      description,
      targetAmount,
      targetDate,
    });
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

    const url = `accounts/getAllAccounts${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const data = await api.get(url, { signal });

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
    const data = await api.get("accounts/getDefault", { signal });

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
    const data = await api.get("accounts/getSavings", { signal });

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
    const data = await api.get(`accounts/searchAccount?search=${search}`, {
      signal,
    });
    return data;
  } catch (error) {
    console.error("Error searching accounts:", error);
    throw error;
  }
};

export const deleteDefaultAccount = async (accountId: number) => {
  try {
    return await api.delete(
      `accounts/deleteDefaultAccount?accountId=${accountId}`
    );
  } catch (err) {
    console.error("Error deleting account:", err);
    throw err;
  }
};

export const deleteSavingAccount = async (accountId: number) => {
  try {
    return await api.delete(
      `accounts/deleteSavingAccount?accountId=${accountId}`
    );
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
    const { name, description, currency, accountType, amount } = requestData;

    return await api.post(
      `accounts/editDefaultAccount?accountId=${accountId}`,
      {
        name,
        description,
        currency,
        accountType,
        ...(amount !== undefined && { amount }),
      }
    );
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
    return await api.post(
      `accounts/editSavingAccount?accountId=${accountId}`,
      requestData
    );
  } catch (error) {
    console.error("Error editing account:", error);
    throw error;
  }
};
