import React, { useEffect, useState } from "react";
import { AccountType } from "../interfaces/enums";
import { fetchAccounts } from "../services/accountService";
import { useAuth } from "../context/AuthContext";

interface Account {
  id: number;
  type: AccountType;
  name: string;
  description: string;
}

const Savings: React.FC = () => {
  const [hasSavingsAccount, setHasSavingsAccount] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserAccounts = async () => {
      if (!user?.id) return;

      try {
        const data = await fetchAccounts(user.id);
        const savingsAccounts = data.filter(
          (account) => account.type === AccountType.SAVINGS
        );
        setHasSavingsAccount(savingsAccounts.length > 0);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch accounts"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAccounts();
  }, [user?.id]);

  const handleCreateSavings = () => {
    console.log("Create Savings button clicked!");
    
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!hasSavingsAccount ? (
        <div className="flex flex-grow items-center justify-center bg-white">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center border border-gray-700">
            <h2 className="text-xl font-semibold mb-3 text-white">
              No Savings Found
            </h2>
            <p className="text-gray-300">
              Please create a saving to get started.
            </p>
            <button
              onClick={handleCreateSavings} 
              className="mt-4 px-4 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors"
            >
              Create Saving
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to the Savings Page!</h1>
          <p>This is your Savings page.</p>
        </div>
      )}
    </div>
  );
};

export default Savings;