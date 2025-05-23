import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  ArrowDown,
  Tag,
  ChevronRight,
  AlertCircle,
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
import { executeRecurringPayment } from "../../services/transactionService";
import { motion, AnimatePresence } from "framer-motion";
import SearchWithSuggestions from "./SearchWithSuggestions";
import DateRangeFilter from "./DateRangeFilter";
import CreatePaymentPopup from "./CreatePaymentPopup";
import PaymentDetailsPopup from "./PaymentDetailsPopup";
import type { Payments } from "../../interfaces/Payments";
import { Account } from "../../interfaces/Account";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { useAuth } from "../../context/AuthContext";
import { deletePayment } from "../../services/paymentService";

interface OutgoingRecurringBillsProps {
  isSmallScreen: boolean;
  payments: Payments[];
  accounts: Account[];
  categories: CustomCategory[];
  onPaymentCreated: () => void;
}

const OutgoingRecurringBills: React.FC<OutgoingRecurringBillsProps> = ({
  isSmallScreen,
  payments,
  accounts,
  categories,
  onPaymentCreated,
}) => {
  const { user } = useAuth();
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
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPayNowDialogOpen, setIsPayNowDialogOpen] = useState(false);
  const [paymentToExecute, setPaymentToExecute] = useState<any>(null);
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  const handleEditPayment = (paymentId: number) => {
    const paymentToEdit = filteredBills.find((bill) => bill.id === paymentId);
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

  const recurringBills = useMemo(() => {
    return payments
      .filter((payment) => payment.type === PaymentType.EXPENSE)
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
        automaticAddition: payment.automaticAddition,
        type: PaymentType.EXPENSE,
      }));
  }, [payments]);

  const billCategories = useMemo(() => {
    return Array.from(new Set(recurringBills.map((bill) => bill.category)));
  }, [recurringBills]);

  const billNames = useMemo(() => {
    return recurringBills.map((bill) => bill.name);
  }, [recurringBills]);

  const filteredBills = useMemo(() => {
    const lowerCaseNameSearch = nameSearchTerm.toLowerCase();
    const lowerCaseCategorySearch = categorySearchTerm.toLowerCase();

    return recurringBills.filter((bill) => {
      const nameMatch =
        lowerCaseNameSearch === "" ||
        bill.name.toLowerCase().includes(lowerCaseNameSearch);
      const categoryMatch =
        lowerCaseCategorySearch === "" ||
        bill.category.toLowerCase().includes(lowerCaseCategorySearch);

      let dateMatch = true;
      if (dateRange.start || dateRange.end) {
        const executionDate = new Date(bill.nextExecution);
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
  }, [recurringBills, nameSearchTerm, categorySearchTerm, dateRange]);

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
    setDateRange({ start: null, end: null });
  };

  const handleBillClick = (bill: any, event: React.MouseEvent) => {
    
    if ((event.target as HTMLElement).closest(".pay-now-button")) {
      return;
    }

    setSelectedPayment({
      ...bill,
      type: PaymentType.EXPENSE,
    });
    setIsDetailsOpen(true);
  };

  const handlePayNowClick = (bill: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setPaymentToExecute(bill);
    setIsPayNowDialogOpen(true);
  };

  const handleConfirmPayNow = async () => {
    if (paymentToExecute && user?.id) {
      try {
       
        const account = accounts.find(
          (acc) => acc.name === paymentToExecute.account
        );
        if (!account) {
          console.error("Account not found for payment");
          return;
        }

        const categoryIds =
          paymentToExecute.categories && paymentToExecute.categories.length > 0
            ? categories
                .filter((cat) => paymentToExecute.categories.includes(cat.name))
                .map((cat) => cat.id)
            : null;

        await executeRecurringPayment(
          user.id,
          paymentToExecute.id,
          paymentToExecute.amount,
          paymentToExecute.currency,
          account.id,
          paymentToExecute.name,
          paymentToExecute.description || null,
          categoryIds
        );

        console.log("Payment executed successfully:", paymentToExecute);

      
        onPaymentCreated();
      } catch (error) {
        console.error("Failed to execute payment:", error);
       
      }
    }
    setIsPayNowDialogOpen(false);
    setPaymentToExecute(null);
  };

  const totalMonthly = filteredBills.reduce((sum, bill) => {
    const amountInDisplayCurrency = convertToDisplayCurrency(
      bill.amount,
      bill.currency
    );
    let monthlyFactor = 1;
    switch (bill.frequency) {
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
    nameSearchTerm !== "" ||
    categorySearchTerm !== "" ||
    dateRange.start !== null ||
    dateRange.end !== null;

  return (
    <>
      <div
        className="flex flex-col rounded-lg overflow-hidden shadow-lg relative"
        style={{
          height: isSmallScreen ? "calc(100vh - 180px)" : "calc(100vh - 100px)",
        }}
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white text-red-600 rounded-full p-1.5 shadow-md">
                <ArrowDown size={20} />
              </div>
              <h2 className="text-lg font-semibold">Outgoing Bills</h2>
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
                onClick={() => setIsCreatePopupOpen(true)}
                title="Add Bill"
              >
                <Plus size={isSmallScreen ? 20 : 14} />
                {!isSmallScreen && <span>Add Bill</span>}
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
              <div className="relative z-20">
                <SearchWithSuggestions
                  placeholder="Search by name..."
                  onSearch={setNameSearchTerm}
                  suggestions={billNames}
                  variant="outgoing"
                />
              </div>
              <div className="relative z-20">
                <SearchWithSuggestions
                  placeholder="Search by category..."
                  onSearch={setCategorySearchTerm}
                  suggestions={billCategories}
                  variant="outgoing"
                />
              </div>
            </motion.div>
          )}

          {isSmallScreen && hasActiveFilters && !isFilterExpanded && (
            <div className="flex justify-between items-center mt-3 text-xs text-red-100 bg-red-700/20 rounded-md px-2 py-1.5">
              <span className="flex items-center gap-1">
                <Filter size={12} />
                {nameSearchTerm || categorySearchTerm ? "Filters applied" : ""}
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

        <div className="bg-white flex-1 overflow-y-auto">
          {filteredBills.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredBills.map((bill) => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`group p-4 hover:bg-red-50 transition-colors cursor-pointer relative ${
                    bill.isDue ? "bg-red-50" : ""
                  }`}
                  onClick={(e) => handleBillClick(bill, e)}
                >
                  {isSmallScreen ? (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="font-medium text-gray-800 flex items-center gap-1">
                            {bill.name}
                            {bill.isDue && (
                              <AlertCircle size={14} className="text-red-600" />
                            )}
                          </h3>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {bill.account}
                          </div>
                          <div className="flex items-center mt-2 gap-1.5 flex-wrap">
                            {(bill.categories && bill.categories.length > 0
                              ? bill.categories
                              : [bill.category]
                            ).map((category, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-gray-100 text-gray-700"
                              >
                                <Tag size={12} />
                                {category}
                              </span>
                            ))}
                            <span
                              className={`text-sm font-medium px-2 py-1 rounded-lg flex items-center gap-1 ${
                                bill.isDue
                                  ? "bg-red-100 text-red-700"
                                  : formatDate(bill.nextExecution) === "Today"
                                    ? "bg-orange-100 text-orange-700"
                                    : formatDate(bill.nextExecution) ===
                                        "Tomorrow"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              <Calendar size={12} />
                              {formatDate(bill.nextExecution)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-red-600 font-semibold flex items-center">
                            -{formatAmount(bill.amount)} {bill.currency}
                          </span>
                          {bill.currency !== displayCurrency && (
                            <span className="text-xs text-gray-500">
                              (
                              {formatAmount(
                                convertToDisplayCurrency(
                                  bill.amount,
                                  bill.currency
                                )
                              )}{" "}
                              {displayCurrency})
                            </span>
                          )}
                          <span className="text-xs text-gray-500 mt-0.5">
                            {bill.frequency.charAt(0) +
                              bill.frequency.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="pay-now-button flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                          onClick={(e) => handlePayNowClick(bill, e)}
                        >
                          <DollarSign size={14} />
                          Pay Now
                        </motion.button>
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
                            {bill.name}
                            {bill.isDue && (
                              <AlertCircle size={14} className="text-red-600" />
                            )}
                          </h3>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {bill.account}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-red-600 font-semibold flex items-center">
                            -{formatAmount(bill.amount)} {bill.currency}
                            {bill.currency !== displayCurrency && (
                              <span className="ml-1 text-xs text-gray-500">
                                (
                                {formatAmount(
                                  convertToDisplayCurrency(
                                    bill.amount,
                                    bill.currency
                                  )
                                )}{" "}
                                {displayCurrency})
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5">
                            {bill.frequency.charAt(0) +
                              bill.frequency.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Tag size={14} />
                            <div className="flex flex-wrap gap-1">
                              {(bill.categories && bill.categories.length > 0
                                ? bill.categories
                                : [bill.category]
                              ).map((category, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-medium px-3 py-1 rounded-lg flex items-center gap-1 ${
                                bill.isDue
                                  ? "bg-red-100 text-red-700"
                                  : formatDate(bill.nextExecution) === "Today"
                                    ? "bg-orange-100 text-orange-700"
                                    : formatDate(bill.nextExecution) ===
                                        "Tomorrow"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              <Calendar size={14} />
                              Next: {formatDate(bill.nextExecution)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="pay-now-button opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium"
                            onClick={(e) => handlePayNowClick(bill, e)}
                          >
                            <DollarSign size={12} />
                            Pay Now
                          </motion.button>
                          <div className="flex items-center gap-1">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500">
                              View Details
                            </span>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {bill.isDue && (
                    <div className="absolute top-3 right-3 rounded-full w-2 h-2 bg-red-500 animate-pulse"></div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
              {hasActiveFilters ? (
                <>
                  <p>No bills matching your search criteria found</p>
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
                  <p>No recurring bills configured yet</p>
                  <button
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    onClick={() => setIsCreatePopupOpen(true)}
                  >
                    Add Your First Bill
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pay Now Confirmation Dialog */}
      <AnimatePresence>
        {isPayNowDialogOpen && paymentToExecute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsPayNowDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <DollarSign className="text-red-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Payment
                </h3>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to pay this bill now?
                </p>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">
                      {paymentToExecute.name}
                    </span>
                    <span className="text-red-600 font-semibold">
                      -{formatAmount(paymentToExecute.amount)}{" "}
                      {paymentToExecute.currency}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    From: {paymentToExecute.account}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Category: {paymentToExecute.category}
                  </div>

                  {/* Account Balance Change Section */}
                  <div className="border-t border-red-200 pt-3 mt-3">
                    <div className="text-sm text-gray-700 mb-2 font-medium">
                      Account Balance Change:
                    </div>
                    {(() => {
                      const account = accounts.find(
                        (acc) => acc.name === paymentToExecute.account
                      );
                      const accountBalance = account?.amount || 0;
                      const accountCurrency =
                        account?.currency || paymentToExecute.currency;

                     
                      const paymentInAccountCurrency =
                        paymentToExecute.currency === accountCurrency
                          ? paymentToExecute.amount
                          : convertCurrency(
                              paymentToExecute.amount,
                              paymentToExecute.currency,
                              accountCurrency
                            );

                      const newBalance =
                        accountBalance - paymentInAccountCurrency;

                      return (
                        <>
                          <div className="flex justify-between items-center bg-white p-2 rounded">
                            <span className="text-sm text-gray-600">
                              Current Balance:
                            </span>
                            <span className="text-sm font-medium">
                              {formatAmount(accountBalance)} {accountCurrency}
                            </span>
                          </div>
                          {paymentToExecute.currency !== accountCurrency && (
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded mt-1 text-xs">
                              <span className="text-gray-500">
                                Payment ({formatAmount(paymentToExecute.amount)}{" "}
                                {paymentToExecute.currency}):
                              </span>
                              <span className="text-gray-700">
                                -{formatAmount(paymentInAccountCurrency)}{" "}
                                {accountCurrency}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center bg-white p-2 rounded mt-1">
                            <span className="text-sm text-gray-600">
                              After Payment:
                            </span>
                            <span
                              className={`text-sm font-semibold ${newBalance < 0 ? "text-red-700" : "text-red-600"}`}
                            >
                              {formatAmount(newBalance)} {accountCurrency}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  onClick={() => setIsPayNowDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                  onClick={handleConfirmPayNow}
                >
                  Pay Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {user && (
        <CreatePaymentPopup
          isOpen={isCreatePopupOpen}
          onClose={handleCloseCreatePopup}
          onSuccess={onPaymentCreated}
          userId={user.id}
          accounts={accounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            currency: acc.currency,
            amount: acc.amount,
          }))}
          categories={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
          defaultType={PaymentType.EXPENSE}
          editPayment={editingPayment}
        />
      )}

      <PaymentDetailsPopup
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        payment={selectedPayment}
        onEdit={handleEditPayment}
        onDelete={async (id) => {
          try {
            if (user?.id) {
              await deletePayment(user.id, id);
              onPaymentCreated();
            }
            setIsDetailsOpen(false);
          } catch (error) {
            console.error("Failed to delete payment:", error);
          }
        }}
      />
    </>
  );
};

export default OutgoingRecurringBills;
