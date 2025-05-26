import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  DollarSign,
  Tag,
  Info,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Search,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { CustomCategory } from "../../interfaces/CustomCategory";

import { createUserBudgetWithCategories } from "../../services/budgetService";
import {
  ExchangeRates,
  fetchExchangeRates,
} from "../../services/exchangeRateService";

interface CreateNewBudgetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CustomCategory[];
  onSuccess?: () => void;
}

interface SelectedCategory {
  id: number;
  name: string;
}

const SearchWithSuggestions: React.FC<{
  placeholder: string;
  onSearch: (term: string) => void;
  suggestions: string[];
  onSelect?: (suggestion: string) => void;
  selectedItems?: string[];
  multiSelect?: boolean;
}> = ({
  placeholder,
  onSearch,
  suggestions,
  onSelect,
  selectedItems = [],
  multiSelect = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [searchTerm, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (onSelect) {
      onSelect(suggestion);
    }
    if (!multiSelect) {
      setSearchTerm(suggestion);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                selectedItems.includes(suggestion)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      )}

      {multiSelect && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedItems.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors bg-indigo-100 text-indigo-700"
            >
              <Tag size={12} />
              {item}
              <button
                type="button"
                onClick={() => onSelect && onSelect(item)}
                className="ml-1 hover:text-indigo-900"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateNewBudget: React.FC<CreateNewBudgetProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: "",
    limitAmount: "",
    limitAmountString: "",
    currency: "RON",
    selectedCategories: [] as SelectedCategory[],
  });

  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

  const currencyRef = useRef<HTMLDivElement>(null);

  const steps = ["Basic Info", "Categories", "Review"];

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

    if (isOpen) {
      loadExchangeRates();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      name: "",
      limitAmount: "",
      limitAmountString: "",
      currency: "RON",
      selectedCategories: [],
    });
    setCategorySearchTerm("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const filteredCategories = useMemo(() => {
    const selectedIds = formData.selectedCategories.map((cat) => cat.id);

    if (!categorySearchTerm.trim()) {
      return categories
        .filter((cat) => !selectedIds.includes(cat.id))
        .slice(0, 10);
    }

    return categories
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) &&
          !selectedIds.includes(cat.id)
      )
      .slice(0, 5);
  }, [categorySearchTerm, categories, formData.selectedCategories]);

  const handleAddCategory = (category: CustomCategory) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: [
        ...prev.selectedCategories,
        {
          id: category.id,
          name: category.name,
        },
      ]
    }));
    setCategorySearchTerm("");
  };

  const handleCategorySelect = (categoryName: string) => {
    const selectedCategory = categories.find(cat => cat.name === categoryName);
    if (selectedCategory) {
      if (formData.selectedCategories.some(cat => cat.id === selectedCategory.id)) {
        handleRemoveCategory(selectedCategory.id);
      } else {
        handleAddCategory(selectedCategory);
      }
    }
  };

  const handleRemoveCategory = (id: number) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.filter((cat) => cat.id !== id)
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.name.trim() && 
          formData.limitAmount && 
          !isNaN(Number(formData.limitAmount)) && 
          Number(formData.limitAmount) > 0
        );
      case 2:
        return formData.selectedCategories.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    if (!user) {
      setError("User not found");
      setLoading(false);
      return;
    }

    try {
      if (!formData.name.trim()) {
        throw new Error("Budget name is required");
      }

      if (
        !formData.limitAmount ||
        isNaN(Number(formData.limitAmount)) ||
        Number(formData.limitAmount) <= 0
      ) {
        throw new Error("Please enter a valid budget limit");
      }

      if (formData.selectedCategories.length === 0) {
        throw new Error("At least one category is required");
      }

      await createUserBudgetWithCategories(
        user.id,
        formData.name,
        Number(formData.limitAmount),
        formData.currency,
        formData.selectedCategories.map((cat) => cat.id)
      );

      resetForm();
      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const categorySuggestions = filteredCategories.map(cat => cat.name);
  const selectedCategoryNames = formData.selectedCategories.map(cat => cat.name);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g., Monthly Expenses, Groceries"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Limit *
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={formData.limitAmountString}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === "" || /^[0-9]*([.,][0-9]*)?$/.test(value)) {
                        handleInputChange("limitAmountString", value);

                        if (value === "") {
                          handleInputChange("limitAmount", "");
                        } else {
                          const numericValue = parseFloat(
                            value.replace(",", ".")
                          );

                          if (!isNaN(numericValue)) {
                            handleInputChange("limitAmount", String(numericValue));
                          }
                        }
                      }
                    }}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="1000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <div className="relative" ref={currencyRef}>
                  <button
                    type="button"
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-left flex items-center justify-between transition-all"
                    disabled={fetchingRates}
                  >
                    <span>{formData.currency}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {isCurrencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
                    >
                      {fetchingRates ? (
                        <div className="p-3 text-center text-gray-500">
                          Loading currencies...
                        </div>
                      ) : (
                        Object.keys(rates).map((currency) => (
                          <button
                            key={currency}
                            type="button"
                            onClick={() => {
                              handleInputChange("currency", currency);
                              setIsCurrencyOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                              formData.currency === currency
                                ? "bg-indigo-50 text-indigo-700"
                                : ""
                            }`}
                          >
                            {currency}
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {formData.limitAmount && (
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">
                    Budget Overview
                  </span>
                </div>
                <p className="text-sm text-indigo-700">
                  You'll be able to track expenses up to{" "}
                  <span className="font-semibold">
                    {formData.limitAmount} {formData.currency}
                  </span>
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Budget Categories *
                </label>
                {formData.selectedCategories.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {formData.selectedCategories.length} selected
                  </span>
                )}
              </div>

              <SearchWithSuggestions
                placeholder="Search and select categories..."
                onSearch={setCategorySearchTerm}
                suggestions={categorySuggestions}
                onSelect={handleCategorySelect}
                selectedItems={selectedCategoryNames}
                multiSelect={true}
              />
            </div>

            {formData.selectedCategories.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <p className="text-amber-700 text-sm flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  At least one category is required to create a budget
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl">
              <h3 className="font-semibold text-lg mb-4 text-indigo-900">
                {formData.name}
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-600">Budget Limit:</span>
                  <span className="ml-2 font-medium text-indigo-700">
                    {formData.limitAmount} {formData.currency}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Categories:</span>
                  <span className="ml-2 font-medium text-indigo-700">
                    {formData.selectedCategories.length} selected
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-gray-600 text-sm">Selected Categories:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.selectedCategories.map((category) => (
                    <span
                      key={category.id}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Ready to Create
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your budget will help you track spending across{" "}
                {formData.selectedCategories.length} categories with a limit of{" "}
                {formData.limitAmount} {formData.currency}.
              </p>
            </div>
          </div>
        );

      default:
        return null;
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
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - matching transaction component style */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full p-2 text-indigo-600">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Create New Budget</h2>
                    <p className="text-indigo-100 text-sm">
                      {steps[currentStep - 1]}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="text-white hover:text-indigo-100 transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Progress */}
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded ${
                      index < currentStep ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 min-h-[300px] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2 mb-6">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {renderStepContent()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </motion.button>

              {currentStep < 3 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue
                  <ArrowRight size={16} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Wallet size={16} />
                  )}
                  Create Budget
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateNewBudget;