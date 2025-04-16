import { useState, useEffect, useMemo } from "react";
import { Budget } from "../../interfaces/Budget";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { useAuth } from "../../context/AuthContext";
import AnimatedModal from "../animations/BlurPopup";
import { motion } from "framer-motion";

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
  onSuccess?: () => void;
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
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
    // Reset form when modal opens
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

  // Fetch exchange rates when component mounts
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

  // Handle currency changes and conversions
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
    setTimeout(() => setIsSearchOpen(false), 200); // Delay to allow click on dropdown items
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
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating budget:", error);
      setError("Failed to update budget. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      backdropBlur="md"
      closeOnBackdropClick={true}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          maxWidth: isSmallScreen ? "100%" : "28rem",
          minWidth: isSmallScreen ? "auto" : "28rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
      >
        <div className="bg-indigo-500 h-20 relative">
          <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
          <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
          <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>

          <div className="absolute bottom-0 left-0 w-full px-6 pb-3 flex items-center">
            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <motion.svg
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.3 }}
                className="w-6 h-6 text-indigo-600"
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
              </motion.svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit {budget.name}✨</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"
            >
              <div className="flex">
                <svg
                  className="h-5 w-5 mr-2 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">🏷️</span>
                Budget Name<span className="text-indigo-500">*</span>
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                placeholder="Monthly Groceries"
                required
              />
            </div>

            <div>
              <label
                htmlFor="limitAmount"
                className="text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">💰</span>
                Limit Amount<span className="text-indigo-500">*</span>
              </label>
              <div className="flex border border-indigo-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50 overflow-hidden">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  type="number"
                  id="limitAmount"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="flex-1 px-4 py-3 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="500"
                  required
                />
                <motion.select
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                  className="px-3 py-3 bg-indigo-500 text-white font-medium focus:outline-none"
                  disabled={fetchingRates}
                  required
                >
                  {Object.keys(rates).map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </motion.select>
              </div>
            </div>

            <div>
              <label
                htmlFor="categories"
                className="text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">📂</span>
                Categories
              </label>
              <div className="space-y-3">
                {/* Search bar for categories */}
                <motion.div
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative"
                >
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    placeholder="Search categories..."
                    className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                  />
                  {isSearchOpen && (
                    <div className="absolute z-10 bg-white border border-indigo-200 rounded-xl shadow-lg mt-2 w-full max-h-32 overflow-y-auto">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                          <div
                            key={category.id}
                            onClick={() => handleAddCategory(category)}
                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
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
                </motion.div>

                {/* Selected categories */}
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full shadow-sm"
                    >
                      <span className="mr-2">{category.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(category.id)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {currency !== originalCurrency && convertedAmount !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm"
              >
                <div>
                  <p className="font-bold text-indigo-700 mb-3 flex items-center">
                    <span className="mr-1">💰</span>
                    Limit Amount After Conversion:
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="px-3 py-2 bg-white rounded-lg border border-indigo-200 text-indigo-900">
                      <p className="text-sm font-medium">
                        {originalLimitAmount.toFixed(2)} {originalCurrency}
                      </p>
                    </div>

                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ x: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <svg
                          className="h-6 w-6 text-indigo-500"
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
                      </motion.div>
                    </div>

                    <div className="px-3 py-2 bg-indigo-500 text-white rounded-lg shadow-md">
                      <p className="text-sm font-medium">
                        {convertedAmount.toFixed(2)} {currency}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs mt-3 text-indigo-600 border-t border-indigo-100 pt-2">
                    <p className="flex items-center">
                      <span className="mr-1">💱</span>
                      Exchange rate: 1 {originalCurrency} ={" "}
                      {getExchangeRate(
                        originalCurrency,
                        currency,
                        rates
                      ).toFixed(4)}{" "}
                      {currency}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border-2 border-indigo-200 rounded-xl text-indigo-600 font-medium bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all shadow-sm"
                disabled={isSubmitting}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.2)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                type="submit"
                className="flex-1 py-3 px-4 bg-indigo-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Save Changes ✨"}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatedModal>
  );
};

export default EditBudget;
