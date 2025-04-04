import React, { useEffect, useState } from "react";
import { getUserAllTransactions } from "../services/transactionService";
import { useAuth } from "../context/AuthContext";
import { Transaction } from "../interfaces/Transaction";
import { TransactionType, AccountType } from "../interfaces/enums";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { motion, AnimatePresence } from "framer-motion";

import CreateTransactionPopup from "../components/transactions/CreateTransacationPopup";
import { Account } from "../interfaces/Account";
import { fetchAllAccounts } from "../services/accountService";
import TransactionTable from "../components/transactions/transactionsHistory/TransactionTableProps";
import EmptySearchResults from "../components/transactions/EmptySearchTransaction";
import SearchBar from "../components/transactions/Searchbar";
import Budgets from "../components/transactions/transactionsBudget/Budgets";
import { getAllBudgets } from "../services/budgetService";
import { Budget } from "../interfaces/Budget";
import { getAllSystemCategories } from "../services/categoriesService";
import { CustomCategory } from "../interfaces/CustomCategory";

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("income");
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isCreateTransactionModalOpen, setIsCreateTransactionModalOpen] =
    useState(false);
  const [mobileView, setMobileView] = useState<"transactions" | "budgets">(
    "transactions"
  );

  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);

  const defaultAccounts = accounts.filter(
    (account) => account.type === AccountType.DEFAULT
  );

  const handleSuccess = (): void => {
    fetchTransactions();
    fetchBudgets(); // Add this line to fetch budgets after a successful operation
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const fetchAccounts = async () => {
    if (!user?.id) {
      setAccountsLoading(false);
      return;
    }

    setAccountsLoading(true);

    try {
      const accountsData: Account[] = await fetchAllAccounts(user.id);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const startTime = Date.now();
    setLoading(true);

    try {
      const data: Transaction = await getUserAllTransactions(user.id);

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

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions. Please try again later.");

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  const fetchBudgets = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const budgetsData = await getAllBudgets(user.id);
      setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
    } catch (err) {
      console.error("Error fetching budgets:", err);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const categoryData = await getAllSystemCategories();
      setCategories(categoryData);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchBudgets();
    fetchTransactions();
    fetchCategories();
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

  const getFilteredTransactions = (type: TransactionType) => {
    const typeFiltered = transactions.filter(
      (transaction) => transaction.type === type
    );

    // Apply the filters in stages
    return typeFiltered
      .filter((transaction) => {
        // Apply search query filter if it exists
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase().trim();

        const commonMatches = [
          transaction.name?.toLowerCase().includes(query),
          transaction.description?.toLowerCase().includes(query),
          transaction.amount.toString().includes(query),
          transaction.currency?.toLowerCase().includes(query),
          formatDate(transaction.date).toLowerCase().includes(query),
        ];

        if (type === TransactionType.INCOME) {
          const toAccount = accounts.find(
            (acc) => acc.id === transaction.toAccountId
          );
          return (
            commonMatches.some(Boolean) ||
            toAccount?.name.toLowerCase().includes(query)
          );
        } else if (type === TransactionType.EXPENSE) {
          const fromAccount = accounts.find(
            (acc) => acc.id === transaction.fromAccountId
          );
          return (
            commonMatches.some(Boolean) ||
            fromAccount?.name.toLowerCase().includes(query)
          );
        } else if (type === TransactionType.TRANSFER) {
          const fromAccount = accounts.find(
            (acc) => acc.id === transaction.fromAccountId
          );
          const toAccount = accounts.find(
            (acc) => acc.id === transaction.toAccountId
          );

          return (
            commonMatches.some(Boolean) ||
            fromAccount?.name.toLowerCase().includes(query) ||
            toAccount?.name.toLowerCase().includes(query)
          );
        }

        return false;
      })
      .filter((transaction) => {
        // Apply date range filter if it exists
        if (!dateRange.start && !dateRange.end) return true;

        const transactionDate = new Date(transaction.date);

        // Check start date if it exists
        if (dateRange.start && transactionDate < dateRange.start) {
          return false;
        }

        // Check end date if it exists
        if (dateRange.end) {
          // Set end date to the end of the day
          const endDateWithTime = new Date(dateRange.end);
          endDateWithTime.setHours(23, 59, 59, 999);

          if (transactionDate > endDateWithTime) {
            return false;
          }
        }

        return true;
      });
  };

  const clearDateRange = () => {
    setDateRange({ start: null, end: null });
  };

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

  const getTabStyles = (tab: string) => {
    const baseClasses =
      "px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium border-b-2 transition-all duration-300 flex items-center";
    const centerClasses = isSmallScreen ? "flex-1 justify-center" : "";

    let activeClasses = "";
    let icon = null;

    if (tab === "income") {
      activeClasses =
        activeTab === "income"
          ? "border-green-500 text-green-600 bg-green-50"
          : "border-transparent text-gray-500 hover:text-green-600 hover:bg-green-50/50 hover:border-green-300";
      icon = (
        <span
          className={`mr-1.5 text-sm ${activeTab === "income" ? "text-green-500" : "text-gray-400"}`}
        >
          💰
        </span>
      );
    } else if (tab === "expenses") {
      activeClasses =
        activeTab === "expenses"
          ? "border-red-500 text-red-600 bg-red-50"
          : "border-transparent text-gray-500 hover:text-red-600 hover:bg-red-50/50 hover:border-red-300";
      icon = (
        <span
          className={`mr-1.5 text-sm ${activeTab === "expenses" ? "text-red-500" : "text-gray-400"}`}
        >
          💸
        </span>
      );
    } else if (tab === "transfers") {
      activeClasses =
        activeTab === "transfers"
          ? "border-blue-500 text-blue-600 bg-blue-50"
          : "border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-300";
      icon = (
        <span
          className={`mr-1.5 text-sm ${activeTab === "transfers" ? "text-blue-500" : "text-gray-400"}`}
        >
          🔄
        </span>
      );
    }

    return {
      className: `${baseClasses} ${centerClasses} ${activeClasses}`,
      icon,
    };
  };

  const openTransactionModal = () => {
    setIsCreateTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsCreateTransactionModalOpen(false);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  if (safeTransactions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md w-full border border-gray-100"
        >
          <div className="flex flex-col items-center">
            {/* Animated empty state icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05, rotate: [0, -10, 10, -10, 0] }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 p-5 rounded-full shadow-inner relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20px 20px, white 2px, transparent 3px)",
                    backgroundSize: "20px 20px",
                  }}
                ></div>
              </div>
              <svg
                className="w-14 h-14 md:w-16 md:h-16 text-blue-500 relative z-10"
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
            </motion.div>

            {/* Text content */}
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">
              No Transactions Yet
            </h2>

            <p className="text-gray-600 mb-6 text-center max-w-sm">
              Start tracking your finances by adding your first transaction.
              It's easy to keep all your income, expenses and transfers
              organized in one place.
            </p>

            {/* Decorated divider */}
            <div className="flex items-center w-full mb-6">
              <div className="flex-grow border-t border-gray-200"></div>
              <div className="mx-4 text-gray-400 text-sm flex items-center">
                <span className="mr-1">✨</span> Get Started{" "}
                <span className="ml-1">✨</span>
              </div>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Button with enhanced styling */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-full shadow-md hover:shadow-lg flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onClick={openTransactionModal}
            >
              <svg
                className="w-5 h-5"
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
              <span>Add Your First Transaction</span>
            </motion.button>

            {/* Tips section */}
            <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200 w-full">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="mr-1.5">💡</span> Quick Tips:
              </h3>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  Track your income from various sources
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  Categorize your expenses for better insights
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  Keep track of transfers between accounts
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        <CreateTransactionPopup
          isOpen={isCreateTransactionModalOpen}
          onClose={closeTransactionModal}
          accounts={defaultAccounts}
          categories={categories}
          accountsLoading={accountsLoading}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isSmallScreen && (
        <div className="sticky top-0 z-10 bg-white shadow-md">
          <div className="flex w-full border-b">
            <button
              onClick={() => setMobileView("budgets")}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                mobileView === "budgets"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              <span className="mr-1">📊</span> Budgets
            </button>
            <button
              onClick={() => setMobileView("transactions")}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                mobileView === "transactions"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              <span className="mr-1">💳</span> Transactions
            </button>
          </div>
        </div>
      )}

      {(!isSmallScreen || mobileView === "budgets") && (
        <div>
          <Budgets
            budgets={budgets}
            categories={categories}
            onSuccess={handleSuccess}
          />
        </div>
      )}

      {(!isSmallScreen || mobileView === "transactions") && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
          {/* Transaction History */}
          <div>
            {/* Header & Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white rounded-lg shadow-md mb-4 md:mb-8 overflow-hidden border border-gray-100"
            >
              {/* Navigation Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex items-center -mb-px overflow-x-auto">
                  {/* Income Tab */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className={getTabStyles("income").className}
                    onClick={() => setActiveTab("income")}
                  >
                    {getTabStyles("income").icon}
                    Income
                  </motion.button>

                  {/* Expenses Tab */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className={getTabStyles("expenses").className}
                    onClick={() => setActiveTab("expenses")}
                  >
                    {getTabStyles("expenses").icon}
                    Expenses
                  </motion.button>

                  {/* Transfers Tab */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className={getTabStyles("transfers").className}
                    onClick={() => setActiveTab("transfers")}
                  >
                    {getTabStyles("transfers").icon}
                    Transfers
                  </motion.button>

                  {/* Search Bar - Only visible on non-mobile screens */}
                  {!isSmallScreen && (
                    <div className="relative ml-auto mr-4 z-20">
                      <SearchBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        activeTab={activeTab}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                      />
                    </div>
                  )}
                </nav>
              </div>

              {/* Search Bar - Only visible on mobile screens */}
              {isSmallScreen && (
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="mb-3">
                    <SearchBar
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      activeTab={activeTab}
                      dateRange={dateRange}
                      setDateRange={setDateRange}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-2.5 text-white text-sm rounded-full flex justify-center items-center shadow-sm transition-all duration-300 ${
                      activeTab === "income"
                        ? "bg-gradient-to-r from-green-500 to-emerald-600"
                        : activeTab === "expenses"
                          ? "bg-gradient-to-r from-red-500 to-pink-600"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600"
                    }`}
                    onClick={openTransactionModal}
                  >
                    <svg
                      className="w-4 h-4 mr-1.5"
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
                    Add New{" "}
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                  </motion.button>
                </div>
              )}

              {/* Transaction Table with Animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {getTransactionsToDisplay().length > 0 ? (
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
                  ) : (
                    <EmptySearchResults
                      searchQuery={searchQuery}
                      activeTab={activeTab}
                      onClearSearch={() => setSearchQuery("")}
                      dateRange={dateRange}
                      clearDateRange={clearDateRange}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Floating Action Button for adding transactions (non-mobile) */}
          {!isSmallScreen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed bottom-6 right-6 "
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
                }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
                  activeTab === "income"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 focus:ring-green-500"
                    : activeTab === "expenses"
                      ? "bg-gradient-to-r from-red-500 to-pink-600 focus:ring-red-500"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 focus:ring-blue-500"
                }`}
                onClick={openTransactionModal}
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
      )}
      <CreateTransactionPopup
        isOpen={isCreateTransactionModalOpen}
        onClose={closeTransactionModal}
        accounts={defaultAccounts}
        categories={categories}
        accountsLoading={accountsLoading}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Transactions;
