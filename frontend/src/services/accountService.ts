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
    const response = await fetch(`http://localhost:3000/accounts/insertDefault?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountType,
        currencyType,
        name,
        description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create account');
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating account:", err);
    throw err;
  }
};


export const fetchAccounts = async (userId: number, signal?: AbortSignal): Promise<Account[]> => {
  try {
    const response = await fetch(
      `http://localhost:3000/accounts/getAll?userId=${userId}`,
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

    return data;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};