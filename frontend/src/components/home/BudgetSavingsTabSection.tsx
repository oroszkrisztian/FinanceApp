import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Account } from "../../interfaces/Account";
import { AccountType } from "../../interfaces/enums";
import { CurrencyType } from "../../interfaces/enums";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import { ChevronDown, RefreshCw, DollarSign } from "lucide-react";

interface BudgetSavingsTabSectionProps {
  accounts: Account[];
  budgets: any[];
  transactions: any[];
  displayCurrency: string;
}

const BudgetSavingsTabSection: React.FC<BudgetSavingsTabSectionProps> = ({
  accounts,
  budgets,
  transactions,
  displayCurrency: initialDisplayCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<"budgets" | "savings">("budgets");
  const [displayCurrency, setDisplayCurrency] = useState<string>(
    initialDisplayCurrency || CurrencyType.RON
  );
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [previewType, setPreviewType] = useState<"budget" | "savings" | null>(
    null
  );
  const currencyRef = useRef<HTMLDivElement>(null);

  // Enhanced mobile detection with more breakpoints
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    const loadExchangeRates = async () => {
      setFetchingRates(true);
      try {
        const ratesData = await fetchExchangeRates();
        setRates(ratesData);
        setAvailableCurrencies(Object.keys(ratesData));
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
      } finally {
        setFetchingRates(false);
      }
    };
    loadExchangeRates();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const convertToDisplayCurrency = (
    amount: number,
    currency: string
  ): number => {
    if (currency === displayCurrency || Object.keys(rates).length === 0) {
      return amount;
    }
    try {
      const validation = validateCurrencyConversion(
        currency as CurrencyType,
        displayCurrency as CurrencyType,
        rates
      );
      if (!validation.valid) {
        console.error(validation.error);
        return amount;
      }
      return convertAmount(amount, currency, displayCurrency, rates);
    } catch (err) {
      console.error("Conversion error:", err);
      return amount;
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setDisplayCurrency(currency);
    setIsCurrencyMenuOpen(false);
  };

  // Process savings data (NO dependency on rates for base calculations)
  const savingsData = useMemo(() => {
    const savingsAccountsWithGoals = accounts
      .filter(
        (account) =>
          account.type === AccountType.SAVINGS &&
          account.savingAccount?.targetAmount &&
          account.savingAccount?.targetAmount > 0
      )
      .map((account) => {
        const currentBalance = account.amount || 0;
        const goal = account.savingAccount?.targetAmount || 0;
        const progressPercentage =
          goal > 0 ? Math.min((currentBalance / goal) * 100, 100) : 0;

        return {
          ...account,
          progressPercentage,
          isCompleted: currentBalance >= goal,
        };
      });

    const totalSaved = savingsAccountsWithGoals.reduce(
      (sum, acc) => sum + (acc.amount || 0),
      0
    );
    const totalGoals = savingsAccountsWithGoals.reduce(
      (sum, acc) => sum + (acc.savingAccount?.targetAmount || 0),
      0
    );
    const completedGoals = savingsAccountsWithGoals.filter(
      (acc) => acc.isCompleted
    ).length;
    const overallProgress =
      totalGoals > 0 ? (totalSaved / totalGoals) * 100 : 0;

    return {
      accounts: savingsAccountsWithGoals,
      totalSaved,
      totalGoals,
      completedGoals,
      totalGoalsCount: savingsAccountsWithGoals.length,
      overallProgress,
    };
  }, [accounts]); // NO rates dependency

  // Process budget data (NO dependency on rates for base calculations)
  const budgetData = useMemo(() => {
    if (!budgets || budgets.length === 0) {
      return {
        budgets: [],
        totalBudget: 0,
        totalSpent: 0,
        completedBudgets: 0,
        totalBudgetsCount: 0,
        overallProgress: 0,
      };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const budgetsWithProgress = budgets.map((budget) => {
      // Get category IDs for this budget
      const budgetCategoryIds = budget.customCategories
        ? budget.customCategories.map((cat: any) => String(cat.id))
        : budget.categoryIds
          ? budget.categoryIds.map((id: any) => String(id))
          : [];

      // Filter transactions that match this budget's categories and are from current month
      const budgetTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        const isCurrentMonth =
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear;

        const isExpense = transaction.type === "EXPENSE";

        // Check if transaction matches any of the budget's categories
        const matchesCategory = transaction.transactionCategories?.some(
          (tc: any) => budgetCategoryIds.includes(String(tc.customCategoryId))
        );

        return isCurrentMonth && isExpense && matchesCategory;
      });

      // Calculate spent amount ONLY from matching transactions
      const spent = budgetTransactions.reduce((total, transaction) => {
        let transactionAmount = Math.abs(transaction.amount);
        return total + transactionAmount;
      }, 0);

      const limitAmount = budget.limitAmount || 0;
      const progressPercentage =
        limitAmount > 0 ? Math.min((spent / limitAmount) * 100, 100) : 0;
      const isCompleted = spent >= limitAmount;

      return {
        ...budget,
        spent,
        limitAmount,
        progressPercentage,
        isCompleted,
        remaining: Math.max(limitAmount - spent, 0),
        transactionCount: budgetTransactions.length,
      };
    });

    const totalBudget = budgetsWithProgress.reduce(
      (sum, budget) => sum + (budget.limitAmount || 0),
      0
    );
    const totalSpent = budgetsWithProgress.reduce(
      (sum, budget) => sum + (budget.spent || 0),
      0
    );
    const completedBudgets = budgetsWithProgress.filter(
      (budget) => budget.isCompleted
    ).length;
    const overallProgress =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      budgets: budgetsWithProgress,
      totalBudget,
      totalSpent,
      completedBudgets,
      totalBudgetsCount: budgetsWithProgress.length,
      overallProgress,
    };
  }, [budgets, transactions]); // NO rates dependency

  const openPreview = (item: any, type: "budget" | "savings") => {
    setPreviewItem(item);
    setPreviewType(type);
  };

  const closePreview = () => {
    setPreviewItem(null);
    setPreviewType(null);
  };

  // Get days remaining in current month
  const getDaysRemainingInMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
  };

  // Color logic from dashboard
  const getStatusColor = (percentage: number) => {
    if (percentage >= 75)
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        bar: "bg-red-500",
        accent: "bg-red-100",
        gradient: "from-red-300 to-pink-500",
      };
    if (percentage >= 50)
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
        bar: "bg-orange-500",
        accent: "bg-orange-100",
        gradient: "from-orange-300 to-red-400",
      };
    return {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      bar: "bg-green-500",
      accent: "bg-green-100",
      gradient: "from-green-300 to-emerald-500",
    };
  };

  // Mobile-optimized empty state
  if (activeTab === "budgets" && budgetData.totalBudgetsCount === 0) {
    return (
      <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
          isMobileView ? "p-3 mb-4 mx-2" : "p-6 mb-8"
        }`}
        style={{
          height: isMobileView ? "350px" : "400px",
          overflowX: "hidden",
        }}
      >
        {/* Mobile-optimized background elements */}
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full opacity-20 ${
            isMobileView
              ? "w-12 h-12 -translate-y-6 translate-x-6"
              : "w-28 h-28 -translate-y-14 translate-x-14"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 bg-gradient-to-tr from-emerald-300 to-cyan-400 rounded-full opacity-15 ${
            isMobileView
              ? "w-8 h-8 translate-y-4 -translate-x-4"
              : "w-20 h-20 translate-y-10 -translate-x-10"
          }`}
        ></div>
        <div
          className={`absolute bg-gradient-to-br from-amber-300 to-orange-400 rounded-full opacity-10 ${
            isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
          }`}
        ></div>

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-3">
            <motion.div
              className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md ${
                isMobileView ? "w-8 h-8" : "w-12 h-12"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </motion.div>
            <div>
              <h3
                className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                  isMobileView ? "text-lg" : "text-xl"
                }`}
              >
                Budget Overview
              </h3>
              <p
                className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
              >
                Track your spending
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                className="text-gray-400 mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <svg
                  className={`${isMobileView ? "w-8 h-8" : "w-12 h-12"} mx-auto`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </motion.div>
              <p className={`text-gray-600 ${isMobileView ? "text-sm" : ""}`}>
                No budgets set up yet
              </p>
              <p
                className={`text-gray-500 ${isMobileView ? "text-xs" : "text-sm"}`}
              >
                Create budgets to track your spending
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "savings" && savingsData.totalGoalsCount === 0) {
    return (
      <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
          isMobileView ? "p-3 mb-4 mx-2" : "p-6 mb-8"
        }`}
        style={{
          height: isMobileView ? "350px" : "400px",
          overflowX: "hidden",
        }}
      >
        {/* Mobile-optimized background elements */}
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full opacity-20 ${
            isMobileView
              ? "w-12 h-12 -translate-y-6 translate-x-6"
              : "w-28 h-28 -translate-y-14 translate-x-14"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 bg-gradient-to-tr from-emerald-300 to-cyan-400 rounded-full opacity-15 ${
            isMobileView
              ? "w-8 h-8 translate-y-4 -translate-x-4"
              : "w-20 h-20 translate-y-10 -translate-x-10"
          }`}
        ></div>
        <div
          className={`absolute bg-gradient-to-br from-amber-300 to-orange-400 rounded-full opacity-10 ${
            isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
          }`}
        ></div>

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-3">
            <motion.div
              className={`bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md ${
                isMobileView ? "w-8 h-8" : "w-12 h-12"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </motion.div>
            <div>
              <h3
                className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                  isMobileView ? "text-lg" : "text-xl"
                }`}
              >
                Savings Progress
              </h3>
              <p
                className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
              >
                Track your goals
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                className="text-gray-400 mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <svg
                  className={`${isMobileView ? "w-8 h-8" : "w-12 h-12"} mx-auto`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </motion.div>
              <p className={`text-gray-600 ${isMobileView ? "text-sm" : ""}`}>
                No savings goals set up yet
              </p>
              <p
                className={`text-gray-500 ${isMobileView ? "text-xs" : "text-sm"}`}
              >
                Add savings goals to your accounts to track progress
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
        isMobileView ? "p-3 mb-4 mx-2" : "p-6 mb-8"
      }`}
      style={{
        height: isMobileView ? "350px" : "400px",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Mobile-optimized background elements */}
      <div
        className={`absolute top-0 right-0 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full opacity-20 ${
          isMobileView
            ? "w-12 h-12 -translate-y-6 translate-x-6"
            : "w-28 h-28 -translate-y-14 translate-x-14"
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 bg-gradient-to-tr from-emerald-300 to-cyan-400 rounded-full opacity-15 ${
          isMobileView
            ? "w-8 h-8 translate-y-4 -translate-x-4"
            : "w-20 h-20 translate-y-10 -translate-x-10"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-amber-300 to-orange-400 rounded-full opacity-10 ${
          isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-indigo-300 to-blue-400 rounded-full opacity-10 ${
          isMobileView
            ? "bottom-3 right-12 w-6 h-6"
            : "bottom-12 right-20 w-12 h-12"
        }`}
      ></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Enhanced Mobile Header */}
        <div className={`flex-shrink-0 ${isMobileView ? "mb-3" : "mb-6"}`}>
          {/* Title Section - Always on top for mobile */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <motion.div
                className={`rounded-xl flex items-center justify-center shadow-md ${
                  isMobileView ? "w-8 h-8" : "w-12 h-12"
                } ${
                  activeTab === "budgets"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {activeTab === "budgets" ? (
                  <svg
                    className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                ) : (
                  <svg
                    className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                )}
              </motion.div>
              <div>
                <h3
                  className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                    isMobileView ? "text-lg" : "text-xl"
                  }`}
                >
                  {activeTab === "budgets"
                    ? "Budget Overview"
                    : "Savings Progress"}
                </h3>
                <p
                  className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                >
                  {(() => {
                    const totalForFilter =
                      activeTab === "budgets"
                        ? budgetData.totalBudgetsCount
                        : savingsData.totalGoalsCount;
                    const itemType =
                      activeTab === "budgets" ? "budget" : "savings goal";
                    return `${totalForFilter} ${itemType}${totalForFilter !== 1 ? "s" : ""} tracked`;
                  })()}
                </p>
              </div>
            </div>

            {/* Currency Selector */}
            <div className="relative" ref={currencyRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full transition-all duration-200 flex items-center shadow-md ${
                  isMobileView ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
                }`}
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                disabled={fetchingRates}
              >
                {fetchingRates ? (
                  <RefreshCw
                    size={isMobileView ? 10 : 12}
                    className="animate-spin mr-1"
                  />
                ) : (
                  <DollarSign size={isMobileView ? 10 : 12} className="mr-1" />
                )}
                <span>{displayCurrency}</span>
                <ChevronDown size={isMobileView ? 10 : 12} className="ml-1" />
              </motion.button>

              <AnimatePresence>
                {isCurrencyMenuOpen && availableCurrencies.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 ${
                      isMobileView ? "w-20" : "w-32"
                    }`}
                  >
                    <div className="max-h-32 overflow-y-auto">
                      {availableCurrencies.map((currency) => (
                        <motion.button
                          key={currency}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full text-left px-3 py-2 transition-colors ${isMobileView ? "text-xs" : "text-sm"} ${
                            currency === displayCurrency
                              ? "bg-indigo-100 text-indigo-700 font-medium"
                              : "text-gray-700 hover:bg-indigo-50 active:bg-indigo-100"
                          }`}
                          onClick={() => handleCurrencyChange(currency)}
                        >
                          {currency}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Enhanced Mobile Tab System */}
          <div className="relative">
            <div
              className={`flex ${isMobileView ? "space-x-1" : "space-x-1"} bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1 shadow-inner`}
            >
              <motion.button
                onClick={() => setActiveTab("budgets")}
                className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "budgets"
                    ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50 active:bg-white/70"
                }`}
                whileHover={{ scale: activeTab !== "budgets" ? 1.01 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>📊</span>
                  <span className={isMobileView ? "text-xs" : ""}>Budgets</span>
                  {budgetData.totalBudgetsCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full ${isMobileView ? "text-xs" : "text-xs"} ${
                        activeTab === "budgets"
                          ? "bg-white/20 text-white"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {budgetData.totalBudgetsCount}
                    </span>
                  )}
                </div>
              </motion.button>

              <motion.button
                onClick={() => setActiveTab("savings")}
                className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "savings"
                    ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50 active:bg-white/70"
                }`}
                whileHover={{ scale: activeTab !== "savings" ? 1.01 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>🎯</span>
                  <span className={isMobileView ? "text-xs" : ""}>Savings</span>
                  {savingsData.totalGoalsCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full ${isMobileView ? "text-xs" : "text-xs"} ${
                        activeTab === "savings"
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {savingsData.totalGoalsCount}
                    </span>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Enhanced Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="pr-2" style={{ paddingBottom: "1rem" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-x-hidden"
              >
                {activeTab === "budgets" ? (
                  <>
                    {budgetData.budgets
                      .sort(
                        (a, b) => b.progressPercentage - a.progressPercentage
                      )
                      .map((budget, index) => {
                        const originalSpent = budget.spent;
                        const originalLimit = budget.limitAmount || 0;
                        const originalCurrency =
                          budget.currency || displayCurrency;
                        const convertedSpent = convertToDisplayCurrency(
                          originalSpent,
                          originalCurrency
                        );
                        const convertedLimit = convertToDisplayCurrency(
                          originalLimit,
                          originalCurrency
                        );
                        const needsConversion =
                          originalCurrency !== displayCurrency;
                        const percentage = budget.progressPercentage;
                        const isCompleted = budget.isCompleted;
                        const statusColor = getStatusColor(percentage);

                        return (
                          <motion.div
                            key={budget.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openPreview(budget, "budget")}
                            className={`p-3 rounded-xl border-l-4 shadow-sm hover:shadow-md active:shadow-lg transition-all cursor-pointer ${
                              isCompleted
                                ? "bg-gradient-to-r from-red-50 to-red-100 border-l-red-500 hover:from-red-100 hover:to-red-150"
                                : percentage >= 75
                                  ? "bg-gradient-to-r from-orange-50 to-red-50 border-l-orange-500 hover:from-orange-100 hover:to-red-100"
                                  : percentage >= 50
                                    ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-l-orange-400 hover:from-orange-100 hover:to-yellow-100"
                                    : "bg-gradient-to-r from-green-50 to-emerald-50 border-l-green-400 hover:from-green-100 hover:to-emerald-100"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                <div
                                  className={`${isMobileView ? "p-2" : "p-2"} rounded-xl shadow-sm ${
                                    isCompleted
                                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                      : percentage >= 75
                                        ? "bg-gradient-to-r from-red-400 to-red-500 text-white"
                                        : percentage >= 50
                                          ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                                          : "bg-gradient-to-r from-green-400 to-green-500 text-white"
                                  }`}
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0 max-w-full">
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1 max-w-full">
                                      <div className="flex items-center gap-2 flex-wrap max-w-full mb-2">
                                        <p
                                          className={`font-semibold text-gray-900 truncate max-w-full ${isMobileView ? "text-sm" : "text-sm"}`}
                                        >
                                          {budget.name}
                                        </p>
                                        <span
                                          className={`px-1.5 py-0.5 rounded-full font-medium ${isMobileView ? "text-xs" : "text-xs"} ${
                                            isCompleted
                                              ? "bg-red-100 text-red-700"
                                              : percentage >= 75
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-green-100 text-green-700"
                                          }`}
                                        >
                                          {percentage.toFixed(0)}% spent
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right ml-3 flex-shrink-0">
                                      <p
                                        className={`font-bold ${isMobileView ? "text-sm" : "text-sm"} text-gray-800`}
                                      >
                                        {originalSpent.toLocaleString(
                                          undefined,
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}{" "}
                                        /{" "}
                                        {originalLimit.toLocaleString(
                                          undefined,
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}{" "}
                                        {originalCurrency}
                                      </p>
                                      {needsConversion && (
                                        <p
                                          className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-xs"}`}
                                        >
                                          ≈{" "}
                                          {convertedSpent.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}{" "}
                                          /{" "}
                                          {convertedLimit.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}{" "}
                                          {displayCurrency}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 shadow-inner">
                                      <motion.div
                                        className={`h-2 rounded-full ${statusColor.bar}`}
                                        initial={{ width: 0 }}
                                        animate={{
                                          width: `${Math.min(percentage, 100)}%`,
                                        }}
                                        transition={{
                                          duration: 0.4,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </>
                ) : (
                  <>
                    {savingsData.accounts
                      .sort(
                        (a, b) => b.progressPercentage - a.progressPercentage
                      )
                      .map((account, index) => {
                        const originalSaved = account.amount || 0;
                        const originalGoal =
                          account.savingAccount?.targetAmount || 0;
                        const originalCurrency =
                          account.currency || displayCurrency;
                        const convertedSaved = convertToDisplayCurrency(
                          originalSaved,
                          originalCurrency
                        );
                        const convertedGoal = convertToDisplayCurrency(
                          originalGoal,
                          originalCurrency
                        );
                        const needsConversion =
                          originalCurrency !== displayCurrency;

                        return (
                          <motion.div
                            key={account.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openPreview(account, "savings")}
                            className={`p-3 rounded-xl border-l-4 shadow-sm hover:shadow-md active:shadow-lg transition-all cursor-pointer ${
                              account.isCompleted
                                ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-l-emerald-500 hover:from-emerald-100 hover:to-teal-100"
                                : account.progressPercentage >= 80
                                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border-l-emerald-400 hover:from-emerald-100 hover:to-emerald-150"
                                  : account.progressPercentage >= 50
                                    ? "bg-gradient-to-r from-teal-50 to-emerald-50 border-l-teal-400 hover:from-teal-100 hover:to-emerald-100"
                                    : "bg-gradient-to-r from-cyan-50 to-teal-50 border-l-cyan-400 hover:from-cyan-100 hover:to-teal-100"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                <div
                                  className={`${isMobileView ? "p-2" : "p-2"} rounded-xl shadow-sm ${
                                    account.isCompleted
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                                      : account.progressPercentage >= 80
                                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white"
                                        : account.progressPercentage >= 50
                                          ? "bg-gradient-to-r from-teal-400 to-emerald-400 text-white"
                                          : "bg-gradient-to-r from-cyan-400 to-teal-400 text-white"
                                  }`}
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0 max-w-full">
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1 max-w-full">
                                      <div className="flex items-center gap-2 flex-wrap max-w-full mb-2">
                                        <p
                                          className={`font-semibold text-gray-900 truncate max-w-full ${isMobileView ? "text-sm" : "text-sm"}`}
                                        >
                                          {account.name}
                                        </p>
                                        <span
                                          className={`px-1.5 py-0.5 rounded-full font-medium ${isMobileView ? "text-xs" : "text-xs"} ${
                                            account.isCompleted
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-teal-100 text-teal-700"
                                          }`}
                                        >
                                          {account.progressPercentage.toFixed(
                                            0
                                          )}
                                          % saved
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right ml-3 flex-shrink-0">
                                      <p
                                        className={`font-bold ${isMobileView ? "text-sm" : "text-sm"} text-gray-800`}
                                      >
                                        {originalSaved.toLocaleString(
                                          undefined,
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}{" "}
                                        /{" "}
                                        {originalGoal.toLocaleString(
                                          undefined,
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}{" "}
                                        {originalCurrency}
                                      </p>
                                      {needsConversion && (
                                        <p
                                          className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-xs"}`}
                                        >
                                          ≈{" "}
                                          {convertedSaved.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}{" "}
                                          /{" "}
                                          {convertedGoal.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}{" "}
                                          {displayCurrency}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 shadow-inner">
                                      <motion.div
                                        className={`h-2 rounded-full ${
                                          account.isCompleted
                                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                            : account.progressPercentage >= 80
                                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                              : account.progressPercentage >= 50
                                                ? "bg-gradient-to-r from-teal-400 to-emerald-400"
                                                : "bg-gradient-to-r from-cyan-400 to-teal-400"
                                        }`}
                                        initial={{ width: 0 }}
                                        animate={{
                                          width: `${Math.min(account.progressPercentage, 100)}%`,
                                        }}
                                        transition={{
                                          duration: 0.4,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Preview Popup */}
      <AnimatePresence>
        {previewItem && previewType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4 ${
              isMobileView 
                ? "fixed inset-0" 
                : "absolute inset-0"
            }`}
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: isMobileView ? 20 : 0 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: isMobileView ? 20 : 0 }}
              className={`bg-white rounded-2xl shadow-2xl relative overflow-hidden ${
                isMobileView 
                  ? "w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto" 
                  : "w-full max-w-md"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`bg-gradient-to-r ${
                  previewType === "budget"
                    ? "from-blue-500 to-purple-600"
                    : "from-emerald-500 to-teal-600"
                } p-4`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      {previewType === "budget" ? (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {previewItem.name}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {previewType === "budget"
                          ? "Budget Details"
                          : "Savings Goal"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closePreview}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {previewType === "budget" ? (
                  <>
                    {/* Budget Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 font-medium">
                          Spent
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {convertToDisplayCurrency(
                            previewItem.spent,
                            previewItem.currency
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {displayCurrency}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 font-medium">
                          Remaining
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {convertToDisplayCurrency(
                            previewItem.remaining,
                            previewItem.currency
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {displayCurrency}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progress
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {previewItem.progressPercentage?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                          className={`h-3 rounded-full ${
                            getStatusColor(previewItem.progressPercentage).bar
                          }`}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(
                              previewItem.progressPercentage,
                              100
                            )}%`,
                          }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Days Left</p>
                        <p className="text-lg font-bold text-gray-900">
                          {getDaysRemainingInMonth()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Daily Budget</p>
                        <p className="text-lg font-bold text-gray-900">
                          {getDaysRemainingInMonth() > 0
                            ? (
                                convertToDisplayCurrency(
                                  previewItem.remaining,
                                  previewItem.currency
                                ) / getDaysRemainingInMonth()
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0"}
                        </p>
                      </div>
                    </div>

                    {/* Categories */}
                    {previewItem.customCategories &&
                      previewItem.customCategories.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Categories
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {previewItem.customCategories
                              .slice(0, 3)
                              .map((category: any, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                                >
                                  {category.name}
                                </span>
                              ))}
                            {previewItem.customCategories.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{previewItem.customCategories.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  <>
                    {/* Savings Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 font-medium">
                          Current
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {convertToDisplayCurrency(
                            previewItem.amount || 0,
                            previewItem.currency
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {displayCurrency}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 font-medium">
                          Goal
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {convertToDisplayCurrency(
                            previewItem.savingAccount?.targetAmount || 0,
                            previewItem.currency
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {displayCurrency}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progress
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {previewItem.progressPercentage?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                          className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(
                              previewItem.progressPercentage,
                              100
                            )}%`,
                          }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="text-center pt-2">
                      <p className="text-xs text-gray-500">Amount Needed</p>
                      <p className="text-lg font-bold text-gray-900">
                        {Math.max(
                          0,
                          convertToDisplayCurrency(
                            (previewItem.savingAccount?.targetAmount || 0) -
                              (previewItem.amount || 0),
                            previewItem.currency
                          )
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {displayCurrency}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      {previewItem.isCompleted ? (
                        <div className="flex items-center justify-center space-x-1 text-emerald-600">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            Goal Completed!
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Keep saving to reach your goal
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetSavingsTabSection;