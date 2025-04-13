import { useState, useEffect, useMemo } from "react";
import { Budget } from "../../interfaces/Budget";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { useAuth } from "../../context/AuthContext";
import AnimatedModal from "../animations/BlurPopup";

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
  color?: string; // New prop for budget color
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
      <div
        className={`bg-white rounded-2xl shadow-lg w-full mx-auto flex flex-col ${
          isSmallScreen ? "max-w-full min-w-0 p-0" : "max-w-md min-w-[400px]"
        }`}
      >
        <div
          className={`px-5 py-5 rounded-t-2xl relative`}
          style={{
            background: color || "#4F46E5",
            backgroundImage: `linear-gradient(to right, ${color || "#4F46E5"}, ${color || "#6366F1"})`,
          }}
        >
          <div className="absolute inset-0 opacity-10 mix-blend-overlay">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20px 20px, white 3px, transparent 4px)",
                backgroundSize: "25px 25px",
              }}
            ></div>
          </div>

          <div className="relative flex items-center">
            <div className="mr-3 p-2.5 rounded-full bg-indigo-400 shadow-lg">
              <svg
                className="h-6 w-6 text-white"
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
            <h2 className="text-lg font-bold text-white">Edit Budget</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limit Amount
              </label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <input
                  type="number"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="flex-1 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                  className="px-3 py-2 bg-indigo-500 text-white font-medium focus:outline-none"
                  disabled={fetchingRates}
                >
                  {Object.keys(rates).map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency conversion information */}
            {currency !== originalCurrency && currency && originalCurrency && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-md shadow-sm">
                {fetchingRates ? (
                  <div className="flex items-center text-indigo-700">
                    <svg
                      className="animate-spin mr-3 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Calculating conversion...
                  </div>
                ) : convertedAmount !== null ? (
                  <div>
                    <p className="font-bold text-indigo-700 mb-3 flex items-center">
                      <span className="mr-1">💰</span>
                      Budget Amount After Conversion:
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-2 bg-white rounded-lg border border-indigo-200 text-indigo-900">
                        <p className="text-sm font-medium">
                          {originalLimitAmount.toFixed(2)} {originalCurrency}
                        </p>
                      </div>

                      <div className="flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-indigo-500 mx-3"
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
                ) : (
                  <p className="text-indigo-700 flex items-center">
                    <span className="mr-1">⚠️</span>
                    Unable to convert currencies. Please select a different
                    currency.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="relative mb-3" id="category-dropdown">
                <div
                  className="flex items-center border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <div className="p-2 bg-gray-50 m-1.5 rounded-md">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="category-search"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (!isSearchOpen) setIsSearchOpen(true);
                    }}
                    className="w-full py-2.5 px-2 bg-transparent outline-none text-gray-800"
                    placeholder="Search for categories..."
                  />
                </div>

                {isSearchOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-32 overflow-auto">
                    {filteredCategories.length > 0 ? (
                      <ul>
                        {filteredCategories.map((category) => (
                          <li
                            key={category.id}
                            className="px-4 py-2 cursor-pointer hover:bg-indigo-50 flex items-center"
                            onClick={() => handleAddCategory(category)}
                          >
                            <span className="flex-1">{category.name}</span>
                            <button
                              type="button"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No categories available
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedCategories.length === 0 ? (
                <p className="text-gray-500 text-xs italic">
                  Search and select
                </p>
              ) : (
                <div className="relative">
                  <div className="space-y-2">
                    {selectedCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="mr-2 p-1.5 bg-indigo-50 rounded-md text-indigo-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        </div>
                        <span className="flex-grow text-sm text-gray-800">
                          {category.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category.id)}
                          className="ml-2 text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className={`flex ${isSmallScreen ? "flex-col space-y-2" : "justify-end space-x-3"} p-4 bg-white flex-shrink-0 rounded-b-2xl`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`${isSmallScreen ? "w-full" : "px-4"} py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium focus:outline-none shadow-sm hover:bg-gray-50`}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className={`${isSmallScreen ? "w-full" : "px-5"} py-2 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-full text-sm font-medium focus:outline-none shadow-sm hover:from-indigo-600 hover:to-indigo-800 disabled:opacity-50 transform transition-transform hover:scale-105 duration-200`}
                disabled={
                  isSubmitting ||
                  (currency !== originalCurrency && fetchingRates)
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </span>
                ) : currency !== originalCurrency && fetchingRates ? (
                  "Loading Rates..."
                ) : (
                  "Save Changes ✨"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default EditBudget;
