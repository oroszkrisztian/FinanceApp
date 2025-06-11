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
  CheckCircle,
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
          size={14}
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-indigo-400"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors shadow-sm bg-indigo-50/50"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-28 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
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
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedItems.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect && onSelect(item)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors hover:opacity-75 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            >
              <Tag size={10} />
              {item}
              <X size={10} className="ml-1" />
            </button>
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileView, setIsMobileView] = useState(false);
  
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
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                placeholder="e.g., Monthly Expenses, Groceries"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                    placeholder="1000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <div className="relative" ref={currencyRef}>
                  <button
                    type="button"
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-left flex items-center justify-between shadow-sm"
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
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
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
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-indigo-600" />
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
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Budget Categories *
                </label>
                {formData.selectedCategories.length > 0 && (
                  <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
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
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-600" />
                  <p className="text-amber-700 text-sm font-medium">
                    At least one category is required to create a budget
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={16} className="text-indigo-600" />
                <h3 className="font-semibold text-base text-indigo-900">
                  {formData.name}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="bg-white rounded-lg p-2 border border-indigo-100">
                  <span className="text-gray-600 block text-xs mb-1">Budget Limit:</span>
                  <span className="font-medium text-indigo-700">
                    {formData.limitAmount} {formData.currency}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2 border border-indigo-100">
                  <span className="text-gray-600 block text-xs mb-1">Categories:</span>
                  <span className="font-medium text-indigo-700">
                    {formData.selectedCategories.length} selected
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-600 text-xs block mb-2">Selected Categories:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.selectedCategories.map((category) => (
                    <span
                      key={category.id}
                      className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full border border-indigo-200"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-3 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Ready to Create
                </span>
              </div>
              <p className="text-sm text-green-700">
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
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
              isMobileView
                ? "max-w-sm w-full max-h-[95vh]"
                : "max-w-md w-full max-h-[90vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              {/* ackground elements */}
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
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`bg-white rounded-full shadow-lg text-indigo-600 ${
                        isMobileView ? "p-1.5 w-7 h-7" : "p-1.5 w-10 h-10"
                      } flex items-center justify-center`}
                    >
                      <Wallet size={isMobileView ? 14 : 18} />
                    </div>
                    <div>
                      <h2 className={`font-semibold ${isMobileView ? "text-base" : "text-lg"}`}>
                        Create New Budget
                      </h2>
                      <p className={`opacity-90 ${isMobileView ? "text-xs" : "text-sm"}`}>
                        {steps[currentStep - 1]}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={isMobileView ? 20 : 20} />
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
            </div>

            {/* Content */}
            <div className={`${isMobileView ? "p-3" : "p-4"} min-h-[300px]`}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2 mb-4 shadow-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {renderStepContent()}
            </div>

            {/* Footer */}
            <div className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 flex justify-between`}>
              <motion.button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: currentStep === 1 ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft size={16} />
                Back
              </motion.button>

              {currentStep < 3 ? (
                <motion.button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  whileHover={{ scale: !canProceed() ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue
                  <ArrowRight size={16} />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all disabled:opacity-50 shadow-md"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
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