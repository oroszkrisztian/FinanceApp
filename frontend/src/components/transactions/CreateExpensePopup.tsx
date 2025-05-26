import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Search,
  Tag,
  ChevronDown,
  Info,
  AlertCircle,
} from "lucide-react";
import { Account } from "../../interfaces/Account";
import { TransactionType } from "../../interfaces/enums";
import { Budget } from "../../interfaces/Budget";
import {
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
  ExchangeRates,
  fetchExchangeRates,
} from "../../services/exchangeRateService";
import { createExpense } from "../../services/transactionService";
import { useAuth } from "../../context/AuthContext";

interface CreateExpensePopupProps {
  onClose: () => void;
  isOpen: boolean;
  accounts: Account[];
  budgets: Budget[];
  accountsLoading: boolean;
  onSuccess: () => void;
  categories?: { id: number; name: string }[];
}

const SearchWithSuggestions: React.FC<{
  placeholder: string;
  onSearch: (term: string) => void;
  suggestions: string[];
  onSelect?: (suggestion: string) => void;
  selectedItems?: string[];
  multiSelect?: boolean;
  value?: string;
}> = ({
  placeholder,
  onSearch,
  suggestions,
  onSelect,
  selectedItems = [],
  multiSelect = false,
  value = "",
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

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
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-red-400"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-8 pr-3 py-3 text-sm border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors shadow-sm bg-red-50/50"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-red-50 transition-colors ${
                selectedItems.includes(suggestion)
                  ? "bg-red-50 text-red-700"
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
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors hover:opacity-75 bg-red-100 text-red-700 hover:bg-red-200"
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

const CreateExpensePopup: React.FC<CreateExpensePopupProps> = ({
  onClose,
  isOpen,
  accounts,
  budgets,
  accountsLoading,
  onSuccess,
  categories = [],
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    selectedAccount: string;
    selectedBudget: string;
    amount: number;
    currency: string;
    type: TransactionType;
    selectedCategories: number[];
  }>({
    name: "",
    description: "",
    selectedAccount: "",
    selectedBudget: "",
    amount: 0,
    currency: "RON",
    type: TransactionType.EXPENSE,
    selectedCategories: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Search states
  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [budgetSearchTerm, setBudgetSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

  // Selected items for display
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Currency and conversion
  const [rates, setRates] = useState<ExchangeRates>({});
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  const [amountString, setAmountString] = useState("");
  const [conversionDetails, setConversionDetails] = useState<{
    originalAmount: number;
    convertedAmount: number;
    rate: number;
    error: string | null;
  }>({
    originalAmount: 0,
    convertedAmount: 0,
    rate: 1,
    error: null,
  });

  const [activeTab, setActiveTab] = useState<"budget" | "categories">("budget");

  const steps = ["Basic Info", "Budget & Categories", "Account & Review"];

  // Load exchange rates
  useEffect(() => {
    const loadExchangeRates = async () => {
      setFetchingRates(true);
      setRatesError(null);
      try {
        const ratesData = await fetchExchangeRates();
        setRates(ratesData);
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
        setRatesError("Failed to load exchange rates");
      } finally {
        setFetchingRates(false);
      }
    };

    if (isOpen) {
      loadExchangeRates();
    }
  }, [isOpen]);

  // Mobile screen detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Currency dropdown click outside
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

  // Update conversion details
  useEffect(() => {
    updateConversionDetails();
  }, [formData.amount, formData.currency, selectedAccount, rates]);

  const updateConversionDetails = () => {
    if (!selectedAccount || !rates || Object.keys(rates).length === 0) return;

    const accountCurrency = selectedAccount.currency;
    const transactionCurrency = formData.currency;
    const validation = validateCurrencyConversion(
      transactionCurrency,
      accountCurrency,
      rates
    );

    if (!validation.valid) {
      setConversionDetails({
        originalAmount: formData.amount,
        convertedAmount: formData.amount,
        rate: 1,
        error: validation.error || "Invalid conversion",
      });
      return;
    }

    const rate = getExchangeRate(transactionCurrency, accountCurrency, rates);
    const convertedValue = convertAmount(
      formData.amount,
      transactionCurrency,
      accountCurrency,
      rates
    );

    setConversionDetails({
      originalAmount: formData.amount,
      convertedAmount: convertedValue,
      rate: rate,
      error: null,
    });
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      name: "",
      description: "",
      selectedAccount: "",
      selectedBudget: "",
      amount: 0,
      currency: "RON",
      type: TransactionType.EXPENSE,
      selectedCategories: [],
    });
    setAmountString("");
    setSelectedBudget(null);
    setSelectedAccount(null);
    setAccountSearchTerm("");
    setBudgetSearchTerm("");
    setCategorySearchTerm("");
    setConversionDetails({
      originalAmount: 0,
      convertedAmount: 0,
      rate: 1,
      error: null,
    });
    setError(null);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      resetForm();
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "amount" ? parseFloat(value) || 0 : value,
    }));
    setError(null);
  };

  // Account selection
  const handleAccountSelect = (accountName: string) => {
    const account = accounts.find((acc) => acc.name === accountName);
    if (account) {
      setSelectedAccount(account);
      setFormData((prev) => ({ ...prev, selectedAccount: String(account.id) }));
      setAccountSearchTerm("");
    }
  };

  // Budget selection
  const handleBudgetSelect = (budgetName: string) => {
    const budget = budgets.find((b) => b.name === budgetName);
    if (budget) {
      setSelectedBudget(budget);
      setFormData((prev) => ({ ...prev, selectedBudget: String(budget.id) }));
      setBudgetSearchTerm("");
    }
  };

  // Category selection
  const handleCategorySelect = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName);
    if (category) {
      const isSelected = formData.selectedCategories.includes(category.id);
      setFormData((prev) => ({
        ...prev,
        selectedCategories: isSelected
          ? prev.selectedCategories.filter((id) => id !== category.id)
          : [...prev.selectedCategories, category.id],
      }));
    }
  };

  // Clear selections
  const clearAccountSelection = () => {
    setSelectedAccount(null);
    setFormData((prev) => ({ ...prev, selectedAccount: "" }));
    setAccountSearchTerm("");
  };

  const clearBudgetSelection = () => {
    setSelectedBudget(null);
    setFormData((prev) => ({ ...prev, selectedBudget: "" }));
    setBudgetSearchTerm("");
  };

  // Get suggestions
  const accountSuggestions = accounts
    .filter((acc) =>
      acc.name.toLowerCase().includes(accountSearchTerm.toLowerCase())
    )
    .map((acc) => acc.name);

  const budgetSuggestions = budgets
    .filter((budget) =>
      budget.name.toLowerCase().includes(budgetSearchTerm.toLowerCase())
    )
    .map((budget) => budget.name);

  const categorySuggestions = categories
    .filter((cat) =>
      cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
    )
    .map((cat) => cat.name);

  const selectedCategoryNames = categories
    .filter((cat) => formData.selectedCategories.includes(cat.id))
    .map((cat) => cat.name);

  // Available currencies from rates with proper prioritization
  const getAvailableCurrencies = () => {
    if (Object.keys(rates).length === 0) {
      return ["USD", "EUR", "GBP", "JPY", "RON"];
    }

    // Most commonly used currencies (prioritized)
    const topCurrencies = [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "CHF",
      "CNY",
      "RON",
    ];
    const currentCurrency = formData.currency;

    // Get all available currencies from rates
    const allAvailableCurrencies = Object.keys(rates);

    // Start with top currencies that exist in rates
    const prioritizedCurrencies = topCurrencies.filter((curr) => rates[curr]);

    // Add current currency if not already in the list
    if (
      !prioritizedCurrencies.includes(currentCurrency) &&
      rates[currentCurrency]
    ) {
      prioritizedCurrencies.unshift(currentCurrency);
    }

    // Add remaining currencies alphabetically
    const remainingCurrencies = allAvailableCurrencies
      .filter((curr) => !prioritizedCurrencies.includes(curr))
      .sort();

    return [...prioritizedCurrencies, ...remainingCurrencies];
  };

  const availableCurrencies = getAvailableCurrencies();

  // Step validation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.amount > 0;
      case 2:
        return true; 
      case 3:
        return formData.selectedAccount;
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

  // Balance calculation
  const getTransactionAmount = (): number => {
    if (!selectedAccount || !formData.amount) return 0;

    if (formData.currency === selectedAccount.currency) {
      return formData.amount;
    } else {
      if (fetchingRates || conversionDetails.error) return 0;
      return conversionDetails.convertedAmount;
    }
  };

  const calculateNewBalance = (): {
    isValid: boolean;
    currentBalance: number;
    transactionAmount: number;
    newBalance: number;
    error?: string;
  } | null => {
    if (!selectedAccount || selectedAccount.amount === undefined) return null;

    const transactionAmount = getTransactionAmount();
    const currentBalance = selectedAccount.amount;
    const newBalance = currentBalance - transactionAmount;
    const isValid = newBalance >= 0;

    return {
      isValid,
      currentBalance,
      transactionAmount,
      newBalance,
      error: isValid ? undefined : "Insufficient funds",
    };
  };

  const balanceInfo = selectedAccount ? calculateNewBalance() : null;

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    if (user === null) {
      setError("User not found");
      setIsLoading(false);
      return;
    }

    try {
      const userId = user.id;

      await createExpense(
        userId,
        formData.name,
        formData.amount,
        formData.currency,
        parseInt(formData.selectedAccount),
        formData.selectedBudget ? parseInt(formData.selectedBudget) : null,
        formData.description || null,
        formData.selectedCategories.length > 0
          ? formData.selectedCategories
          : null
      );

      if (selectedAccount && formData.currency !== selectedAccount.currency) {
        console.log("Currency conversion performed:", {
          fromCurrency: formData.currency,
          toCurrency: selectedAccount.currency,
          originalAmount: formData.amount,
          convertedAmount: conversionDetails.convertedAmount,
          exchangeRate: conversionDetails.rate,
        });
      }

      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Failed to create expense:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create expense"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-red-500 mr-1">🏷️</span>
                Expense Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-4 py-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-red-50/50 shadow-sm"
                placeholder="Enter expense name"
                required
              />
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="text-red-500 mr-1">💰</span>
                  Amount<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400"
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-red-50/50 shadow-sm font-medium"
                    placeholder="0.00"
                    value={amountString}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^[0-9]*([.,][0-9]*)?$/.test(value)) {
                        setAmountString(value);
                        if (value === "") {
                          handleInputChange("amount", 0);
                        } else {
                          const numericValue = parseFloat(
                            value.replace(",", ".")
                          );
                          if (!isNaN(numericValue)) {
                            handleInputChange("amount", numericValue);
                          }
                        }
                      }
                    }}
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
                    disabled={fetchingRates}
                    className="w-full p-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-left flex items-center justify-between bg-red-50/50 shadow-sm transition-all disabled:opacity-50"
                  >
                    <span>
                      {fetchingRates ? "Loading..." : formData.currency}
                    </span>
                    <ChevronDown size={16} className="text-red-400" />
                  </button>

                  {isCurrencyOpen && !fetchingRates && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
                    >
                      {availableCurrencies.map((currency) => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => {
                            handleInputChange("currency", currency);
                            setIsCurrencyOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-red-50 transition-colors ${
                            formData.currency === currency
                              ? "bg-red-50 text-red-700"
                              : ""
                          }`}
                        >
                          {currency}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-red-500 mr-1">📝</span>
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full px-4 py-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-red-50/50 shadow-sm"
                placeholder="Add expense details"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("budget")}
                className={`py-2 px-4 text-sm font-medium transition-colors ${
                  activeTab === "budget"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Budget
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={`py-2 px-4 text-sm font-medium transition-colors ${
                  activeTab === "categories"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Categories
              </button>
            </div>

            {activeTab === "budget" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="text-red-500 mr-1">📊</span>
                  Budget (Optional)
                </label>
                {budgets.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                    No budgets available.
                  </div>
                ) : (
                  <>
                    <SearchWithSuggestions
                      placeholder="Search and select budget..."
                      onSearch={setBudgetSearchTerm}
                      suggestions={budgetSuggestions}
                      onSelect={handleBudgetSelect}
                      value={selectedBudget?.name || budgetSearchTerm}
                    />
                    {selectedBudget && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-red-800">
                              {selectedBudget.name}
                            </div>
                            <div className="text-sm text-red-600">
                              Spent:{" "}
                              {selectedBudget.currentSpent?.toFixed(2) ||
                                "0.00"}{" "}
                              {selectedBudget.currency}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearBudgetSelection}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="text-red-500 mr-1">🏷️</span>
                  Categories (Optional)
                </label>
                {categories.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                    No categories available.
                  </div>
                ) : (
                  <SearchWithSuggestions
                    placeholder="Search and select categories..."
                    onSearch={setCategorySearchTerm}
                    suggestions={categorySuggestions}
                    onSelect={handleCategorySelect}
                    selectedItems={selectedCategoryNames}
                    multiSelect={true}
                  />
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-red-500 mr-1">💳</span>
                Select Account<span className="text-red-500">*</span>
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-11 bg-gray-200 rounded-xl"></div>
              ) : accounts.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                  No accounts available. Please create one first.
                </div>
              ) : (
                <>
                  <SearchWithSuggestions
                    placeholder="Search and select account..."
                    onSearch={setAccountSearchTerm}
                    suggestions={accountSuggestions}
                    onSelect={handleAccountSelect}
                    value={selectedAccount?.name || accountSearchTerm}
                  />
                  {selectedAccount && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-red-800">
                            {selectedAccount.name}
                          </div>
                          <div className="text-sm text-red-600">
                            Balance: {selectedAccount.amount.toFixed(2)}{" "}
                            {selectedAccount.currency}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearAccountSelection}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Preview Section */}
            {selectedAccount && (
              <div className="space-y-4">
                {/* Expense Summary */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-lg mb-3 text-red-800">
                    {formData.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <span className="ml-2 font-medium">
                        {formData.amount} {formData.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Account:</span>
                      <span className="ml-2 font-medium">
                        {selectedAccount?.name}
                      </span>
                    </div>
                    {selectedBudget && (
                      <div>
                        <span className="text-gray-600">Budget:</span>
                        <span className="ml-2 font-medium">
                          {selectedBudget.name}
                        </span>
                      </div>
                    )}
                    {formData.selectedCategories.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Categories: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {categories
                            .filter((cat) =>
                              formData.selectedCategories.includes(cat.id)
                            )
                            .map((category) => (
                              <span
                                key={category.id}
                                className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                              >
                                {category.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.description && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <span className="text-gray-600 text-sm">Description: </span>
                      <span className="text-sm text-gray-800">
                        {formData.description}
                      </span>
                    </div>
                  )}
                </div>

                {/* Transaction Summary */}
                {formData.amount > 0 && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-xl shadow-sm">
                    <h3 className="font-bold text-red-700 mb-3 flex items-center">
                      <span className="mr-1">💰</span>
                      Transaction Summary
                    </h3>

                    {balanceInfo && !balanceInfo.isValid ? (
                      <div className="p-3 bg-red-100 rounded-lg border border-red-200">
                        <div className="flex items-center text-red-600 font-medium mb-2">
                          <AlertCircle size={16} className="mr-2" />
                          Insufficient funds
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-red-100">
                          <p className="text-sm text-gray-700">
                            Amount exceeded by:
                            <span className="ml-2 font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                              {Math.abs(balanceInfo.newBalance).toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : balanceInfo ? (
                      <div className="bg-white rounded-lg border border-red-100 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 divide-y divide-red-50">
                          <div className="p-3 flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Current Balance:
                            </span>
                            <span className="font-medium">
                              {balanceInfo.currentBalance.toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </span>
                          </div>
                          <div className="p-3 flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Transaction:
                            </span>
                            <span className="text-red-500 font-medium">
                              -{balanceInfo.transactionAmount.toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </span>
                          </div>
                          <div className="p-3 flex justify-between items-center bg-red-50/50">
                            <span className="text-sm font-medium text-gray-700">
                              New Balance:
                            </span>
                            <span className="font-bold">
                              {balanceInfo.newBalance.toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Currency Conversion Info */}
                    {formData.currency !== selectedAccount.currency &&
                      !conversionDetails.error &&
                      !fetchingRates && (
                        <div className="mt-3 text-sm">
                          <div className="flex items-center text-red-700 mb-2">
                            <Info size={14} className="mr-1" />
                            <span className="font-medium">Currency Conversion</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="px-3 py-2 bg-white rounded-lg border border-red-200 text-red-900">
                              <p className="text-sm font-medium">
                                {formData.amount.toFixed(2)} {formData.currency}
                              </p>
                            </div>

                            <div className="flex items-center justify-center px-2">
                              <ArrowRight size={16} className="text-red-500" />
                            </div>

                            <div className="px-3 py-2 bg-red-500 text-white rounded-lg shadow-md">
                              <p className="text-sm font-medium">
                                {conversionDetails.convertedAmount.toFixed(2)}{" "}
                                {selectedAccount.currency}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs mt-2 text-red-600 border-t border-red-100 pt-2">
                            <p className="flex items-center">
                              <span className="mr-1">💱</span>
                              Exchange rate: 1 {formData.currency} ={" "}
                              {conversionDetails.rate.toFixed(4)}{" "}
                              {selectedAccount.currency}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
        style={{
          minWidth: isMobileScreen ? "100%" : "36rem",
          height: isMobileScreen ? "70vh" : "60vh",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 py-4 relative z-10">
          <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
          <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
          <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>

          <div className="px-6 flex items-center justify-between relative z-10 mb-3">
            <div className="flex items-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">💸</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add an Expense</h2>
                <p className="text-sm text-white/90">
                  {steps[currentStep - 1]}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 relative z-10">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded transition-all duration-300 ${
                    index < currentStep ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2 shadow-sm"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50/50 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={
                isLoading || (balanceInfo ? !balanceInfo.isValid : false)
              }
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                "💸"
              )}
              Create Expense
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CreateExpensePopup;