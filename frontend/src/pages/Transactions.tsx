import React, { useEffect, useState } from "react";
import { getUserAllTransactions } from "../services/transactionService";
import { useAuth } from "../context/AuthContext";
import { Transaction } from "../interfaces/Transaction";
import { TransactionType, AccountType } from "../interfaces/enums";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { motion, AnimatePresence } from "framer-motion";

import { Account } from "../interfaces/Account";
import { fetchAllAccounts } from "../services/accountService";
import TransactionTable from "../components/transactions/transactionsHistory/TransactionTableProps";
import EmptySearchResults from "../components/transactions/EmptySearchTransaction";
import SearchBar from "../components/transactions/Searchbar";
import { getAllSystemCategories } from "../services/categoriesService";
import { CustomCategory } from "../interfaces/CustomCategory";
import { getAllBudgets } from "../services/budgetService";
import CreateExpensePopup from "../components/transactions/CreateExpensePopup";
import AddIncomePopup from "../components/transactions/AddIncomePopup";
import TransferDefaultAccounts from "../components/transactions/TransferDefaultAccounts";
import {
  ExchangeRates,
  fetchExchangeRates,
} from "../services/exchangeRateService";

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("income");
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] =
    useState(false);
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const isAnyModalOpen =
    isCreateExpenseModalOpen || isAddIncomeModalOpen || isTransferModalOpen;

  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  const defaultAccounts = accounts.filter(
    (account) => account.type === AccountType.DEFAULT
  );

  const handleSuccess = (): void => {
    fetchTransactions();
    fetchAccounts();
    fetchBudgets();
  };

  const [rates, setRates] = useState<ExchangeRates>({});
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);

  useEffect(() => {
    const loadRates = async () => {
      setFetchingRates(true);
      try {
        const ratesData = await fetchExchangeRates();
        setRates(ratesData);
      } catch (err) {
        console.error("Error fetching rates:", err);
        setRatesError("Could not fetch exchange rates");
      } finally {
        setFetchingRates(false);
      }
    };
    loadRates();
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
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

  const fetchBudgets = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const budgetData = await getAllBudgets(user.id);
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError("Failed to load budgets. Please try again later.");
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
    fetchTransactions();
    fetchCategories();
    fetchBudgets();
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

  const openExpenseModal = () => {
    setIsCreateExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsCreateExpenseModalOpen(false);
  };

  const openIncomeModal = () => {
    setIsAddIncomeModalOpen(true);
  };

  const closeIncomeModal = () => {
    setIsAddIncomeModalOpen(false);
  };

  const openTransferModal = () => {
    setIsTransferModalOpen(true);
  };

  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
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
              onClick={openExpenseModal}
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

        <CreateExpensePopup
          isOpen={isCreateExpenseModalOpen}
          onClose={closeExpenseModal}
          accounts={defaultAccounts}
          categories={categories}
          budgets={budgets}
          accountsLoading={accountsLoading}
          onSuccess={handleSuccess}
          rates={rates}
          ratesError={ratesError}
          fetchingRates={fetchingRates}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:px-10 px-4 ">
      {/* Container to maintain consistent width */}
      <div className="max-w-7xl mx-auto pt-4">
        {/* Enhanced Navigation Bar */}
        <div
          className="bg-white border-b rounded-lg border-gray-200 sticky top-0 shadow-sm"
          style={ {position:'relative'}}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:h-16 justify-between gap-4 py-3 lg:py-0">
              {/* First row on mobile / right side on desktop */}
              <div className="flex justify-center order-2 lg:order-none lg:flex-1">
                <div className="flex space-x-1">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveTab("income")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === "income"
                        ? "bg-green-100 text-green-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>💰</span>
                      <span>Income</span>
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveTab("expenses")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === "expenses"
                        ? "bg-red-100 text-red-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>💸</span>
                      <span>Expenses</span>
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveTab("transfers")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === "transfers"
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>🔄</span>
                      <span>Transfers</span>
                    </span>
                  </motion.button>
                </div>
              </div>

              {!isSmallScreen && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (activeTab === "expenses") openExpenseModal();
                    else if (activeTab === "income") openIncomeModal();
                    else if (activeTab === "transfers") openTransferModal();
                  }}
                  className={` px-4 py-2 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap flex items-center justify-center text-white transition-all duration-200 ${
                    activeTab === "income"
                      ? "bg-green-500 hover:bg-green-600"
                      : activeTab === "expenses"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  Add
                </motion.button>
              )}

              {/* Third row on mobile / right side on desktop */}
              <div
                className="w-full lg:w-auto lg:flex-1 lg:max-w-xs order-3 lg:order-none"
                //style={{ position: "relative" }}
              >
                <SearchBar
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  activeTab={activeTab}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="lg:py-10 py-2"
          
        >
          {/* Transaction List */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
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
        </div>
        {isSmallScreen && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (activeTab === "expenses") openExpenseModal();
              else if (activeTab === "income") openIncomeModal();
              else if (activeTab === "transfers") openTransferModal();
            }}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap flex items-center justify-center text-white transition-all duration-200 ${
              activeTab === "income"
                ? "bg-green-500 hover:bg-green-600"
                : activeTab === "expenses"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Add
          </motion.button>
        )}
      </div>

      {/* Modals */}
      <CreateExpensePopup
        isOpen={isCreateExpenseModalOpen}
        onClose={closeExpenseModal}
        accounts={defaultAccounts}
        budgets={budgets}
        accountsLoading={accountsLoading}
        onSuccess={handleSuccess}
        rates={rates}
        ratesError={ratesError}
        fetchingRates={fetchingRates}
        categories={categories}
      />

      <AddIncomePopup
        isOpen={isAddIncomeModalOpen}
        onClose={closeIncomeModal}
        accounts={defaultAccounts}
        accountsLoading={accountsLoading}
        onSuccess={handleSuccess}
        rates={rates}
        ratesError={ratesError}
        fetchingRates={fetchingRates}
      />

      <TransferDefaultAccounts
        isOpen={isTransferModalOpen}
        onClose={closeTransferModal}
        accounts={defaultAccounts}
        accountsLoading={accountsLoading}
        onSuccess={handleSuccess}
        rates={rates}
        ratesError={ratesError}
        fetchingRates={fetchingRates}
      />
    </div>
  );
};

export default Transactions;
