import React, { useEffect, useState } from "react";
import { getUserAllTransactions } from "../services/transactionService";
import { useAuth } from "../context/AuthContext";
import { Transaction } from "../interfaces/Transaction";
import { TransactionType, AccountType } from "../interfaces/enums";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Loader2,
  CreditCard,
  Plus,
} from "lucide-react";

import { Account } from "../interfaces/Account";
import { fetchAllAccounts } from "../services/accountService";
import { getAllSystemCategories } from "../services/categoriesService";
import { CustomCategory } from "../interfaces/CustomCategory";
import { getAllBudgets } from "../services/budgetService";
import CreateExpensePopup from "../components/transactions/CreateExpensePopup";
import AddIncomePopup from "../components/transactions/AddIncomePopup";
import TransferDefaultAccounts from "../components/transactions/TransferDefaultAccounts";
import TransactionDetailsPopup from "../components/transactions/transactionsHistory/TransactionDetailsPopup";
import IncomeTransactionsSection from "../components/transactions/IncomeTransactionsSection";
import ExpenseTransactions from "../components/transactions/ExpenseTransactions";
import TransferTransactions from "../components/transactions/TransferTransactions";
import {
  ExchangeRates,
  fetchExchangeRates,
} from "../services/exchangeRateService";

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "income" | "expenses" | "transfers"
  >("income");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // Exchange rates
  const [rates, setRates] = useState<ExchangeRates>({});
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);

  // Modals
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] =
    useState(false);
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] =
    useState(false);

  const checkScreenSize = () => {
    setIsSmallScreen(window.innerWidth < 768);
  };

  useEffect(() => {
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Load exchange rates
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
      setError("Failed to fetch accounts");
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoryData = await getAllSystemCategories();
      setCategories(categoryData);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchBudgets = async () => {
    if (!user?.id) return;

    try {
      const budgetData = await getAllBudgets(user.id);
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
    } catch (err) {
      console.error("Error fetching budgets:", err);
    }
  };

  const fetchTransactions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

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
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setError("Failed to fetch transactions");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchTransactions(),
          fetchAccounts(),
          fetchCategories(),
          fetchBudgets(),
        ]);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSuccess = () => {
    fetchTransactions();
    fetchAccounts();
    fetchBudgets();
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailsOpen(true);
  };

  const formatAmount = (amount: number) => amount.toFixed(2);
  const formatDate = (dateString: Date) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const defaultAccounts = accounts.filter(
    (account) => account.type === AccountType.DEFAULT
  );

  // Loading screen
  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-700">
            Loading Transactions
          </h2>
          <p className="text-gray-500">Fetching your transaction data...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-red-100 p-4 rounded-full">
            <CreditCard size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            Error Loading Data
          </h2>
          <p className="text-gray-500 max-w-md">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  if (safeTransactions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md w-full border border-gray-100"
        >
          <div className="flex flex-col items-center">
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
              className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 p-5 rounded-full shadow-inner"
            >
              <svg
                className="w-14 h-14 md:w-16 md:h-16 text-blue-500"
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

            <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">
              No Transactions Yet
            </h2>

            <p className="text-gray-600 mb-6 text-center max-w-sm">
              Start tracking your finances by adding your first transaction.
              It's easy to keep all your income, expenses and transfers
              organized in one place.
            </p>

            <div className="flex items-center w-full mb-6">
              <div className="flex-grow border-t border-gray-200"></div>
              <div className="mx-4 text-gray-400 text-sm flex items-center">
                <span className="mr-1">✨</span> Get Started{" "}
                <span className="ml-1">✨</span>
              </div>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-full shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              onClick={() => setIsCreateExpenseModalOpen(true)}
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Transaction</span>
            </motion.button>
          </div>
        </motion.div>

        <CreateExpensePopup
          isOpen={isCreateExpenseModalOpen}
          onClose={() => setIsCreateExpenseModalOpen(false)}
          accounts={defaultAccounts}
          categories={categories}
          budgets={budgets}
          accountsLoading={accountsLoading}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-indigo-50">
      {isSmallScreen ? (
        <div className="flex flex-col flex-1 w-full pt-4">
          {/* Mobile Tabs */}
          <div className="flex w-full mb-3 mt-3 px-4">
            <button
              className={`flex-1 py-3 font-medium text-center rounded-tl-lg rounded-bl-lg transition-all duration-200 flex items-center justify-center gap-2
                ${
                  activeTab === "income"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              onClick={() => setActiveTab("income")}
            >
              <ArrowUp size={18} />
              <span>Income</span>
            </button>
            <button
              className={`flex-1 py-3 font-medium text-center transition-all duration-200 flex items-center justify-center gap-2
                ${
                  activeTab === "expenses"
                    ? "bg-red-500 text-white shadow-md"
                    : "bg-white text-gray-600 border-t border-b border-gray-200"
                }`}
              onClick={() => setActiveTab("expenses")}
            >
              <ArrowDown size={18} />
              <span>Expenses</span>
            </button>
            <button
              className={`flex-1 py-3 font-medium text-center rounded-tr-lg rounded-br-lg transition-all duration-200 flex items-center justify-center gap-2
                ${
                  activeTab === "transfers"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              onClick={() => setActiveTab("transfers")}
            >
              <ArrowLeftRight size={18} />
              <span>Transfers</span>
            </button>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 px-4 pb-6 overflow-hidden animate-fadeIn">
            {activeTab === "income" ? (
              <IncomeTransactionsSection
                transactions={transactions}
                accounts={accounts}
                rates={rates}
                availableCurrencies={Object.keys(rates)}
                fetchingRates={fetchingRates}
                formatAmount={formatAmount}
                formatDate={formatDate}
                onTransactionClick={handleTransactionClick}
                onAddIncomeClick={() => setIsAddIncomeModalOpen(true)}
                isSmallScreen={isSmallScreen}
                onTransactionCreated={handleSuccess}
                accountsLoading={accountsLoading}
              />
            ) : activeTab === "expenses" ? (
              <ExpenseTransactions
                isSmallScreen={isSmallScreen}
                transactions={transactions}
                accounts={accounts}
                categories={categories}
                budgets={budgets}
                onTransactionCreated={handleSuccess}
                accountsLoading={accountsLoading}
              />
            ) : (
              <TransferTransactions
                isSmallScreen={isSmallScreen}
                transactions={transactions}
                accounts={accounts}
                onTransactionCreated={handleSuccess}
                accountsLoading={accountsLoading}
                rates={rates}
                ratesError={ratesError}
                fetchingRates={fetchingRates}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 w-full pt-4 px-6 pb-6 gap-6 overflow-hidden mb-16">
          {/* Desktop View - Three Columns */}
          <div className="w-1/3 flex flex-col transform transition-all duration-300 hover:scale-[1.01]">
            <IncomeTransactionsSection
              transactions={transactions}
              accounts={accounts}
              rates={rates}
              availableCurrencies={Object.keys(rates)}
              fetchingRates={fetchingRates}
              formatAmount={formatAmount}
              formatDate={formatDate}
              onTransactionClick={handleTransactionClick}
              onAddIncomeClick={() => setIsAddIncomeModalOpen(true)}
              isSmallScreen={isSmallScreen}
              onTransactionCreated={handleSuccess}
              accountsLoading={accountsLoading}
            />
          </div>
          <div className="w-1/3 flex flex-col transform transition-all duration-300 hover:scale-[1.01]">
            <ExpenseTransactions
              isSmallScreen={isSmallScreen}
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              budgets={budgets}
              onTransactionCreated={handleSuccess}
              accountsLoading={accountsLoading}
            />
          </div>
          <div className="w-1/3 flex flex-col transform transition-all duration-300 hover:scale-[1.01]">
            <TransferTransactions
              isSmallScreen={isSmallScreen}
              transactions={transactions}
              accounts={accounts}
              onTransactionCreated={handleSuccess}
              accountsLoading={accountsLoading}
              rates={rates}
              ratesError={ratesError}
              fetchingRates={fetchingRates}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateExpensePopup
        isOpen={isCreateExpenseModalOpen}
        onClose={() => setIsCreateExpenseModalOpen(false)}
        accounts={defaultAccounts}
        categories={categories}
        budgets={budgets}
        accountsLoading={accountsLoading}
        onSuccess={handleSuccess}
      />

      <AddIncomePopup
        isOpen={isAddIncomeModalOpen}
        onClose={() => setIsAddIncomeModalOpen(false)}
        accounts={defaultAccounts}
        accountsLoading={accountsLoading}
        onSuccess={handleSuccess}
      />

      <TransferDefaultAccounts
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
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
