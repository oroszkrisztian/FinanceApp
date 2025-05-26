import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ArrowUp,
  ChevronRight,
  RefreshCw,
  X,
  ChevronDown,
  Filter,
  Plus,
  Clock,
  CreditCard,
} from "lucide-react";
import { Account } from "../../interfaces/Account";
import { CurrencyType, TransactionType } from "../../interfaces/enums";
import { Transaction } from "../../interfaces/Transaction";
import {
  ExchangeRates,
  validateCurrencyConversion,
  convertAmount,
} from "../../services/exchangeRateService";
import DateRangeFilter from "../payments/DateRangeFilter";
import SearchWithSuggestions from "../payments/SearchWithSuggestions";
import TransactionDetailsPopup from "./transactionsHistory/TransactionDetailsPopup";
import AddIncomePopup from "./AddIncomePopup";

interface IncomeTransactionsSectionProps {
  transactions: Transaction[];
  accounts: Account[];
  rates: ExchangeRates;
  availableCurrencies: string[];
  fetchingRates: boolean;
  formatAmount: (amount: number) => string;
  formatDate: (date: Date) => string;
  onTransactionClick: (transaction: Transaction) => void;
  onAddIncomeClick: () => void;
  isSmallScreen: boolean;
  onTransactionCreated: () => void;
  accountsLoading?: boolean;
}

