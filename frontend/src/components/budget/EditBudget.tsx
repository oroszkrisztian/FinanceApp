import { useState, useEffect, useMemo, useRef } from "react";
import { Budget } from "../../interfaces/Budget";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Search, ChevronDown, Edit, DollarSign, Tag, TrendingUp } from "lucide-react";

import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import { CurrencyType } from "../../interfaces/enums";
import { updateUserBudget } from "../../services/budgetService";

interface EditBudgetProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget;
  categories: CustomCategory[];
  onSuccess?: (budgetId: number) => void;
  color?: string;
}

const EditBudget: React.FC<EditBudgetProps> = ({
  isOpen,
  onClose,
  budget,
  categories,
  onSuccess,
  color,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(budget.name);
  const [limitAmount, setLimitAmount] = useState(budget.limitAmount.toString());
  const [currency, setCurrency] = useState<CurrencyType>(
    budget.currency as CurrencyType
  );
  const [selectedCategories, setSelectedCategories] = useState<
    CustomCategory[]
  >(budget.customCategories);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const [originalCurrency, setOriginalCurrency] = useState<CurrencyType>(
    budget.currency as CurrencyType
  );
  const [originalLimitAmount, setOriginalLimitAmount] = useState(
    budget.limitAmount
  );
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [hasChangedCurrency, setHasChangedCurrency] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = useMemo(() => {
    const selectedIds = selectedCategories.map((cat) => cat.id);

    if (!searchTerm.trim()) {
      return categories.filter((cat) => !selectedIds.includes(cat.id));
    }

    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedIds.includes(cat.id)
    );
  }, [searchTerm, categories, selectedCategories]);

  const handleAddCategory = (category: CustomCategory) => {
    setSelectedCategories([...selectedCategories, category]);
    setSearchTerm("");
    setIsSearchOpen(false);
  };

  const handleRemoveCategory = (id: number) => {
    setSelectedCategories(selectedCategories.filter((cat) => cat.id !== id));
  };

  useEffect(() => {
    if (isOpen) {
      setName(budget.name);
      setLimitAmount(budget.limitAmount.toString());
      setCurrency(budget.currency as CurrencyType);
      setSelectedCategories(budget.customCategories);
      setOriginalCurrency(budget.currency as CurrencyType);
      setOriginalLimitAmount(budget.limitAmount);
      setError(null);
      setIsSubmitting(false);
      setHasChangedCurrency(false);
      setConvertedAmount(null);
      setSearchTerm("");
      setIsSearchOpen(false);
      setIsCurrencyOpen(false);
    }
  }, [isOpen, budget]);

  useEffect(() => {
    const loadExchangeRates = async () => {
      setFetchingRates(true);
      try {
        const ratesData = await fetchExchangeRates();
        setRates(ratesData);
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
    setError(null);

    if (
      Object.keys(rates).length === 0 ||
      !budget ||
      !originalLimitAmount ||
      !currency ||
      !originalCurrency
    ) {
      setConvertedAmount(null);
      return;
    }

    if (currency === originalCurrency) {
      if (hasChangedCurrency) {
        setConvertedAmount(null);
        setLimitAmount(originalLimitAmount.toString());
        setHasChangedCurrency(false);
      }
      return;
    }

    setHasChangedCurrency(true);

    const validation = validateCurrencyConversion(
      originalCurrency,
      currency,
      rates
    );

    if (!validation.valid) {
      setError(validation.error || "Currency conversion error");
      setConvertedAmount(null);
      return;
    }

    try {
      const convertedValue = convertAmount(
        originalLimitAmount,
        originalCurrency,
        currency,
        rates
      );

      setConvertedAmount(convertedValue);
      setLimitAmount(convertedValue.toFixed(2));
    } catch (error) {
      console.error("Conversion error:", error);
      setError("Failed to convert amount. Please try a different currency.");
      setConvertedAmount(null);
    }
  }, [
    currency,
    originalCurrency,
    budget,
    rates,
    hasChangedCurrency,
    originalLimitAmount,
  ]);

  const handleSearchFocus = () => {
    setIsSearchOpen(true);
    setIsCurrencyOpen(false);
  };

  const handleCurrencyToggle = () => {
    setIsCurrencyOpen(!isCurrencyOpen);
    setIsSearchOpen(false); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    setIsSearchOpen(false);
    setIsCurrencyOpen(false);
    
    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    if (!name.trim()) {
      setError("Budget name is required");
      return;
    }

    const limitAmountValue = parseFloat(limitAmount);
    if (isNaN(limitAmountValue) || limitAmountValue <= 0) {
      setError("Please enter a valid limit amount");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await updateUserBudget(
        user.id,
        budget.id,
        name,
        limitAmountValue,
        currency,
        selectedCategories.map((cat) => cat.id)
      );

      setIsSubmitting(false);
      onSuccess?.(budget.id);
      onClose();
    } catch (error) {
      console.error("Error updating budget:", error);
      setError("Failed to update budget. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setIsSearchOpen(false);
            setIsCurrencyOpen(false);
            onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
              isMobileView ? "max-w-sm w-full max-h-[95vh]" : "max-w-md w-full max-h-[90vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/*Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              {/*background elements */}
              <div
                className={`absolute top-0 right-0 bg-white/20 rounded-full ${
                  isMobileView
                    ? "w-12 h-12 -translate-y-6 translate-x-6"
                    : "w-16 h-16 -translate-y-8 translate-x-8"
                }`}
              ></div>
              <div
                className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${
                  isMobileView
                    ? "w-8 h-8 translate-y-4 -translate-x-4"
                    : "w-12 h-12 translate-y-6 -translate-x-6"
                }`}
              ></div>
              <div
                className={`absolute bg-white/15 rounded-full ${
                  isMobileView
                    ? "top-2 left-16 w-6 h-6"
                    : "top-2 left-16 w-8 h-8"
                }`}
              ></div>
              <div
                className={`absolute bg-white/10 rounded-full ${
                  isMobileView
                    ? "bottom-2 right-12 w-4 h-4"
                    : "bottom-2 right-12 w-6 h-6"
                }`}
              ></div>

              <div className={`relative z-10 ${isMobileView ? "p-3" : "p-4"}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`bg-white text-indigo-600 rounded-full shadow-lg ${
                        isMobileView ? "p-1.5 w-7 h-7" : "p-1.5 w-10 h-10"
                      } flex items-center justify-center`}
                    >
                      <Edit size={isMobileView ? 14 : 18} />
                    </div>
                    <div>
                      <h2 className={`font-semibold ${isMobileView ? "text-base" : "text-lg"}`}>
                        Edit Budget
                      </h2>
                      <p className={`opacity-90 ${isMobileView ? "text-xs" : "text-sm"}`}>
                        {budget.name}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setIsCurrencyOpen(false);
                      onClose();
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X size={isMobileView ? 20 : 20} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className={`${isMobileView ? "p-3" : "p-4"} flex-1 overflow-y-auto`}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 shadow-sm"
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className={`space-y-4 ${isSearchOpen ? "pb-32" : ""}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                    placeholder="Monthly Groceries"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limit Amount *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <DollarSign
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="number"
                        value={limitAmount}
                        onChange={(e) => setLimitAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                        placeholder="500"
                        required
                      />
                    </div>
                    <div className="relative" ref={currencyRef}>
                      <button
                        type="button"
                        onClick={handleCurrencyToggle}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-left flex items-center justify-between shadow-sm"
                        disabled={fetchingRates}
                      >
                        {currency}
                        <ChevronDown size={16} className="text-gray-400" />
                      </button>
                      {isCurrencyOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-xl z-[60] max-h-48 overflow-y-auto"
                        >
                          {Object.keys(rates).map((curr) => (
                            <button
                              key={curr}
                              type="button"
                              onClick={() => {
                                setCurrency(curr as CurrencyType);
                                setIsCurrencyOpen(false);
                                setIsSearchOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                                curr === currency ? "bg-indigo-50 text-indigo-700" : ""
                              }`}
                            >
                              {curr}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categories
                  </label>
                  <div className="space-y-3">
                    <div className="relative" ref={searchRef}>
                      <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={handleSearchFocus}
                        placeholder="Search categories..."
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      />
                      {isSearchOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] max-h-28 overflow-y-auto"
                        >
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => handleAddCategory(category)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                              >
                                {category.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No categories found
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {selectedCategories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors hover:opacity-75 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        >
                          <Tag size={10} />
                          {category.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(category.id)}
                            className="ml-1 hover:text-indigo-900"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {currency !== originalCurrency && convertedAmount !== null && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={14} className="text-indigo-600" />
                      <p className="font-medium text-indigo-700 text-sm">
                        Currency Conversion
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="px-2 py-1 bg-white rounded-lg border border-indigo-200 text-indigo-900">
                        <p className="text-xs font-medium">
                          {originalLimitAmount.toFixed(2)} {originalCurrency}
                        </p>
                      </div>
                      <div className="px-1">
                        <svg
                          className="h-3 w-3 text-indigo-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </div>
                      <div className="px-2 py-1 bg-indigo-500 text-white rounded-lg">
                        <p className="text-xs font-medium">
                          {convertedAmount.toFixed(2)} {currency}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs mt-1 text-indigo-600 text-center">
                      Rate: 1 {originalCurrency} ={" "}
                      {getExchangeRate(
                        originalCurrency,
                        currency,
                        rates
                      ).toFixed(4)}{" "}
                      {currency}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 flex gap-2`}>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setIsCurrencyOpen(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditBudget;