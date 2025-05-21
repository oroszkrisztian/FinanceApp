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
  Search,
  Filter,
  Plus,
} from "lucide-react";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import { CurrencyType } from "../../interfaces/enums";
import { motion, AnimatePresence } from "framer-motion";
import SearchWithSuggestions from "./SearchWithSuggestions";
import DateRangeFilter from "./DateRangeFilter";

interface OutgoingRecurringBillsProps {
  isSmallScreen: boolean;
}

const OutgoingRecurringBills: React.FC<OutgoingRecurringBillsProps> = ({
  isSmallScreen,
}) => {
  const [rates, setRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(false);
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
  }>({
    start: null,
    end: null,
  });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null);

  // State for controlling visibility of search filters on mobile
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

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

  const recurringBills = [
    {
      id: 1,
      name: "Rent",
      amount: 1200,
      frequency: "MONTHLY",
      nextExecution: "2025-06-01",
      currency: "RON",
      category: "Housing",
      account: "Main Account",
      isDue: false,
    },
    {
      id: 2,
      name: "Electricity",
      amount: 150,
      frequency: "MONTHLY",
      nextExecution: "2025-05-25",
      currency: "RON",
      category: "Utilities",
      account: "Main Account",
      isDue: true,
    },
    {
      id: 3,
      name: "Internet",
      amount: 80,
      frequency: "MONTHLY",
      nextExecution: "2025-05-28",
      currency: "RON",
      category: "Utilities",
      account: "Main Account",
      isDue: false,
    },
    {
      id: 4,
      name: "Gym Membership",
      amount: 35,
      frequency: "MONTHLY",
      nextExecution: "2025-06-05",
      currency: "EUR",
      category: "Health & Fitness",
      account: "Secondary Account",
      isDue: false,
    },
    {
      id: 5,
      name: "Phone Plan",
      amount: 45,
      frequency: "MONTHLY",
      nextExecution: "2025-05-30",
      currency: "RON",
      category: "Utilities",
      account: "Main Account",
      isDue: false,
    },
    {
      id: 6,
      name: "Netflix Subscription",
      amount: 12,
      frequency: "MONTHLY",
      nextExecution: "2025-06-10",
      currency: "EUR",
      category: "Entertainment",
      account: "Secondary Account",
      isDue: false,
    },
    {
      id: 7,
      name: "Car Insurance",
      amount: 120,
      frequency: "QUARTERLY",
      nextExecution: "2025-07-15",
      currency: "RON",
      category: "Insurance",
      account: "Main Account",
      isDue: false,
    },
    {
      id: 8,
      name: "Grocery Delivery",
      amount: 200,
      frequency: "WEEKLY",
      nextExecution: "2025-05-26",
      currency: "RON",
      category: "Food",
      account: "Main Account",
      isDue: false,
    },
  ];

  const categories = useMemo(() => {
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  const formatAmount = (amount: number): string => {
    return amount.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
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

  const handleNameSearch = (term: string) => {
    setNameSearchTerm(term);
  };

  const handleCategorySearch = (term: string) => {
    setCategorySearchTerm(term);
  };

  // Toggle currency dropdown open/close
  const toggleCurrencyDropdown = () => {
    setIsCurrencyMenuOpen((prev) => !prev);
  };

  // Toggle filter expansion for mobile
  const toggleFilterExpansion = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const clearAllFilters = () => {
    setNameSearchTerm("");
    setCategorySearchTerm("");
    setDateRange({ start: null, end: null });
    //setIsDateFilterOpen(false);
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
      case "ANNUALLY":
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
    <div
      className="flex flex-col rounded-lg overflow-hidden shadow-lg relative"
      style={{
        height: isSmallScreen ? "calc(100vh - 180px)" : "calc(100vh - 100px)",
      }}
    >
      {/* Improved Header Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-4">
        {/* Title and Total Row */}
        <div className="flex justify-between items-center mb-3">
          {/* Title with Icon */}
          <div className="flex items-center gap-2">
            <div className="bg-white text-red-600 rounded-full p-1.5 shadow-md">
              <ArrowDown size={20} />
            </div>
            <h2 className="text-lg font-semibold">Outgoing Bills</h2>
          </div>

          {/* Total Amount */}
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

        {/* Action Buttons Row */}
        <div className="flex justify-between items-center mb-3">
          {/* Currency Selector */}
          <div className="relative currency-dropdown">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-700 hover:bg-red-800 text-white p-2 px-3 rounded-full transition-colors flex items-center"
              onClick={toggleCurrencyDropdown}
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
                      onClick={() => handleCurrencyChange(curr as CurrencyType)}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Control Buttons in a Row */}
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
                onClick={toggleFilterExpansion}
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

            {/* Add Bill Button with Plus Icon */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                  ${
                    isSmallScreen
                      ? "bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center"
                      : "bg-white text-red-600 px-3 py-1 rounded hover:bg-red-50 transition-colors text-sm font-medium shadow-sm flex items-center gap-1"
                  }
                `}
              title="Add Bill"
            >
              <Plus size={isSmallScreen ? 20 : 14} />
              {!isSmallScreen && <span>Add Bill</span>}
            </motion.button>
          </div>
        </div>

        {/* Applied Date Filters Display */}
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

        {/* Search Filters - Collapsible on mobile */}
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
                onSearch={handleNameSearch}
                suggestions={billNames}
                variant="outgoing"
              />
            </div>
            <div className="relative z-20">
              <SearchWithSuggestions
                placeholder="Search by category..."
                onSearch={handleCategorySearch}
                suggestions={categories}
                variant="outgoing"
              />
            </div>
          </motion.div>
        )}

        {/* Active Filters Indicator for Mobile */}
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

      {/* Date Range Filter Popup */}
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

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 p-2 text-red-700 text-sm text-center border-b border-red-200"
        >
          {error}
        </motion.div>
      )}

      {/* Bills List */}
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
              >
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
                            convertToDisplayCurrency(bill.amount, bill.currency)
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

                <div
                  className={`flex items-center justify-between mt-2 text-xs text-gray-500 ${isSmallScreen ? "flex-wrap gap-y-2" : ""}`}
                >
                  <div
                    className={`flex items-center ${isSmallScreen ? "flex-wrap gap-y-2 w-full" : "gap-4"}`}
                  >
                    <div className="flex items-center gap-1">
                      <Tag size={14} />
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          bill.category === "Utilities"
                            ? "bg-blue-100 text-blue-700"
                            : bill.category === "Housing"
                              ? "bg-purple-100 text-purple-700"
                              : bill.category === "Health & Fitness"
                                ? "bg-green-100 text-green-700"
                                : bill.category === "Entertainment"
                                  ? "bg-pink-100 text-pink-700"
                                  : bill.category === "Insurance"
                                    ? "bg-orange-100 text-orange-700"
                                    : bill.category === "Food"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {bill.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      Next: {formatDate(bill.nextExecution)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`${isSmallScreen ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity text-xs text-gray-500`}
                    >
                      View
                    </span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>

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
                <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                  Add Your First Bill
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutgoingRecurringBills;
