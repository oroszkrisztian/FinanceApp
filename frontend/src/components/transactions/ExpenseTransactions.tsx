import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ArrowDown,
  Tag,
  ChevronRight,
  RefreshCw,
  X,
  ChevronDown,
  Filter,
  Plus,
  Clock,
  CreditCard,
} from "lucide-react";

import CreateExpensePopup from "./CreateExpensePopup";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import { Account } from "../../interfaces/Account";
import { CurrencyType, TransactionType } from "../../interfaces/enums";
import { Transaction } from "../../interfaces/Transaction";
import DateRangeFilter from "../payments/DateRangeFilter";
import SearchWithSuggestions from "../payments/SearchWithSuggestions";
import TransactionDetailsPopup from "./transactionsHistory/TransactionDetailsPopup";
import { CustomCategory } from "../../interfaces/CustomCategory";

interface ExpenseTransactionsProps {
  isSmallScreen: boolean;
  transactions: Transaction[];
  accounts: Account[];
  categories: CustomCategory[];
  budgets: any[];
  onTransactionCreated: () => void;
  onCategoryCreated: () => void;
  accountsLoading?: boolean;
  currentIncomePopupStep?: number;
  onIncomePopupStepChange?: (step: number) => void;
}

const ExpenseTransactions: React.FC<ExpenseTransactionsProps> = ({
  isSmallScreen,
  transactions,
  accounts,
  categories,
  budgets,
  onTransactionCreated,
  onCategoryCreated,
  accountsLoading = false,
  currentIncomePopupStep = 1,
  onIncomePopupStepChange,
}) => {
  const [rates, setRates] = useState<ExchangeRates>({});
  const [displayCurrency, setDisplayCurrency] = useState<string>(
    CurrencyType.RON
  );
  const [fetchingRates, setFetchingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [accountSearchTerm, setAccountSearchTerm] = useState("");

  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  };

  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>(getCurrentMonthRange());

  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] =
    useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] =
    useState(false);
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);

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
      setError(null);
      try {
        const ratesData = await fetchExchangeRates();
        setRates(ratesData);
        setAvailableCurrencies(Object.keys(ratesData));
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
        setError("Could not fetch exchange rates. Please try again later.");
      } finally {
        setFetchingRates(false);
      }
    };
    loadExchangeRates();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isCurrencyMenuOpen && !target.closest(".currency-dropdown")) {
        setIsCurrencyMenuOpen(false);
      }
      if (isDateFilterOpen && !target.closest(".date-filter-popup")) {
        setIsDateFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCurrencyMenuOpen, isDateFilterOpen]);

  
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

  const getAccountName = (accountId: number | undefined) => {
    if (!accountId) return "-";
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? account.name : `Account ${accountId}`;
  };

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

  const clearAllFilters = () => {
    setNameSearchTerm("");
    setAccountSearchTerm("");
    setDateRange(getCurrentMonthRange()); 
  };

  const formatDateRangeDisplay = () => {
    const formatDateShort = (date: Date) => {
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    };

    if (dateRange.start && dateRange.end) {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      );

      if (
        dateRange.start.getTime() === currentMonthStart.getTime() &&
        dateRange.end.getTime() === currentMonthEnd.getTime()
      ) {
        return `Current Month (${formatDateShort(dateRange.start)} - ${formatDateShort(dateRange.end)})`;
      }
      return `${formatDateShort(dateRange.start)} - ${formatDateShort(dateRange.end)}`;
    } else if (dateRange.start) {
      return `From ${formatDateShort(dateRange.start)}`;
    } else if (dateRange.end) {
      return `Until ${formatDateShort(dateRange.end)}`;
    }
    return "";
  };

  const expenseTransactions = useMemo(() => {
    const lowerCaseNameSearch = nameSearchTerm.toLowerCase();
    const lowerCaseAccountSearch = accountSearchTerm.toLowerCase();

    return transactions
      .filter((transaction) => transaction.type === TransactionType.EXPENSE)
      .filter((transaction) => {
        const nameMatch =
          lowerCaseNameSearch === "" ||
          transaction.name?.toLowerCase().includes(lowerCaseNameSearch) ||
          transaction.description?.toLowerCase().includes(lowerCaseNameSearch);

        let accountMatch = true;
        if (lowerCaseAccountSearch !== "") {
          const fromAccount = accounts.find(
            (acc) => acc.id === transaction.fromAccountId
          );
          accountMatch =
            fromAccount?.name.toLowerCase().includes(lowerCaseAccountSearch) ||
            false;
        }

        let dateMatch = true;
        if (dateRange.start || dateRange.end) {
          const transactionDate = new Date(transaction.date);
          if (dateRange.start && dateRange.end) {
            dateMatch =
              transactionDate >= dateRange.start &&
              transactionDate <= dateRange.end;
          } else if (dateRange.start) {
            dateMatch = transactionDate >= dateRange.start;
          } else if (dateRange.end) {
            dateMatch = transactionDate <= dateRange.end;
          }
        }

        return nameMatch && accountMatch && dateMatch;
      });
  }, [transactions, nameSearchTerm, accountSearchTerm, dateRange, accounts]);

  const transactionNames = useMemo(() => {
    return Array.from(
      new Set(
        transactions
          .filter((t) => t.type === TransactionType.EXPENSE)
          .map((t) => t.name)
          .filter(Boolean)
      )
    );
  }, [transactions]);

  const accountNames = useMemo(() => {
    return accounts.map((acc) => acc.name);
  }, [accounts]);

  const hasActiveFilters =
    nameSearchTerm !== "" || accountSearchTerm !== "" || !isCurrentMonth();

  function isCurrentMonth() {
    if (!dateRange.start || !dateRange.end) return false;
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return (
      dateRange.start.getTime() === currentMonthStart.getTime() &&
      dateRange.end.getTime() === currentMonthEnd.getTime()
    );
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailsOpen(true);
  };

  const totalMonthly = expenseTransactions.reduce((sum, transaction) => {
    const amountInDisplayCurrency = convertToDisplayCurrency(
      transaction.amount,
      transaction.currency
    );
    return sum + amountInDisplayCurrency;
  }, 0);

  return (
    <>
      <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
          isMobileView ? "p-2.5 mb-4 mx-2" : "p-4 mb-8"
        }`}
        style={{
          height: isMobileView ? "calc(100vh - 160px)" : "calc(100vh - 80px)",
        }}
      >
        {/* Mobile-optimized background elements */}
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-red-300 to-rose-500 rounded-full opacity-20 ${
            isMobileView
              ? "w-12 h-12 -translate-y-6 translate-x-6"
              : "w-28 h-28 -translate-y-14 translate-x-14"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 bg-gradient-to-tr from-rose-300 to-red-500 rounded-full opacity-15 ${
            isMobileView
              ? "w-8 h-8 translate-y-4 -translate-x-4"
              : "w-20 h-20 translate-y-10 -translate-x-10"
          }`}
        ></div>
        <div
          className={`absolute bg-gradient-to-br from-red-200 to-rose-300 rounded-full opacity-10 ${
            isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
          }`}
        ></div>
        <div
          className={`absolute bg-gradient-to-br from-rose-300 to-red-400 rounded-full opacity-10 ${
            isMobileView
              ? "bottom-3 right-12 w-6 h-6"
              : "bottom-12 right-20 w-12 h-12"
          }`}
        ></div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Enhanced Header */}
          <div className={`flex-shrink-0 ${isMobileView ? "mb-2" : "mb-4"}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <motion.div
                  className={`bg-gradient-to-r from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md ${
                    isMobileView ? "w-7 h-7" : "w-10 h-10"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={`${isMobileView ? "text-xs" : "text-lg"}`}>
                    💸
                  </span>
                </motion.div>
                <div>
                  <h2
                    className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                      isMobileView ? "text-base" : "text-lg"
                    }`}
                  >
                    Expenses
                  </h2>
                  <p
                    className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                  >
                    {expenseTransactions.length} expense
                    {expenseTransactions.length !== 1 ? "s" : ""} this period
                  </p>
                </div>
              </div>
              <div
                className={`${isMobileView ? "py-1.5 px-3 bg-red-100/80 backdrop-blur-sm rounded-lg shadow-inner border border-red-200/50" : "bg-red-50/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-red-200/50"}`}
              >
                {fetchingRates ? (
                  <span className="flex items-center text-red-700">
                    <RefreshCw size={14} className="animate-spin mr-1" />
                    Loading...
                  </span>
                ) : (
                  <span
                    className={`font-semibold text-red-700 ${isMobileView ? "text-base" : "text-lg"}`}
                  >
                    {formatAmount(totalMonthly)} {displayCurrency}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <div className="relative currency-dropdown">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md flex items-center transition-all ${
                    isMobileView
                      ? "p-2 px-3 rounded-full text-sm"
                      : "p-2 px-3 rounded-full"
                  }`}
                  onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                  title="Select currency"
                  disabled={fetchingRates}
                >
                  {displayCurrency}
                  {!fetchingRates && <ChevronDown size={16} className="ml-1" />}
                  {fetchingRates && (
                    <RefreshCw size={14} className="animate-spin ml-1" />
                  )}
                </motion.button>

                {isCurrencyMenuOpen && availableCurrencies.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-36 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-red-200/50 z-50 overflow-hidden"
                  >
                    <div className="max-h-28 overflow-y-auto">
                      {availableCurrencies.map((curr) => (
                        <motion.button
                          key={curr}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            curr === displayCurrency
                              ? "bg-red-100 text-red-700 font-medium"
                              : "text-gray-700 hover:bg-red-50"
                          }`}
                          onClick={() =>
                            handleCurrencyChange(curr as CurrencyType)
                          }
                          whileHover={{
                            backgroundColor:
                              curr === displayCurrency
                                ? undefined
                                : "rgba(239, 68, 68, 0.05)",
                          }}
                        >
                          {curr}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-2">
                <motion.button
                  ref={dateFilterButtonRef}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/80 backdrop-blur-sm text-red-600 p-2 rounded-full hover:bg-red-50 transition-all shadow-md border border-red-200/50 flex items-center justify-center relative"
                  onClick={() => setIsDateFilterOpen(true)}
                  title="Date Filter"
                >
                  <Calendar size={20} />
                  {!isCurrentMonth() && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      !
                    </span>
                  )}
                </motion.button>

                {isMobileView && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/80 backdrop-blur-sm text-red-600 p-2 rounded-full hover:bg-red-50 transition-all shadow-md border border-red-200/50 flex items-center justify-center relative"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    title={isFilterExpanded ? "Hide Filters" : "Show Filters"}
                  >
                    <Filter size={20} />
                    {hasActiveFilters && !isFilterExpanded && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                        !
                      </span>
                    )}
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${
                    isMobileView
                      ? "bg-white/80 backdrop-blur-sm text-red-600 p-2 rounded-full hover:bg-red-50 transition-all shadow-md border border-red-200/50 flex items-center justify-center"
                      : "bg-white/80 backdrop-blur-sm text-red-600 px-3 py-1 rounded hover:bg-red-50 transition-all text-sm font-medium shadow-md border border-red-200/50 flex items-center gap-1"
                  }`}
                  onClick={() => setIsCreateExpenseModalOpen(true)}
                  title="Add Expense"
                >
                  <Plus size={isMobileView ? 20 : 14} />
                  {!isMobileView && <span>Add Expense</span>}
                </motion.button>
              </div>
            </div>

            {(dateRange.start || dateRange.end) && (
              <div
                className={`${isMobileView ? "mt-1 p-1 bg-red-100/60 backdrop-blur-sm rounded-md border border-red-200/50" : "mt-1 bg-red-50/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-red-200/50"} text-xs text-red-700 flex items-center gap-1`}
              >
                <Calendar size={12} />
                <span className="font-medium">{formatDateRangeDisplay()}</span>
                {isMobileView && !isCurrentMonth() && (
                  <motion.button
                    className="ml-auto text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-200/50 transition-colors"
                    onClick={() => setDateRange(getCurrentMonthRange())}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={14} />
                  </motion.button>
                )}
              </div>
            )}

            {(!isMobileView || isFilterExpanded) && (
              <motion.div
                initial={isMobileView ? { height: 0, opacity: 0 } : false}
                animate={isMobileView ? { height: "auto", opacity: 1 } : {}}
                exit={isMobileView ? { height: 0, opacity: 0 } : {}}
                className={`${isMobileView ? "mt-2" : "mt-2"} grid grid-cols-1 ${isMobileView ? "" : "md:grid-cols-2"} gap-2 overflow-visible`}
              >
                <div className="relative z-30">
                  <SearchWithSuggestions
                    placeholder="Search by name..."
                    onSearch={setNameSearchTerm}
                    suggestions={transactionNames}
                    variant="outgoing"
                  />
                </div>
                <div className="relative z-20">
                  <SearchWithSuggestions
                    placeholder="Search by account..."
                    onSearch={setAccountSearchTerm}
                    suggestions={accountNames}
                    variant="outgoing"
                  />
                </div>
              </motion.div>
            )}

            {isMobileView && hasActiveFilters && !isFilterExpanded && (
              <motion.div
                className="flex justify-between items-center mt-2 text-xs text-red-700 bg-red-100/60 backdrop-blur-sm rounded-md px-2 py-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="flex items-center gap-1 font-medium">
                  <Filter size={12} />
                  {nameSearchTerm || accountSearchTerm
                    ? "Filters applied"
                    : "Custom date range"}
                </span>
                <motion.button
                  className="text-red-600 hover:text-red-800 px-2 py-0.5 bg-red-200/50 rounded font-medium transition-colors"
                  onClick={clearAllFilters}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reset
                </motion.button>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {isDateFilterOpen && (
              <DateRangeFilter
                dateRange={dateRange}
                setDateRange={setDateRange}
                isSmallScreen={isMobileView}
                isOpen={isDateFilterOpen}
                setIsOpen={setIsDateFilterOpen}
                buttonRef={dateFilterButtonRef}
                colors={{
                  gradientFrom: "from-red-600",
                  gradientTo: "to-red-500",
                }}
              />
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50/80 backdrop-blur-sm p-2 text-red-700 text-sm text-center border border-red-200 rounded-lg mb-2"
            >
              {error}
            </motion.div>
          )}

          <div className="bg-transparent flex-1 overflow-y-auto">
            {expenseTransactions.length > 0 ? (
              <div className={isMobileView ? "space-y-1.5" : "space-y-1"}>
                {expenseTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group rounded-xl border-l-4 shadow-sm active:shadow-md transition-all w-full cursor-pointer backdrop-blur-sm relative bg-white/60 border-l-red-400 hover:bg-red-50/60 border border-red-200/30 ${isMobileView ? "p-2.5" : "p-3"}`}
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    {/* Unified design for both mobile and desktop */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`font-semibold text-gray-800 truncate ${isMobileView ? "text-sm" : "text-base"}`}
                          >
                            {transaction.name || "Untitled Transaction"}
                          </h3>
                          <span
                            className={`text-red-600 font-bold whitespace-nowrap ml-2 ${isMobileView ? "text-sm" : "text-lg"}`}
                          >
                            -{formatAmount(transaction.amount)}{" "}
                            {transaction.currency}
                            {!isMobileView &&
                              transaction.currency !== displayCurrency && (
                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                  (
                                  {formatAmount(
                                    convertToDisplayCurrency(
                                      transaction.amount,
                                      transaction.currency
                                    )
                                  )}{" "}
                                  {displayCurrency})
                                </span>
                              )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span className="truncate">
                            {getAccountName(transaction.fromAccountId)}
                          </span>
                          <span className="whitespace-nowrap ml-2">
                            {new Date(transaction.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap bg-blue-100/80 text-blue-700">
                              <Calendar size={10} />
                              {formatDate(transaction.date)}
                            </span>
                            {isMobileView &&
                              transaction.currency !== displayCurrency && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100/80 text-gray-600 truncate">
                                  (
                                  {formatAmount(
                                    convertToDisplayCurrency(
                                      transaction.amount,
                                      transaction.currency
                                    )
                                  )}{" "}
                                  {displayCurrency})
                                </span>
                              )}
                          </div>

                          <div className="flex items-center gap-1">
                            <span
                              className={`${isMobileView ? "hidden" : "opacity-0 group-hover:opacity-100"} transition-opacity text-xs text-gray-500`}
                            >
                              View Details
                            </span>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                        </div>

                        {/* Category badges */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(transaction.transactionCategories || []).map(
                            (category: {
                              customCategoryId: number;
                              customCategory?: { name: string };
                            }) => (
                              <span
                                key={category.customCategoryId}
                                className="text-xs px-2 py-0.5 rounded-md bg-red-100/80 text-red-700 truncate flex items-center gap-1"
                              >
                                <Tag size={10} />
                                {category.customCategory?.name ||
                                  "Uncategorized"}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                {hasActiveFilters ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-red-100/80 backdrop-blur-sm p-4 rounded-full border border-red-200/50 text-4xl"
                    >
                      💸
                    </motion.div>
                    <p>No expenses matching your search criteria found</p>
                    <motion.button
                      className="mt-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-md hover:from-red-700 hover:to-rose-800 transition-all shadow-md"
                      onClick={clearAllFilters}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Reset to Current Month
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-red-100/80 backdrop-blur-sm p-4 rounded-full border border-red-200/50 text-4xl"
                    >
                      💸
                    </motion.div>
                    <p>No expenses yet</p>
                    <motion.button
                      className="mt-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-md hover:from-red-700 hover:to-rose-800 transition-all shadow-md"
                      onClick={() => setIsCreateExpenseModalOpen(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Add Your First Expense
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Expense Modal */}
      <CreateExpensePopup
        isOpen={isCreateExpenseModalOpen}
        onClose={() => setIsCreateExpenseModalOpen(false)}
        accounts={accounts.filter((acc) => acc.type === "DEFAULT")}
        categories={categories}
        accountsLoading={accountsLoading}
        onSuccess={() => {
          onTransactionCreated();
          setIsCreateExpenseModalOpen(false);
        }}
        onCategoryCreated={onCategoryCreated}
        currentStep={currentIncomePopupStep}
        onStepChange={onIncomePopupStepChange}
      />

      {/* Transaction Details Popup */}
      {selectedTransaction && (
        <TransactionDetailsPopup
          transaction={selectedTransaction}
          accounts={accounts}
          formatAmount={formatAmount}
          formatDate={formatDate}
          onClose={() => setIsTransactionDetailsOpen(false)}
          isOpen={isTransactionDetailsOpen}
        />
      )}
    </>
  );
};

export default ExpenseTransactions;
