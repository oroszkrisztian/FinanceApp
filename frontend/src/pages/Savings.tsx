import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSavings, searchAccount } from "../services/accountService";
import { motion, AnimatePresence } from "framer-motion";
import CreateSavingAccountPopup from "../components/accounts/CreateSavingAccountPopup";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const Savings: React.FC = () => {
  const [savingsAccounts, setSavingsAccounts] = useState<any[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  
  useEffect(() => {
    const fetchSavingAccounts = async () => {
      if (!user?.id) return;

      const startTime = Date.now();

      try {
        const data = await fetchSavings(user.id);
        setSavingsAccounts(data);
        setFilteredAccounts(data);

        
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 500 - elapsedTime);

        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch savings accounts"
        );

        
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 500 - elapsedTime);

        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      }
    };

    fetchSavingAccounts();
  }, [user?.id]);

 
  useEffect(() => {
    if (!user?.id) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        if (searchTerm.trim() === "") {
          
          setFilteredAccounts(savingsAccounts);
        } else {
          
          const data = await searchAccount(user.id, searchTerm);
          setFilteredAccounts(data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to search savings accounts"
        );
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user?.id, savingsAccounts]);

  const handleCreateSavings = () => {
    setIsModalOpen(true);
  };

  const calculateCompletionPercentage = (account: any) => {
    if (!account.savingAccount || !account.savingAccount.targetAmount) {
      return 0;
    }
    return account.savingAccount.isCompleted
      ? 100
      : Math.floor(Math.random() * 90) + 10;
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 p-8">
      

      {/* Search and Add Button */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
      >
        <div className="relative w-full md:w-64 lg:w-80">
          <input
            type="text"
            placeholder="Search savings accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-700 transition-all duration-300"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <motion.button
          onClick={handleCreateSavings}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center whitespace-nowrap"
        >
          <svg
            className="w-5 h-5 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Savings Account
        </motion.button>
      </motion.div>

      {/* Savings Accounts Section */}
      <div>
        {filteredAccounts.length === 0 ? (
          <EmptyState
            key="empty-state"
            title="No Savings Accounts Found"
            description="You don't have any savings accounts yet."
            buttonText="Create Savings Account"
            onClick={handleCreateSavings}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              
              <motion.div
                key={searchTerm} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="contents" 
              >
                {filteredAccounts.map((account, index) => {
                  const completionPercentage =
                    calculateCompletionPercentage(account);

                  return (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.5, delay: index * 0.1 }} 
                      className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                      <h3 className="text-xl font-bold mb-4 text-gray-900">
                        {account.name || "Unnamed Account"}
                      </h3>
                      <div className="space-y-3">
                        <p className="text-gray-700 flex justify-between">
                          <span className="font-medium">Currency:</span>
                          <span className="text-black">
                            {account.currency || "N/A"}
                          </span>
                        </p>

                        {account.savingAccount && (
                          <>
                            <p className="text-gray-700 flex justify-between">
                              <span className="font-medium">
                                Target Amount:
                              </span>
                              <span className="text-black font-semibold">
                                {account.savingAccount.targetAmount ??
                                  "Not set"}
                              </span>
                            </p>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">Progress</span>
                                <span>{completionPercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-black h-2.5 rounded-full"
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex justify-between">
                              <div>
                                <p className="text-xs text-gray-500">
                                  Start Date
                                </p>
                                <p className="text-sm">
                                  {account.savingAccount.startDate
                                    ? new Date(
                                        account.savingAccount.startDate
                                      ).toLocaleDateString()
                                    : "Not set"}
                                </p>
                              </div>

                              {account.savingAccount.targetDate && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    Target Date
                                  </p>
                                  <p className="text-sm">
                                    {new Date(
                                      account.savingAccount.targetDate
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                        <button className="flex-1 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                          Add Funds
                        </button>
                        <button className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                          Details
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Savings Account Popup */}
      <AnimatePresence>
        {isModalOpen && (
          <CreateSavingAccountPopup setIsModalOpen={setIsModalOpen} />
        )}
      </AnimatePresence>
    </div>
  );
};





export default Savings;
