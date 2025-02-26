import React, { useEffect, useState } from "react";
import { AccountType } from "../interfaces/enums";
import { fetchAccounts } from "../services/accountService";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";



const Savings: React.FC = () => {
  const [hasSavingsAccount, setHasSavingsAccount] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      }
    };

    fetchUserAccounts();
  }, [user?.id]);

  const handleCreateSavings = () => {
    console.log("Create Savings button clicked!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin h-8 w-8 border-4 border-black rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="p-4 bg-red-50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!hasSavingsAccount ? (
        <div className="flex flex-grow items-center justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", bounce: 0.4, type: "spring" }}
            className="bg-gray-900 p-6 rounded-lg shadow-lg text-center border border-gray-700"
          >
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
          </motion.div>
        </div>
      ) : (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">
            Welcome to the Savings Page!
          </h1>
          <p>This is your Savings page.</p>
        </div>
      )}
    </div>
  );
};

export default Savings;
