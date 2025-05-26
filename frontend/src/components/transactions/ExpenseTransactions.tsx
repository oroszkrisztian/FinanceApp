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

interface ExpenseTransactionsProps {
  isSmallScreen: boolean;
  transactions: Transaction[];
  accounts: Account[];
  categories: any[];
  budgets: any[];
  onTransactionCreated: () => void;
  accountsLoading?: boolean;
}

const ExpenseTransactions: React.FC<ExpenseTransactionsProps> = ({
  isSmallScreen,
  transactions,
  accounts,
  categories,
  budgets,
  onTransactionCreated,
  accountsLoading = false,
}) => {
  // State management
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
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] =
    useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] =
    useState(false);
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null);

  // Load exchange rates
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

  // Handle outside clicks
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

  // Helper functions
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
    setDateRange({ start: null, end: null });
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
      return `${formatDateShort(dateRange.start)} - ${formatDateShort(dateRange.end)}`;
    } else if (dateRange.start) {
      return `From ${formatDateShort(dateRange.start)}`;
    } else if (dateRange.end) {
      return `Until ${formatDateShort(dateRange.end)}`;
    }
    return "";
  };

  // Filtered expense transactions
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

  // Suggestions for search
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
    nameSearchTerm !== "" ||
    accountSearchTerm !== "" ||
    dateRange.start !== null ||
    dateRange.end !== null;

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
      <div className="relative">
        <div
          className="flex flex-col rounded-lg overflow-hidden shadow-lg relative"
          style={{
            height: isSmallScreen
              ? "calc(100vh - 180px)"
              : "calc(100vh - 100px)",
          }}
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-white text-red-600 rounded-full p-1.5 shadow-md">
                  <ArrowDown size={20} />
                </div>
                <h2 className="text-lg font-semibold">Expenses</h2>
              </div>
              <div
                className={`${isSmallScreen ? "py-1.5 px-3 bg-red-700/30 rounded-lg shadow-inner" : ""}`}
              >
                {fetchingRates ? (
                  <span className="flex items-center text-red-100">
                    <RefreshCw size={14} className="animate-spin mr-1" />
                    Loading...
                  </span>
                ) : (
                  <span
                    className={`font-semibold ${isSmallScreen ? "text-base" : ""}`}
                  >
                    {formatAmount(totalMonthly)} {displayCurrency}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div className="relative currency-dropdown">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-700 hover:bg-red-800 text-white p-2 px-3 rounded-full transition-colors flex items-center"
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
                    className="absolute top-full left-0 mt-2 w-36 bg-white rounded-lg shadow-lg z-50 overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {availableCurrencies.map((curr) => (
                        <button
                          key={curr}
                          className={`w-full text-left px-3 py-2 text-sm ${
                            curr === displayCurrency
                              ? "bg-red-100 text-red-700 font-medium"
                              : "text-gray-700 hover:bg-red-50"
                          } transition-colors`}
                          onClick={() =>
                            handleCurrencyChange(curr as CurrencyType)
                          }
                        >
                          {curr}
                        </button>
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
                  className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center"
                  onClick={() => setIsDateFilterOpen(true)}
                  title="Date Filter"
                >
                  <Calendar size={20} />
                  {(dateRange.start || dateRange.end) && (
                    <span className="absolute -top-1 -right-1 bg-red-700 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      !
                    </span>
                  )}
                </motion.button>

                {isSmallScreen && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    title={isFilterExpanded ? "Hide Filters" : "Show Filters"}
                  >
                    <Filter size={20} />
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 bg-red-700 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        !
                      </span>
                    )}
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${
                    isSmallScreen
                      ? "bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center"
                      : "bg-white text-red-600 px-3 py-1 rounded hover:bg-red-50 transition-colors text-sm font-medium shadow-sm flex items-center gap-1"
                  }`}
                  onClick={() => setIsCreateExpenseModalOpen(true)}
                  title="Add Expense"
                >
                  <Plus size={isSmallScreen ? 20 : 14} />
                  {!isSmallScreen && <span>Add Expense</span>}
                </motion.button>
              </div>
            </div>

            {(dateRange.start || dateRange.end) && (
              <div
                className={`${isSmallScreen ? "mt-1 p-1.5 bg-red-700/20 rounded-md" : "mt-1"} text-xs text-red-100 flex items-center gap-1`}
              >
                <Calendar size={12} />
                <span>{formatDateRangeDisplay()}</span>
                {isSmallScreen && (
                  <button
                    className="ml-auto text-red-100 hover:text-white"
                    onClick={() => setDateRange({ start: null, end: null })}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {(!isSmallScreen || isFilterExpanded) && (
              <motion.div
                initial={isSmallScreen ? { height: 0, opacity: 0 } : false}
                animate={isSmallScreen ? { height: "auto", opacity: 1 } : {}}
                exit={isSmallScreen ? { height: 0, opacity: 0 } : {}}
                className={`${isSmallScreen ? "mt-3" : "mt-3"} grid grid-cols-1 ${isSmallScreen ? "" : "md:grid-cols-2"} gap-2 overflow-visible`}
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

            {isSmallScreen && hasActiveFilters && !isFilterExpanded && (
              <div className="flex justify-between items-center mt-3 text-xs text-red-100 bg-red-700/20 rounded-md px-2 py-1.5">
                <span className="flex items-center gap-1">
                  <Filter size={12} />
                  {nameSearchTerm || accountSearchTerm ? "Filters applied" : ""}
                </span>
                <button
                  className="text-red-100 hover:text-white px-2 py-0.5 bg-red-700/30 rounded"
                  onClick={clearAllFilters}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {isDateFilterOpen && (
              <DateRangeFilter
                dateRange={dateRange}
                setDateRange={setDateRange}
                isSmallScreen={isSmallScreen}
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
              className="bg-red-50 p-2 text-red-700 text-sm text-center border-b border-red-200"
            >
              {error}
            </motion.div>
          )}

          {/* Content */}
          <div className="bg-white flex-1 overflow-y-auto">
            {expenseTransactions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {expenseTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="group p-4 hover:bg-red-50 transition-colors cursor-pointer relative"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    {isSmallScreen ? (
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <h3 className="font-medium text-gray-800 flex items-center gap-1">
                              {transaction.name || "Untitled Transaction"}
                            </h3>
                            <div className="text-sm text-gray-500 mt-0.5">
                              {getAccountName(transaction.fromAccountId)}
                            </div>
                            <div className="flex items-center mt-2 gap-1.5 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-gray-100 text-gray-700">
                                <Calendar size={12} />
                                {formatDate(transaction.date)}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-gray-100 text-gray-700">
                                <Clock size={12} />
                                {new Date(transaction.date).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-red-600 font-semibold flex items-center">
                              -{formatAmount(transaction.amount)}{" "}
                              {transaction.currency}
                            </span>
                            {transaction.currency !== displayCurrency && (
                              <span className="text-xs text-gray-500">
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
                        </div>
                        <div className="flex justify-end items-center mt-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">
                              View Details
                            </span>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-800 flex items-center gap-1">
                              {transaction.name || "Untitled Transaction"}
                            </h3>
                            <div className="text-sm text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <CreditCard size={14} />
                                {getAccountName(transaction.fromAccountId)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-red-600 font-semibold flex items-center">
                              -{formatAmount(transaction.amount)}{" "}
                              {transaction.currency}
                              {transaction.currency !== displayCurrency && (
                                <span className="ml-1 text-xs text-gray-500">
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
                        </div>

                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatDate(transaction.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>
                                {new Date(transaction.date).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500">
                              View Details
                            </span>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                {hasActiveFilters ? (
                  <>
                    <p>No expenses matching your search criteria found</p>
                    <button
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-red-100 p-4 rounded-full">
                      <ArrowDown size={32} className="text-red-600" />
                    </div>
                    <p>No expenses yet</p>
                    <button
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      onClick={() => setIsCreateExpenseModalOpen(true)}
                    >
                      Add Your First Expense
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Expense Modal */}
        <CreateExpensePopup
          isOpen={isCreateExpenseModalOpen}
          onClose={() => setIsCreateExpenseModalOpen(false)}
          accounts={accounts.filter((acc) => acc.type === "DEFAULT")}
          categories={categories}
          budgets={budgets}
          accountsLoading={accountsLoading}
          onSuccess={() => {
            onTransactionCreated();
            setIsCreateExpenseModalOpen(false);
          }}
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
      </div>
    </>
  );
};

export default ExpenseTransactions;
