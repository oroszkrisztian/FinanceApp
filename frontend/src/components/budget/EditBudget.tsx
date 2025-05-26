import { useState, useEffect, useMemo } from "react";
import { Budget } from "../../interfaces/Budget";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Search, ChevronDown } from "lucide-react";

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

  // Currency conversion state
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
  };

  const handleSearchBlur = () => {
    setTimeout(() => setIsSearchOpen(false), 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - matching transaction component style */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white text-indigo-600 rounded-full p-2 shadow-md">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Edit Budget</h2>
                    <p className="text-indigo-100 text-sm">{budget.name}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="text-white hover:text-indigo-100 transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Monthly Groceries"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limit Amount *
                  </label>
                  <div className="flex border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all overflow-hidden">
                    <input
                      type="number"
                      value={limitAmount}
                      onChange={(e) => setLimitAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      className="flex-1 px-4 py-3 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="500"
                      required
                    />
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                        className="px-4 py-3 bg-indigo-500 text-white font-medium focus:outline-none hover:bg-indigo-600 transition-colors flex items-center gap-1"
                        disabled={fetchingRates}
                      >
                        {currency}
                        <ChevronDown size={16} />
                      </button>
                      {isCurrencyOpen && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 w-32 max-h-48 overflow-y-auto">
                          {Object.keys(rates).map((curr) => (
                            <button
                              key={curr}
                              type="button"
                              onClick={() => {
                                setCurrency(curr as CurrencyType);
                                setIsCurrencyOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                curr === currency ? "bg-indigo-50 text-indigo-700" : ""
                              }`}
                            >
                              {curr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        placeholder="Search categories..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                      {isSearchOpen && (
                        <div className="absolute z-10 bg-white border border-gray-300 rounded-xl shadow-lg mt-2 w-full max-h-32 overflow-y-auto">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                              <div
                                key={category.id}
                                onClick={() => handleAddCategory(category)}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                {category.name}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">
                              No categories found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map((category) => (
                        <span
                          key={category.id}
                          className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                        >
                          {category.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(category.id)}
                            className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {currency !== originalCurrency && convertedAmount !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl"
                  >
                    <p className="font-medium text-indigo-700 mb-3">
                      Currency Conversion
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-2 bg-white rounded-lg border border-indigo-200 text-indigo-900">
                        <p className="text-sm font-medium">
                          {originalLimitAmount.toFixed(2)} {originalCurrency}
                        </p>
                      </div>
                      <div className="px-2">
                        <svg
                          className="h-4 w-4 text-indigo-500"
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
                      <div className="px-3 py-2 bg-indigo-500 text-white rounded-lg">
                        <p className="text-sm font-medium">
                          {convertedAmount.toFixed(2)} {currency}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs mt-2 text-indigo-600">
                      Exchange rate: 1 {originalCurrency} ={" "}
                      {getExchangeRate(
                        originalCurrency,
                        currency,
                        rates
                      ).toFixed(4)}{" "}
                      {currency}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Save Changes"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditBudget;