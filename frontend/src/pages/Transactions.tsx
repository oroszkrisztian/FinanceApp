import React, { useEffect, useState } from "react";
import { getUserAllTransactions } from "../services/transactionService";
import { useAuth } from "../context/AuthContext";
import { Transaction } from "../interfaces/Transaction";
import { TransactionType } from "../interfaces/enums";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { motion, AnimatePresence } from "framer-motion";
import TransactionTable from "../components/transactions/TransactionTableProps";

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("income");
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Add responsive logic to check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const startTime = Date.now();
      setLoading(true);

      try {
        const data = await getUserAllTransactions(user.id);

        let transactionsArray: Transaction[] = [];

        if (Array.isArray(data)) {
          transactionsArray = data;
        } else if (data && typeof data === "object") {
          if (data.id !== undefined) {
            transactionsArray = [data as Transaction];
          } else {
            const arrayProps = Object.values(data).filter((val) =>
              Array.isArray(val)
            );
            if (arrayProps.length > 0) {
              transactionsArray = arrayProps[0] as Transaction[];
            }
          }
        }

        setTransactions(transactionsArray);

        // Ensure a minimum loading time of 500ms for better UX
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 500 - elapsedTime);

        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load transactions. Please try again later.");

        // Ensure a minimum loading time of 500ms even on error
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 500 - elapsedTime);

        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      }
    };

    fetchTransactions();
  }, [user]);

  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  const formatDate = (dateString: Date) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter transactions by type
  const getFilteredTransactions = (type: TransactionType) => {
    return transactions.filter((transaction) => transaction.type === type);
  };

  // Get transactions based on active tab
  const getTransactionsToDisplay = () => {
    switch (activeTab) {
      case "income":
        return getFilteredTransactions(TransactionType.INCOME);
      case "expenses":
        return getFilteredTransactions(TransactionType.EXPENSE);
      case "transfers":
        return getFilteredTransactions(TransactionType.TRANSFER);
      default:
        return getFilteredTransactions(TransactionType.INCOME);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Ensure we have an array of transactions
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Show empty state if no transactions
  if (safeTransactions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">
          Transactions
        </h1>
        <div className="bg-white rounded-lg shadow p-4 md:p-8 text-center">
          <svg
            className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 className="text-lg md:text-xl font-medium mb-2">
            No transactions yet
          </h2>
          <p className="text-gray-500 mb-4 md:mb-6 max-w-md mx-auto text-sm md:text-base">
            You haven't created any transactions yet. Start tracking your
            finances by adding your first transaction.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white text-sm md:text-base rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Transaction
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="felx-row min-h-screen bg-gray-50 over">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Header & Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-lg shadow mb-4 md:mb-8 overflow-hidden"
        >
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav
              className={`flex items-center -mb-px ${isSmallScreen ? "w-full" : ""}`}
            >
              <motion.button
                whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium border-b-2 ${
                  isSmallScreen ? "flex-1 text-center" : ""
                } ${
                  activeTab === "income"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("income")}
              >
                Income
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium border-b-2 ${
                  isSmallScreen ? "flex-1 text-center" : ""
                } ${
                  activeTab === "expenses"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("expenses")}
              >
                Expenses
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium border-b-2 ${
                  isSmallScreen ? "flex-1 text-center" : ""
                } ${
                  activeTab === "transfers"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("transfers")}
              >
                Transfers
              </motion.button>
              {/* Search Bar - Updated Size */}
              <div className="relative ml-auto mr-4">
                <input
                  type="text"
                  placeholder="Search..."
                  className={`w-40 md:w-48 pl-8 pr-3 py-2  rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent text-gray-700 text-xs md:text-sm transition-all duration-100 ${
                    activeTab === "income"
                      ? "border border-green-300 focus:ring-green-500"
                      : activeTab === "expenses"
                        ? "border border-red-300 focus:ring-red-500"
                        : "border border-blue-300 focus:ring-blue-500"
                  }`}
                />
                <svg
                  className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"
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
            </nav>
          </div>

          {/* Add Transaction Button (Visible on mobile) */}
          {isSmallScreen && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2 bg-black text-white text-sm rounded-md flex justify-center items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Transaction
              </motion.button>
            </div>
          )}

          {/* Transaction Table with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <TransactionTable
                transactions={getTransactionsToDisplay()}
                formatAmount={formatAmount}
                formatDate={formatDate}
                transactionType={
                  activeTab === "income"
                    ? TransactionType.INCOME
                    : activeTab === "expenses"
                      ? TransactionType.EXPENSE
                      : TransactionType.TRANSFER
                }
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Floating Action Button for adding transactions (non-mobile) */}
        {!isSmallScreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-6 right-6 z-10"
          >
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-black text-white shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
