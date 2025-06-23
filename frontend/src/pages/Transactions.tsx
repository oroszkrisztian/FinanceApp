import React, { useEffect, useState } from "react";
import { getUserAllTransactions } from "../services/transactionService";
import { Transaction } from "../interfaces/Transaction";
import { AccountType } from "../interfaces/enums";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeftRight, Plus } from "lucide-react";

import { Account } from "../interfaces/Account";
import { fetchAllAccounts } from "../services/accountService";
import { getAllCategoriesForUser } from "../services/categoriesService";
import { CustomCategory } from "../interfaces/CustomCategory";
import { getAllBudgets } from "../services/budgetService";
import CreateExpensePopup from "../components/transactions/CreateExpensePopup";
import AddIncomePopup from "../components/transactions/AddIncomePopup";
import TransferDefaultAccounts from "../components/transactions/TransferDefaultAccounts";
import IncomeTransactionsSection from "../components/transactions/IncomeTransactionsSection";
import ExpenseTransactions from "../components/transactions/ExpenseTransactions";
import TransferTransactions from "../components/transactions/TransferTransactions";
import {
  ExchangeRates,
  fetchExchangeRates,
} from "../services/exchangeRateService";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

const Transactions: React.FC = () => {
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

  const [rates, setRates] = useState<ExchangeRates>({});
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);

  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] =
    useState(false);
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [, setSelectedTransaction] = useState<Transaction | null>(null);
  const [, setIsTransactionDetailsOpen] = useState(false);
  const [currentIncomePopupStep, setCurrentIncomePopupStep] = useState(1);

  const checkScreenSize = () => {
    setIsSmallScreen(window.innerWidth < 768);
  };

  useEffect(() => {
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
    setAccountsLoading(true);
    try {
      const accountsData: Account[] = await fetchAllAccounts();
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
      const categoryData = await getAllCategoriesForUser();
      setCategories(categoryData);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const budgetData = await getAllBudgets();
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
    } catch (err) {
      console.error("Error fetching budgets:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const data = await getUserAllTransactions();
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

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
  }, []);

  const handleSuccess = () => {
    fetchTransactions();
    fetchAccounts();
    fetchBudgets();
    fetchCategories();
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

  if (loading) {
    return (
      <LoadingState
        title="Loading Transactions"
        message="Fetching your transaction data..."
        showDataStatus={true}
        dataStatus={[
          {
            label: "Transactions",
            isLoaded: !loading && Array.isArray(transactions),
          },
          {
            label: "Accounts",
            isLoaded: !accountsLoading && Array.isArray(accounts),
          },
          {
            label: "Categories",
            isLoaded: !loading && Array.isArray(categories),
          },
          {
            label: "Budgets",
            isLoaded: !loading && Array.isArray(budgets),
          },
          {
            label: "Exchange Rates",
            isLoaded: !fetchingRates && rates && Object.keys(rates).length >= 0,
          },
        ]}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Transaction Error"
        showHomeButton={true}
        onRetry={() => {
          setError(null);
          setLoading(true);
          loadData();
        }}
      />
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
                categories={categories}
                rates={rates}
                availableCurrencies={Object.keys(rates)}
                fetchingRates={fetchingRates}
                formatAmount={formatAmount}
                formatDate={formatDate}
                onTransactionClick={handleTransactionClick}
                onAddIncomeClick={() => setIsAddIncomeModalOpen(true)}
                isSmallScreen={isSmallScreen}
                onTransactionCreated={handleSuccess}
                onCategoryCreated={handleSuccess}
                accountsLoading={accountsLoading}
                currentIncomePopupStep={currentIncomePopupStep}
                onIncomePopupStepChange={setCurrentIncomePopupStep}
              />
            ) : activeTab === "expenses" ? (
              <ExpenseTransactions
                isSmallScreen={isSmallScreen}
                transactions={transactions}
                accounts={accounts}
                categories={categories}
                budgets={budgets}
                onTransactionCreated={handleSuccess}
                onCategoryCreated={handleSuccess}
                accountsLoading={accountsLoading}
                currentIncomePopupStep={currentIncomePopupStep}
                onIncomePopupStepChange={setCurrentIncomePopupStep}
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
              categories={categories}
              rates={rates}
              availableCurrencies={Object.keys(rates)}
              fetchingRates={fetchingRates}
              formatAmount={formatAmount}
              formatDate={formatDate}
              onTransactionClick={handleTransactionClick}
              onAddIncomeClick={() => setIsAddIncomeModalOpen(true)}
              isSmallScreen={isSmallScreen}
              onTransactionCreated={handleSuccess}
              onCategoryCreated={handleSuccess}
              accountsLoading={accountsLoading}
              currentIncomePopupStep={currentIncomePopupStep}
              onIncomePopupStepChange={setCurrentIncomePopupStep}
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
              onCategoryCreated={handleSuccess}
              accountsLoading={accountsLoading}
              currentIncomePopupStep={currentIncomePopupStep}
              onIncomePopupStepChange={setCurrentIncomePopupStep}
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
        accountsLoading={accountsLoading}
        onSuccess={handleSuccess}
      />

      <AddIncomePopup
        isOpen={isAddIncomeModalOpen}
        onClose={() => setIsAddIncomeModalOpen(false)}
        accounts={defaultAccounts}
        categories={categories}
        accountsLoading={accountsLoading}
        onSuccess={handleSuccess}
        onCategoryCreated={handleSuccess}
        currentStep={currentIncomePopupStep}
        onStepChange={setCurrentIncomePopupStep}
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
