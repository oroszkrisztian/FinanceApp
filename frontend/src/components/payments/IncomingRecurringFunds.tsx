import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  Tag,
  RefreshCw,
  X,
  ChevronDown,
  Filter,
  Plus,
  DollarSign,
} from "lucide-react";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import { CurrencyType, PaymentType } from "../../interfaces/enums";
import { motion, AnimatePresence } from "framer-motion";
import SearchWithSuggestions from "./SearchWithSuggestions";
import DateRangeFilter from "./DateRangeFilter";
import CreatePaymentPopup from "./CreatePaymentPopup";
import PaymentDetailsPopup from "./PaymentDetailsPopup";
import type { Payments } from "../../interfaces/Payments";
import { Account } from "../../interfaces/Account";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { deletePayment } from "../../services/paymentService";
import { executeRecurringIncome } from "../../services/transactionService";

interface IncomingRecurringFundsProps {
  isSmallScreen: boolean;
  payments: Payments[];
  accounts: Account[];
  categories: CustomCategory[];
  onPaymentCreated: () => void;
  onCategoryCreated: () => void;
}

const IncomingRecurringFunds: React.FC<IncomingRecurringFundsProps> = ({
  payments,
  accounts,
  categories,
  onPaymentCreated,
  onCategoryCreated,
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
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

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
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isGetIncomeDialogOpen, setIsGetIncomeDialogOpen] = useState(false);
  const [incomeToExecute, setIncomeToExecute] = useState<any>(null);
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const [currentPopupStep, setCurrentPopupStep] = useState(1);
  const [isExecutingIncome, setIsExecutingIncome] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const handleEditPayment = (paymentId: number) => {
    const paymentToEdit = filteredFunds.find((fund) => fund.id === paymentId);
    if (paymentToEdit) {
      setEditingPayment(paymentToEdit);
      setIsCreatePopupOpen(true);
      setIsDetailsOpen(false);
    }
  };

  const handleCloseCreatePopup = () => {
    setIsCreatePopupOpen(false);
    setEditingPayment(null);
  };

  const handlePaymentSuccess = () => {
    setCurrentPopupStep(1);
    onPaymentCreated();
  };

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

  const recurringFunds = useMemo(() => {
    return payments
      .filter((payment) => payment.type === PaymentType.INCOME)
      .map((payment) => ({
        id: payment.id,
        name: payment.name,
        amount: payment.amount,
        frequency: payment.frequency,
        nextExecution: payment.nextExecution
          ? new Date(payment.nextExecution).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        currency: payment.currency,
        category:
          payment.categories?.[0]?.customCategory?.name || "Uncategorized",
        categories:
          payment.categories
            ?.map((cat) => cat.customCategory?.name)
            .filter(Boolean) || [],
        account: payment.account?.name || "Unknown Account",
        isDue: payment.nextExecution
          ? new Date(payment.nextExecution) <= new Date()
          : false,
        description: payment.description,
        emailNotification: payment.emailNotification,
        notificationDay: payment.notificationDay,
        automaticAddition: payment.automaticAddition,
        type: PaymentType.INCOME,
      }));
  }, [payments]);

  const fundCategories = useMemo(() => {
    return Array.from(new Set(recurringFunds.map((fund) => fund.category)));
  }, [recurringFunds]);

  const fundNames = useMemo(() => {
    return recurringFunds.map((fund) => fund.name);
  }, [recurringFunds]);

  const filteredFunds = useMemo(() => {
    const lowerCaseNameSearch = nameSearchTerm.toLowerCase();
    const lowerCaseCategorySearch = categorySearchTerm.toLowerCase();

    return recurringFunds.filter((fund) => {
      const nameMatch =
        lowerCaseNameSearch === "" ||
        fund.name.toLowerCase().includes(lowerCaseNameSearch);
      const categoryMatch =
        lowerCaseCategorySearch === "" ||
        fund.category.toLowerCase().includes(lowerCaseCategorySearch);

      let dateMatch = true;
      if (dateRange.start || dateRange.end) {
        const executionDate = new Date(fund.nextExecution);
        if (dateRange.start && dateRange.end) {
          dateMatch =
            executionDate >= dateRange.start && executionDate <= dateRange.end;
        } else if (dateRange.start) {
          dateMatch = executionDate >= dateRange.start;
        } else if (dateRange.end) {
          dateMatch = executionDate <= dateRange.end;
        }
      }
      return nameMatch && categoryMatch && dateMatch;
    });
  }, [recurringFunds, nameSearchTerm, categorySearchTerm, dateRange]);

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

  const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    if (fromCurrency === toCurrency || Object.keys(rates).length === 0) {
      return amount;
    }
    try {
      const validation = validateCurrencyConversion(
        fromCurrency as CurrencyType,
        toCurrency as CurrencyType,
        rates
      );
      if (!validation.valid) {
        console.error(validation.error);
        return amount;
      }
      return convertAmount(amount, fromCurrency, toCurrency, rates);
    } catch (err) {
      console.error("Conversion error:", err);
      return amount;
    }
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

  const formatAmount = (amount: number): string => amount.toFixed(2);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else if (date < today) {
      return "Overdue";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    }).format(date);
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

  const handleCurrencyChange = (currency: string) => {
    setDisplayCurrency(currency);
    setIsCurrencyMenuOpen(false);
  };

  const clearAllFilters = () => {
    setNameSearchTerm("");
    setCategorySearchTerm("");
    setDateRange(getCurrentMonthRange());
  };

  const handleFundClick = (fund: any, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest(".get-income-button")) {
      return;
    }

    setSelectedPayment({
      ...fund,
      type: PaymentType.INCOME,
    });
    setIsDetailsOpen(true);
  };

  const handleGetIncomeClick = (fund: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setIncomeToExecute(fund);
    setIsGetIncomeDialogOpen(true);
  };

  const handleConfirmGetIncome = async () => {
    if (incomeToExecute) {
      try {
        setIsExecutingIncome(true);
        const account = accounts.find(
          (acc) => acc.name === incomeToExecute.account
        );
        if (!account) {
          console.error("Account not found for income");
          return;
        }

        const categoryIds =
          incomeToExecute.categories && incomeToExecute.categories.length > 0
            ? categories
                .filter((cat) => incomeToExecute.categories.includes(cat.name))
                .map((cat) => cat.id)
            : null;

        await executeRecurringIncome(
          incomeToExecute.id,
          incomeToExecute.amount,
          incomeToExecute.currency,
          account.id,
          incomeToExecute.name,
          incomeToExecute.description || null,
          categoryIds
        );

        console.log("Income executed successfully:", incomeToExecute);
        onPaymentCreated();
      } catch (error) {
        console.error("Failed to execute income:", error);
      } finally {
        setIsExecutingIncome(false);
      }
    }
    setIsGetIncomeDialogOpen(false);
    setIncomeToExecute(null);
  };

  const totalMonthly = filteredFunds.reduce((sum, fund) => {
    const amountInDisplayCurrency = convertToDisplayCurrency(
      fund.amount,
      fund.currency
    );
    let monthlyFactor = 1;
    switch (fund.frequency) {
      case "WEEKLY":
        monthlyFactor = 4.33;
        break;
      case "BIWEEKLY":
        monthlyFactor = 2.17;
        break;
      case "MONTHLY":
        monthlyFactor = 1;
        break;
      case "QUARTERLY":
        monthlyFactor = 1 / 3;
        break;
      case "YEARLY":
        monthlyFactor = 1 / 12;
        break;
      default:
        monthlyFactor = 1;
    }
    return sum + amountInDisplayCurrency * monthlyFactor;
  }, 0);

  const hasActiveFilters =
    nameSearchTerm !== "" || categorySearchTerm !== "" || !isCurrentMonth();

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
        {/* Background elements */}
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-green-300 to-emerald-500 rounded-full opacity-20 ${
            isMobileView
              ? "w-12 h-12 -translate-y-6 translate-x-6"
              : "w-28 h-28 -translate-y-14 translate-x-14"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 bg-gradient-to-tr from-emerald-300 to-teal-500 rounded-full opacity-15 ${
            isMobileView
              ? "w-8 h-8 translate-y-4 -translate-x-4"
              : "w-20 h-20 translate-y-10 -translate-x-10"
          }`}
        ></div>
        <div
          className={`absolute bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-10 ${
            isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
          }`}
        ></div>
        <div
          className={`absolute bg-gradient-to-br from-teal-300 to-green-400 rounded-full opacity-10 ${
            isMobileView
              ? "bottom-3 right-12 w-6 h-6"
              : "bottom-12 right-20 w-12 h-12"
          }`}
        ></div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className={`flex-shrink-0 ${isMobileView ? "mb-2" : "mb-4"}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <motion.div
                  className={`bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md ${
                    isMobileView ? "w-7 h-7" : "w-10 h-10"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={`${isMobileView ? "text-xs" : "text-lg"}`}>
                    💰
                  </span>
                </motion.div>
                <div>
                  <h2
                    className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                      isMobileView ? "text-base" : "text-lg"
                    }`}
                  >
                    Incoming Funds
                  </h2>
                  <p
                    className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                  >
                    {filteredFunds.length} payment
                    {filteredFunds.length !== 1 ? "s" : ""} this period
                  </p>
                </div>
              </div>
              <div
                className={`${isMobileView ? "py-1.5 px-3 bg-green-100/80 backdrop-blur-sm rounded-lg shadow-inner border border-green-200/50" : "bg-green-50/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-green-200/50"}`}
              >
                {fetchingRates ? (
                  <span className="flex items-center text-green-700">
                    <RefreshCw size={14} className="animate-spin mr-1" />
                    Loading...
                  </span>
                ) : (
                  <span
                    className={`font-semibold text-green-700 ${isMobileView ? "text-base" : "text-lg"}`}
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
                  className={`bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-md flex items-center transition-all ${
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
                    className="absolute top-full left-0 mt-2 w-36 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-green-200/50 z-50 overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {availableCurrencies.map((curr) => (
                        <motion.button
                          key={curr}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            curr === displayCurrency
                              ? "bg-green-100 text-green-700 font-medium"
                              : "text-gray-700 hover:bg-green-50"
                          }`}
                          onClick={() =>
                            handleCurrencyChange(curr as CurrencyType)
                          }
                          whileHover={{
                            backgroundColor:
                              curr === displayCurrency
                                ? undefined
                                : "rgba(16, 185, 129, 0.05)",
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
                  className="bg-white/80 backdrop-blur-sm text-green-600 p-2 rounded-full hover:bg-green-50 transition-all shadow-md border border-green-200/50 flex items-center justify-center relative"
                  onClick={() => setIsDateFilterOpen(true)}
                  title="Date Filter"
                >
                  <Calendar size={20} />
                  {!isCurrentMonth() && (
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      !
                    </span>
                  )}
                </motion.button>

                {isMobileView && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/80 backdrop-blur-sm text-green-600 p-2 rounded-full hover:bg-green-50 transition-all shadow-md border border-green-200/50 flex items-center justify-center relative"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    title={isFilterExpanded ? "Hide Filters" : "Show Filters"}
                  >
                    <Filter size={20} />
                    {hasActiveFilters && !isFilterExpanded && (
                      <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                        !
                      </span>
                    )}
                  </motion.button>
                )}

                <button
                  className={`${
                    isMobileView
                      ? "bg-white/80 backdrop-blur-sm text-green-600 p-2 rounded-full hover:bg-green-50 transition-all shadow-md border border-green-200/50 flex items-center justify-center"
                      : "bg-white/80 backdrop-blur-sm text-green-600 px-3 py-1 rounded hover:bg-green-50 transition-all text-sm font-medium shadow-md border border-green-200/50 flex items-center gap-1"
                  }`}
                  onClick={() => setIsCreatePopupOpen(true)}
                  title="Add Income"
                >
                  <Plus size={isMobileView ? 20 : 14} />
                  {!isMobileView && <span>Add Income</span>}
                </button>
              </div>
            </div>

            {(dateRange.start || dateRange.end) && (
              <div
                className={`${isMobileView ? "mt-1 p-1 bg-green-100/60 backdrop-blur-sm rounded-md border border-green-200/50" : "mt-1 bg-green-50/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-green-200/50"} text-xs text-green-700 flex items-center gap-1`}
              >
                <Calendar size={12} />
                <span className="font-medium">{formatDateRangeDisplay()}</span>
                {isMobileView && !isCurrentMonth() && (
                  <motion.button
                    className="ml-auto text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-200/50 transition-colors"
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
                    suggestions={fundNames}
                    variant="incoming"
                  />
                </div>
                <div className="relative z-20">
                  <SearchWithSuggestions
                    placeholder="Search by category..."
                    onSearch={setCategorySearchTerm}
                    suggestions={fundCategories}
                    variant="incoming"
                  />
                </div>
              </motion.div>
            )}

            {isMobileView && hasActiveFilters && !isFilterExpanded && (
              <motion.div
                className="flex justify-between items-center mt-2 text-xs text-green-700 bg-green-100/60 backdrop-blur-sm rounded-md px-2 py-1 border border-green-200/50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="flex items-center gap-1 font-medium">
                  <Filter size={12} />
                  {nameSearchTerm || categorySearchTerm
                    ? "Filters applied"
                    : "Custom date range"}
                </span>
                <motion.button
                  className="text-green-600 hover:text-green-800 px-2 py-0.5 bg-green-200/50 rounded font-medium transition-colors"
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
                  gradientFrom: "from-green-600",
                  gradientTo: "to-green-500",
                }}
              />
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50/80 backdrop-blur-sm p-2 text-green-700 text-sm text-center border border-green-200 rounded-lg mb-2"
            >
              {error}
            </motion.div>
          )}

          <div className="bg-transparent flex-1 overflow-y-auto">
            {filteredFunds.length > 0 ? (
              <div className={isMobileView ? "space-y-1.5" : "space-y-1"}>
                {filteredFunds.map((fund, index) => (
                  <motion.div
                    key={fund.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group rounded-xl border-l-4 shadow-sm active:shadow-md transition-all w-full cursor-pointer backdrop-blur-sm relative ${
                      fund.isDue
                        ? "bg-green-100/60 border-l-green-500 hover:bg-green-100/80"
                        : "bg-white/60 border-l-green-400 hover:bg-green-50/60"
                    } border border-green-200/30 ${isMobileView ? "p-2.5" : "p-3"}`}
                    onClick={(e) => handleFundClick(fund, e)}
                  >
                    {/* Unified design for both mobile and desktop */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`font-semibold text-gray-800 truncate ${isMobileView ? "text-sm" : "text-base"}`}
                          >
                            {fund.name}
                          </h3>
                          <span
                            className={`text-green-600 font-bold whitespace-nowrap ml-2 ${isMobileView ? "text-sm" : "text-lg"}`}
                          >
                            +{formatAmount(fund.amount)} {fund.currency}
                            {!isMobileView &&
                              fund.currency !== displayCurrency && (
                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                  (
                                  {formatAmount(
                                    convertToDisplayCurrency(
                                      fund.amount,
                                      fund.currency
                                    )
                                  )}{" "}
                                  {displayCurrency})
                                </span>
                              )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span className="truncate">{fund.account}</span>
                          <span className="whitespace-nowrap ml-2">
                            {fund.frequency.charAt(0) +
                              fund.frequency.slice(1).toLowerCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap ${
                                fund.isDue
                                  ? "bg-green-200/80 text-green-800"
                                  : formatDate(fund.nextExecution) === "Today"
                                    ? "bg-orange-100/80 text-orange-700"
                                    : formatDate(fund.nextExecution) ===
                                        "Tomorrow"
                                      ? "bg-yellow-100/80 text-yellow-700"
                                      : "bg-blue-100/80 text-blue-700"
                              }`}
                            >
                              <Calendar size={10} />
                              {formatDate(fund.nextExecution)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-green-100/80 text-green-700 truncate flex items-center gap-1">
                              <Tag size={10} />
                              {fund.categories && fund.categories.length > 0
                                ? fund.categories.join(", ")
                                : fund.category}
                            </span>
                          </div>

                          <button
                            className={`get-income-button flex items-center gap-1 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-md hover:from-green-700 hover:to-emerald-800 transition-all font-medium shadow-md whitespace-nowrap ${
                              isMobileView
                                ? "px-2 py-1 text-xs"
                                : "px-3 py-1.5 text-sm"
                            }`}
                            onClick={(e) => handleGetIncomeClick(fund, e)}
                          >
                            <DollarSign size={isMobileView ? 10 : 12} />
                            {isMobileView ? "Get Now" : "Get Income"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {fund.isDue && (
                      <div
                        className={`absolute rounded-full bg-green-500 animate-pulse ${
                          isMobileView
                            ? "top-2 right-2 w-2 h-2"
                            : "top-2.5 right-2.5 w-2 h-2"
                        }`}
                      ></div>
                    )}
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
                      className="bg-green-100/80 backdrop-blur-sm p-4 rounded-full border border-green-200/50 text-4xl"
                    >
                      💰
                    </motion.div>
                    <p>No income matching your search criteria found</p>
                    <motion.button
                      className="mt-2 px-4  py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-md hover:from-green-700 hover:to-emerald-800 transition-all shadow-md"
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
                      className="bg-green-100/80 backdrop-blur-sm p-4 rounded-full border border-green-200/50 text-4xl"
                    >
                      💰
                    </motion.div>
                    <p>No recurring income configured yet</p>
                    <motion.button
                      className="mt-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-md hover:from-green-700 hover:to-emerald-800 transition-all shadow-md"
                      onClick={() => setIsCreatePopupOpen(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Add Your First Income
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/*Get Income Now Confirmation Dialog */}
      <AnimatePresence>
        {isGetIncomeDialogOpen && incomeToExecute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col overflow-hidden pointer-events-auto border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-3 bg-gradient-to-r from-green-600 to-green-800 text-white relative flex-shrink-0 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="bg-white rounded-full p-1.5 shadow-lg text-green-600">
                      <span className="text-lg">💰</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Confirm Income</h2>
                      <p className="text-white/80 text-xs">
                        {incomeToExecute.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsGetIncomeDialogOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/*Content */}
              <div className="p-3 space-y-4">
                {/* Income Amount */}
                <div className="text-center py-2">
                  <div className="text-xl font-bold text-green-600 mb-1">
                    +{formatAmount(incomeToExecute.amount)}{" "}
                    {incomeToExecute.currency}
                  </div>
                  {incomeToExecute.currency !== displayCurrency && (
                    <div className="text-xs text-gray-500">
                      ≈{" "}
                      {formatAmount(
                        convertToDisplayCurrency(
                          incomeToExecute.amount,
                          incomeToExecute.currency
                        )
                      )}{" "}
                      {displayCurrency}
                    </div>
                  )}
                </div>

                {/* Account & Categories */}
                <div className="bg-gray-50 rounded-lg p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Account:</span>
                    <span className="text-sm font-medium">
                      {incomeToExecute.account}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Categories:</span>
                    <div className="text-right">
                      {incomeToExecute.categories &&
                      incomeToExecute.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {incomeToExecute.categories.map(
                            (category: string, index: number) => (
                              <span
                                key={index}
                                className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                              >
                                {category}
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">
                          {incomeToExecute.category || "Uncategorized"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {(() => {
                  const account = accounts.find(
                    (acc) => acc.name === incomeToExecute.account
                  );
                  const accountBalance = account?.amount || 0;
                  const accountCurrency =
                    account?.currency || incomeToExecute.currency;
                  const incomeInAccountCurrency =
                    incomeToExecute.currency === accountCurrency
                      ? incomeToExecute.amount
                      : convertCurrency(
                          incomeToExecute.amount,
                          incomeToExecute.currency,
                          accountCurrency
                        );
                  const newBalance = accountBalance + incomeInAccountCurrency;

                  return (
                    <div className="bg-green-50 rounded-lg border border-green-100 p-3">
                      <h4 className="text-xs font-medium text-gray-700 mb-2 text-center">
                        Balance Impact
                      </h4>

                      <div className="bg-white rounded-lg border border-green-100 p-3">
                        <div className="flex items-center justify-between text-sm">
                          {/* Account Current Balance */}
                          <div className="text-left">
                            <div className="text-gray-600 text-xs">
                              {incomeToExecute.account}
                            </div>
                            <div className="font-bold text-gray-800">
                              {formatAmount(accountBalance)} {accountCurrency}
                            </div>
                          </div>

                          {/* Income Amount */}
                          <div className="text-center px-4">
                            <div className="h-px bg-green-300 w-full mb-1"></div>
                            <div className="text-green-700 font-medium text-xs">
                              +{formatAmount(incomeToExecute.amount)}{" "}
                              {incomeToExecute.currency}
                              {incomeToExecute.currency !== accountCurrency && (
                                <div className="text-gray-500 mt-0.5">
                                  (+{formatAmount(incomeInAccountCurrency)}{" "}
                                  {accountCurrency})
                                </div>
                              )}
                            </div>
                            <div className="h-px bg-green-300 w-full mt-1"></div>
                          </div>

                          {/* New Balance */}
                          <div className="text-right">
                            <div className="text-gray-600 text-xs">
                              New Balance
                            </div>
                            <div className="font-bold text-green-700">
                              {formatAmount(newBalance)} {accountCurrency}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Simplified Footer */}
              <div className="p-3 bg-gray-50/50 border-t flex gap-2 flex-shrink-0 rounded-b-2xl">
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all shadow-md text-sm"
                  onClick={() => setIsGetIncomeDialogOpen(false)}
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleConfirmGetIncome}
                  disabled={isExecutingIncome}
                >
                  {isExecutingIncome ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <DollarSign size={14} />
                  )}
                  Get Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreatePaymentPopup
        isOpen={isCreatePopupOpen}
        onClose={handleCloseCreatePopup}
        onSuccess={handlePaymentSuccess}
        onCategoryCreated={onCategoryCreated}
        accounts={accounts.map((acc) => ({
          id: acc.id,
          name: acc.name,
          currency: acc.currency,
          amount: acc.amount,
        }))}
        categories={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
        defaultType={PaymentType.INCOME}
        editPayment={editingPayment}
        currentStep={currentPopupStep}
        onStepChange={setCurrentPopupStep}
      />

      <PaymentDetailsPopup
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        payment={selectedPayment}
        onEdit={handleEditPayment}
        onDelete={async (id) => {
          try {
            await deletePayment(id);
            onPaymentCreated();

            setIsDetailsOpen(false);
          } catch (error) {
            console.error("Failed to delete payment:", error);
          }
        }}
      />
    </>
  );
};

export default IncomingRecurringFunds;
