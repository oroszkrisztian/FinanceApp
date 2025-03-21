// accountService.ts
import { AccountType, CurrencyType } from "../interfaces/enums";
import { Account } from "../interfaces/Account";

interface CreateDefaultAccountParams {
  userId: number;
  accountType: AccountType;
  currencyType: CurrencyType;
  name: string;
  description: string;
}

export const createDefaultAccount = async ({
  userId,
  accountType,
  currencyType,
  name,
  description,
}: CreateDefaultAccountParams) => {
  try {
    const response = await fetch(
      `http://localhost:3000/accounts/insertDefault?userId=${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountType,
          currencyType,
          name,
          description,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create account");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating account:", err);
    throw err;
  }
};

export const createSavingAccount = async (
  userId: number,
  accountType: AccountType,
  currencyType: CurrencyType,
  name: string,
  description: string,
  targetAmount: number,
  targetDate: Date
) => {
  try {
    const response = await fetch(
      `http://localhost:3000/accounts/insertSaving?userId=${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create account");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating account:", err);
    throw err;
  }
};

export const fetchAllAccounts = async (
  userId: number,
  signal?: AbortSignal
): Promise<Account[]> => {
  try {
    const response = await fetch(
      `http://localhost:3000/accounts/getAllAccounts?userId=${userId}`,
      { signal }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch accounts: ${errorText}`);
    }

    const data = await response.json();
    console.log("Fetched accounts:", data);

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format: Expected an array");
    }
    console.log("Fetched accounts:", data);
    return data;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

export const fetchDefaultAccounts = async (
  userId: number,
  signal?: AbortSignal
): Promise<Account[]> => {
  try {
    const response = await fetch(
      `http://localhost:3000/accounts/getDefault?userId=${userId}`,
      { signal }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch accounts: ${errorText}`);
    }

    const data = await response.json();
    console.log("Fetched accounts:", data);

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format: Expected an array");
    }
    console.log("Fetched accounts:", data);
    return data;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

export const fetchSavings = async (
  userId: number,
  signal?: AbortSignal
): Promise<Account[]> => {
  try {
    const response = await fetch(
      `http://localhost:3000/accounts/getSavings?userId=${userId}`,
      { signal }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch savings: ${errorText}`);
    }

    const data = await response.json();
    console.log("Fetched savings:", data);

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format: Expected an array");
    }
    console.log("Fetched savings:", data);
    return data;
  } catch (error) {
    console.error("Error fetching savings:", error);
    throw error;
  }
};

export const searchAccount = async (
  userId: number,
  search: string,
  signal?: AbortSignal
): Promise<Account[]> => {
  try {
    const response = await fetch(
      `http://localhost:3000/accounts/searchAccount?userId=${userId}&search=${search}`,
      { signal }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search accounts: ${errorText}`);
    }

    const data = await response.json();
    console.log("Backend response:", data);
    return data;
  } catch (error) {
    console.error("Error searching accounts:", error);
    throw error;
  }
};

export const deleteDefaultAccount = async (
  userId: number,
  accountId: number
) => {
  try {
    const response = await fetch(
      `http://localhost:3000/accounts/deleteDefaultAccount?userId=${userId}&accountId=${accountId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete account");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error deleting account:", err);
    throw err;
  }
};

export const deleteSavingAccount = async (userId: number, accountId: number) => {
  try {
    const response = await fetch(
      `http://localhost:3000/accounts/deleteSavingAccount?userId=${userId}&accountId=${accountId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete account");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error deleting account:", err);
    throw err;
  }
};

export const editDefaultAccount = async (
  userId: number,
  accountId: number,
  requestData: {
    name: string;
    description: string;
    currency: CurrencyType;
    accountType: AccountType;
    amount?: number;
  }
) => {
  try {
    console.log("Should update to amount" + requestData.amount);
    const { name, description, currency, accountType, amount } = requestData;

    const response = await fetch(
      `http://localhost:3000/accounts/editDefaultAccount?userId=${userId}&accountId=${accountId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          currency,
          accountType,

          ...(amount !== undefined && { amount }),
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update account");
    }

    return await response.json();
  } catch (error) {
    console.error("Error editing account:", error);
    throw error;
  }
};

export const editSavingAccount = async (
  userId: number,
  accountId: number,
  requestData: {
    name: string;
    description: string;
    currency: CurrencyType;
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
      `http://localhost:3000/accounts/editSavingAccount?userId=${userId}&accountId=${accountId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData), 
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update account");
    }

    return await response.json();
  } catch (error) {
    console.error("Error editing account:", error);
    throw error;
  }
};