const IncomeTransactionsSection: React.FC<IncomeTransactionsSectionProps> = ({
  transactions,
  accounts,
  rates,
  availableCurrencies,
  fetchingRates,
  formatAmount,
  formatDate,
  onTransactionClick,
  onAddIncomeClick,
  isSmallScreen,
  onTransactionCreated,
  accountsLoading = false,
}) => {
  const [displayCurrency, setDisplayCurrency] = useState<string>(
    CurrencyType.RON
  );
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] =
    useState(false);
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);

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

  const filteredTransactions = useMemo(() => {
    const lowerCaseNameSearch = nameSearchTerm.toLowerCase();
    const lowerCaseAccountSearch = accountSearchTerm.toLowerCase();

    return transactions
      .filter((transaction) => transaction.type === TransactionType.INCOME)
      .filter((transaction) => {
        const nameMatch =
          lowerCaseNameSearch === "" ||
          transaction.name?.toLowerCase().includes(lowerCaseNameSearch) ||
          transaction.description?.toLowerCase().includes(lowerCaseNameSearch);

        let accountMatch = true;
        if (lowerCaseAccountSearch !== "") {
          const toAccount = accounts.find(
            (acc) => acc.id === transaction.toAccountId
          );
          accountMatch =
            toAccount?.name.toLowerCase().includes(lowerCaseAccountSearch) ||
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
          .filter((t) => t.type === TransactionType.INCOME)
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

  const totalMonthly = filteredTransactions.reduce((sum, transaction) => {
    return (
      sum + convertToDisplayCurrency(transaction.amount, transaction.currency)
    );
  }, 0);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailsOpen(true);
  };

  return (
    <div className="relative">
      <div
        className="flex flex-col rounded-lg overflow-hidden shadow-lg"
        style={{
          height: isSmallScreen ? "calc(100vh - 180px)" : "calc(100vh - 100px)",
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white text-green-600 rounded-full p-1.5 shadow-md">
                <ArrowUp size={20} />
              </div>
              <h2 className="text-lg font-semibold">Income</h2>
            </div>
            <div
              className={`${isSmallScreen ? "py-1.5 px-3 bg-green-700/30 rounded-lg shadow-inner" : ""}`}
            >
              {fetchingRates ? (
                <span className="flex items-center text-green-100">
                  <RefreshCw size={14} className="animate-spin mr-1" />
                  Loading...
                </span>
              ) : (
                <span
                  className={`font-semibold ${isSmallScreen ? "text-base" : ""}`}
                >
                  +{formatAmount(totalMonthly)} {displayCurrency}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <div className="relative currency-dropdown">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-700 hover:bg-green-800 text-white p-2 px-3 rounded-full transition-colors flex items-center"
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
                            ? "bg-green-100 text-green-700 font-medium"
                            : "text-gray-700 hover:bg-green-50"
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
                className="bg-white text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors shadow-sm flex items-center justify-center relative"
                onClick={() => setIsDateFilterOpen(true)}
                title="Date Filter"
              >
                <Calendar size={20} />
                {(dateRange.start || dateRange.end) && (
                  <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    !
                  </span>
                )}
              </motion.button>

              {isSmallScreen && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors shadow-sm flex items-center justify-center relative"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  title={isFilterExpanded ? "Hide Filters" : "Show Filters"}
                >
                  <Filter size={20} />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
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
                    ? "bg-white text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors shadow-sm flex items-center justify-center"
                    : "bg-white text-green-600 px-3 py-1 rounded hover:bg-green-50 transition-colors text-sm font-medium shadow-sm flex items-center gap-1"
                }`}
                onClick={() => setIsAddIncomeModalOpen(true)}
                title="Add Income"
              >
                <Plus size={isSmallScreen ? 20 : 14} />
                {!isSmallScreen && <span>Add Income</span>}
              </motion.button>
            </div>
          </div>

          {(dateRange.start || dateRange.end) && (
            <div
              className={`${isSmallScreen ? "mt-1 p-1.5 bg-green-700/20 rounded-md" : "mt-1"} text-xs text-green-100 flex items-center gap-1`}
            >
              <Calendar size={12} />
              <span>{formatDateRangeDisplay()}</span>
              {isSmallScreen && (
                <button
                  className="ml-auto text-green-100 hover:text-white"
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
                  variant="incoming"
                />
              </div>
              <div className="relative z-20">
                <SearchWithSuggestions
                  placeholder="Search by account..."
                  onSearch={setAccountSearchTerm}
                  suggestions={accountNames}
                  variant="incoming"
                />
              </div>
            </motion.div>
          )}

          {isSmallScreen && hasActiveFilters && !isFilterExpanded && (
            <div className="flex justify-between items-center mt-3 text-xs text-green-100 bg-green-700/20 rounded-md px-2 py-1.5">
              <span className="flex items-center gap-1">
                <Filter size={12} />
                {nameSearchTerm || accountSearchTerm ? "Filters applied" : ""}
              </span>
              <button
                className="text-green-100 hover:text-white px-2 py-0.5 bg-green-700/30 rounded"
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
                gradientFrom: "from-green-600",
                gradientTo: "to-green-500",
              }}
            />
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="bg-white flex-1 overflow-y-auto">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="group p-4 hover:bg-green-50 transition-colors cursor-pointer relative"
                  onClick={() => handleTransactionClick(transaction)}
                >
                  {isSmallScreen ? (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="font-medium text-gray-800 flex items-center gap-1">
                            {transaction.name || "Untitled Income"}
                          </h3>
                          <div className="text-sm text-gray-500 mt-0.5">
                            To: {getAccountName(transaction.toAccountId)}
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
                          <span className="text-green-600 font-semibold flex items-center">
                            +{formatAmount(transaction.amount)}{" "}
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
                            {transaction.name || "Untitled Income"}
                          </h3>
                          <div className="text-sm text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <CreditCard size={14} />
                              To: {getAccountName(transaction.toAccountId)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-green-600 font-semibold flex items-center">
                            +{formatAmount(transaction.amount)}{" "}
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
                  <p>No income matching your search criteria found</p>
                  <button
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    onClick={clearAllFilters}
                  >
                    Clear All Filters
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-green-100 p-4 rounded-full">
                    <ArrowUp size={32} className="text-green-600" />
                  </div>
                  <p>No income transactions yet</p>
                  <button
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    onClick={() => setIsAddIncomeModalOpen(true)}
                  >
                    Add Your First Income
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

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

      {/* Add Income Modal */}
      <AddIncomePopup
        isOpen={isAddIncomeModalOpen}
        onClose={() => setIsAddIncomeModalOpen(false)}
        accounts={accounts.filter((acc) => acc.type === "DEFAULT")}
        accountsLoading={accountsLoading}
        onSuccess={() => {
          onTransactionCreated();
          setIsAddIncomeModalOpen(false);
        }}
      />
    </div>
  );
};

export default IncomeTransactionsSection;