import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  ArrowUp,
  Tag,
  ChevronRight,
  RefreshCw,
  X,
  ChevronDown,
  Filter,
  Plus,
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
import { useAuth } from "../../context/AuthContext";
import { deletePayment } from "../../services/paymentService";

interface IncomingRecurringFundsProps {
  isSmallScreen: boolean;
  payments: Payments[];
  accounts: Account[];
  categories: CustomCategory[];
  onPaymentCreated: () => void;
}

const IncomingRecurringFunds: React.FC<IncomingRecurringFundsProps> = ({
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
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null);

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
        categories: payment.categories?.map(cat => cat.customCategory?.name).filter(Boolean) || [],
        account: payment.account?.name || "Unknown Account",
        isDue: payment.nextExecution
          ? new Date(payment.nextExecution) <= new Date()
          : false,
        description: payment.description,
        emailNotification: payment.emailNotification,
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

  const handleFundClick = (fund: any) => {
    setSelectedPayment({
      ...fund,
      type: PaymentType.INCOME,
    });
    setIsDetailsOpen(true);
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
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white text-green-600 rounded-full p-1.5 shadow-md">
                <ArrowUp size={20} />
              </div>
              <h2 className="text-lg font-semibold">Incoming Funds</h2>
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
                className="bg-white text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors shadow-sm flex items-center justify-center"
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
                  className="bg-white text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors shadow-sm flex items-center justify-center"
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
                onClick={() => setIsCreatePopupOpen(true)}
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

          {isSmallScreen && hasActiveFilters && !isFilterExpanded && (
            <div className="flex justify-between items-center mt-3 text-xs text-green-100 bg-green-700/20 rounded-md px-2 py-1.5">
              <span className="flex items-center gap-1">
                <Filter size={12} />
                {nameSearchTerm || categorySearchTerm ? "Filters applied" : ""}
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

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 p-2 text-green-700 text-sm text-center border-b border-green-200"
          >
            {error}
          </motion.div>
        )}

        <div className="bg-white flex-1 overflow-y-auto">
          {filteredFunds.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredFunds.map((fund) => (
                <motion.div
                  key={fund.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`group p-4 hover:bg-green-50 transition-colors cursor-pointer relative ${
                    fund.isDue ? "bg-green-50" : ""
                  }`}
                  onClick={() => handleFundClick(fund)}
                >
                  {isSmallScreen ? (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="font-medium text-gray-800 flex items-center gap-1">
                            {fund.name}
                          </h3>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {fund.account}
                          </div>
                          <div className="flex items-center mt-2 gap-1.5 flex-wrap">
                            {(fund.categories && fund.categories.length > 0 ? fund.categories : [fund.category]).map((category, index) => (
                              <span key={index} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-gray-100 text-gray-700">
                                <Tag size={12} />
                                {category}
                              </span>
                            ))}
                            <span
                              className={`text-sm font-medium px-2 py-1 rounded-lg flex items-center gap-1 ${
                                fund.isDue
                                  ? "bg-green-100 text-green-700"
                                  : formatDate(fund.nextExecution) === "Today"
                                    ? "bg-orange-100 text-orange-700"
                                    : formatDate(fund.nextExecution) ===
                                        "Tomorrow"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              <Calendar size={12} />
                              {formatDate(fund.nextExecution)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-green-600 font-semibold flex items-center">
                            +{formatAmount(fund.amount)} {fund.currency}
                          </span>
                          {fund.currency !== displayCurrency && (
                            <span className="text-xs text-gray-500">
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
                          <span className="text-xs text-gray-500 mt-0.5">
                            {fund.frequency.charAt(0) +
                              fund.frequency.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
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
                            {fund.name}
                          </h3>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {fund.account}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-green-600 font-semibold flex items-center">
                            +{formatAmount(fund.amount)} {fund.currency}
                            {fund.currency !== displayCurrency && (
                              <span className="ml-1 text-xs text-gray-500">
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
                          <span className="text-xs text-gray-500 mt-0.5">
                            {fund.frequency.charAt(0) +
                              fund.frequency.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Tag size={14} />
                            <div className="flex flex-wrap gap-1">
                              {(fund.categories && fund.categories.length > 0 ? fund.categories : [fund.category]).map((category, index) => (
                                <span key={index} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-medium px-3 py-1 rounded-lg flex items-center gap-1 ${
                                fund.isDue
                                  ? "bg-green-100 text-green-700"
                                  : formatDate(fund.nextExecution) === "Today"
                                    ? "bg-orange-100 text-orange-700"
                                    : formatDate(fund.nextExecution) ===
                                        "Tomorrow"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              <Calendar size={14} />
                              Next: {formatDate(fund.nextExecution)}
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

                  {fund.isDue && (
                    <div className="absolute top-3 right-3 rounded-full w-2 h-2 bg-green-500 animate-pulse"></div>
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
                  <p>No recurring income configured yet</p>
                  <button
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    onClick={() => setIsCreatePopupOpen(true)}
                  >
                    Add Your First Income
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {user && (
        <CreatePaymentPopup
          isOpen={isCreatePopupOpen}
          onClose={() => setIsCreatePopupOpen(false)}
          onSuccess={onPaymentCreated}
          userId={user.id}
          accounts={accounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            currency: acc.currency,
            amount: acc.amount,
          }))}
          categories={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
          defaultType={PaymentType.INCOME}
        />
      )}

      <PaymentDetailsPopup
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        payment={selectedPayment}
        onEdit={(id) => {
          console.log("Edit payment:", id);
          setIsDetailsOpen(false);
        }}
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

export default IncomingRecurringFunds;