import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  ArrowUp,
  Tag,
  ChevronRight,
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

interface IncomingRecurringFundsProps {
  isSmallScreen: boolean;
}

const IncomingRecurringFunds: React.FC<IncomingRecurringFundsProps> = ({
  isSmallScreen,
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
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [externalPopupOpen, setExternalPopupOpen] = useState(false);
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

  // Placeholder data for demonstration
  const incomingFunds = [
    {
      id: 1,
      name: "Salary",
      amount: 3500,
      frequency: "MONTHLY",
      nextExecution: "2025-06-01",
      currency: "RON",
      account: "Main Account",
      category: "Employment",
      isSoon: false,
    },
    {
      id: 2,
      name: "Freelance Payment",
      amount: 1200,
      frequency: "BIWEEKLY",
      nextExecution: "2025-05-28",
      currency: "EUR",
      account: "Business Account",
      category: "Side Business",
      isSoon: true,
    },
    {
      id: 3,
      name: "Rental Income",
      amount: 850,
      frequency: "MONTHLY",
      nextExecution: "2025-06-05",
      currency: "RON",
      account: "Savings Account",
      category: "Property",
      isSoon: false,
    },
    {
      id: 4,
      name: "Dividend Payment",
      amount: 120,
      frequency: "QUARTERLY",
      nextExecution: "2025-07-15",
      currency: "USD",
      account: "Investment Account",
      category: "Investments",
      isSoon: false,
    },
    {
      id: 5,
      name: "Online Course Sales",
      amount: 350,
      frequency: "MONTHLY",
      nextExecution: "2025-06-10",
      currency: "EUR",
      account: "Business Account",
      category: "Side Business",
      isSoon: false,
    },
    {
      id: 6,
      name: "Bonus",
      amount: 1500,
      frequency: "ANNUALLY",
      nextExecution: "2025-12-20",
      currency: "RON",
      account: "Main Account",
      category: "Employment",
      isSoon: false,
    },
    {
      id: 7,
      name: "Consultation Fee",
      amount: 200,
      frequency: "WEEKLY",
      nextExecution: "2025-05-27",
      currency: "EUR",
      account: "Business Account",
      category: "Side Business",
      isSoon: true,
    },
    {
      id: 8,
      name: "Investment Return",
      amount: 950,
      frequency: "QUARTERLY",
      nextExecution: "2025-08-15",
      currency: "USD",
      account: "Investment Account",
      category: "Investments",
      isSoon: false,
    },
  ];

  // Extract unique categories for search suggestions
  const categories = useMemo(() => {
    return Array.from(new Set(incomingFunds.map((fund) => fund.category)));
  }, [incomingFunds]);

  // Extract fund names for search suggestions
  const fundNames = useMemo(() => {
    return incomingFunds.map((fund) => fund.name);
  }, [incomingFunds]);

  // Filter funds based on name, category, and date range
  const filteredFunds = useMemo(() => {
    const lowerCaseNameSearch = nameSearchTerm.toLowerCase();
    const lowerCaseCategorySearch = categorySearchTerm.toLowerCase();

    return incomingFunds.filter((fund) => {
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
  }, [incomingFunds, nameSearchTerm, categorySearchTerm, dateRange]);

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

  // Function to convert amount to display currency
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

  // Format number with 2 decimal places
  const formatAmount = (amount: number): string => {
    return amount.toFixed(2);
  };

  // Function to format date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Handle currency change
  const handleCurrencyChange = (currency: string) => {
    setDisplayCurrency(currency);
    setIsCurrencyMenuOpen(false);
    setExternalPopupOpen(false);
  };

  // Handle name search
  const handleNameSearch = (term: string) => {
    setNameSearchTerm(term);
  };

  // Handle category search
  const handleCategorySearch = (term: string) => {
    setCategorySearchTerm(term);
  };

  // Handle currency dropdown open/close
  const toggleCurrencyDropdown = () => {
    setIsCurrencyMenuOpen((prev) => !prev);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setNameSearchTerm("");
    setCategorySearchTerm("");
    setDateRange({ start: null, end: null });
    //setIsDateFilterOpen(false);
  };

  // Toggle filter expansion for mobile
  const toggleFilterExpansion = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  // Calculate total monthly income (only for filtered funds)
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
      case "ANNUALLY":
        monthlyFactor = 1 / 12;
        break;
      default:
        monthlyFactor = 1;
    }

    return sum + amountInDisplayCurrency * monthlyFactor;
  }, 0);

  // Format date range for display
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

  const hasActiveFilters =
    nameSearchTerm !== "" ||
    categorySearchTerm !== "" ||
    dateRange.start !== null ||
    dateRange.end !== null;

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden shadow-lg"
      style={{
        height: isSmallScreen ? "calc(100vh - 180px)" : "calc(100vh - 100px)",
      }}
    >
      {/* Improved Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4">
        {/* Title and Total Row */}
        <div className="flex justify-between items-center mb-3">
          {/* Title with Icon */}
          <div className="flex items-center gap-2">
            <div className="bg-white text-green-600 rounded-full p-1.5 shadow-md">
              <ArrowUp size={20} />
            </div>
            <h2 className="text-lg font-semibold">Incoming Funds</h2>
          </div>

          {/* Total Amount */}
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

        {/* Action Buttons Row */}
        <div className="flex justify-between items-center mb-3">
          {/* Currency Selector */}
          <div className="relative currency-dropdown">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-700 hover:bg-green-800 text-white p-2 px-3 rounded-full transition-colors flex items-center"
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
                onClick={toggleFilterExpansion}
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

            {/* Add Income Button with Plus Icon */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                  ${
                    isSmallScreen
                      ? "bg-white text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors shadow-sm flex items-center justify-center"
                      : "bg-white text-green-600 px-3 py-1 rounded hover:bg-green-50 transition-colors text-sm font-medium shadow-sm flex items-center gap-1"
                  }
                `}
              title="Add Income"
            >
              <Plus size={isSmallScreen ? 20 : 14} />
              {!isSmallScreen && <span>Add Income</span>}
            </motion.button>
          </div>
        </div>

        {/* Applied Date Filters Display */}
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
                suggestions={fundNames}
                variant="incoming"
              />
            </div>
            <div className="relative z-20">
              <SearchWithSuggestions
                placeholder="Search by category..."
                onSearch={handleCategorySearch}
                suggestions={categories}
                variant="incoming"
              />
            </div>
          </motion.div>
        )}

        {/* Active Filters Indicator for Mobile */}
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
              gradientFrom: "from-green-600",
              gradientTo: "to-green-500",
            }}
          />
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-50 p-2 text-green-700 text-sm text-center border-b border-green-200"
        >
          {error}
        </motion.div>
      )}

      {/* Fund Items List */}
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
                  fund.isSoon ? "bg-green-50" : ""
                }`}
              >
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
                            convertToDisplayCurrency(fund.amount, fund.currency)
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
                          fund.category === "Employment"
                            ? "bg-blue-100 text-blue-700"
                            : fund.category === "Side Business"
                              ? "bg-purple-100 text-purple-700"
                              : fund.category === "Property"
                                ? "bg-orange-100 text-orange-700"
                                : fund.category === "Investments"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {fund.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      Next: {formatDate(fund.nextExecution)}
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

                {fund.isSoon && (
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
                <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  Add Your First Income
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingRecurringFunds;
