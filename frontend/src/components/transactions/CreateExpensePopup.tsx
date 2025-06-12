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
  Plus,
  Brain,
  Sparkles,
  Check,
  Loader,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Account } from "../../interfaces/Account";
import { TransactionType } from "../../interfaces/enums";
import {
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
  ExchangeRates,
  fetchExchangeRates,
} from "../../services/exchangeRateService";
import { createExpense } from "../../services/transactionService";
import { useAuth } from "../../context/AuthContext";
import { CustomCategory } from "../../interfaces/CustomCategory";
import CreateCategoryModal from "../categories/CreateCategoryModal";

interface CreateExpensePopupProps {
  onClose: () => void;
  isOpen: boolean;
  accounts: Account[];
  accountsLoading: boolean;
  onSuccess: () => void;
  categories?: CustomCategory[];
  onCategoryCreated?: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

interface AIExistingCategorySuggestion {
  type: "existing";
  categoryId: number;
  categoryName: string;
  confidence: number;
  reason: string;
}

interface AINewCategorySuggestion {
  type: "new";
  categoryName: string;
  confidence: number;
  reason: string;
  description?: string;
}

type AICategorySuggestion =
  | AIExistingCategorySuggestion
  | AINewCategorySuggestion;

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
          className="w-full pl-8 pr-3 py-2.5 text-sm border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors shadow-sm bg-red-50/50"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-32 sm:max-h-40 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-3 py-2.5 sm:py-2 text-sm hover:bg-red-50 transition-colors ${
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
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedItems.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect && onSelect(item)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-colors hover:opacity-75 bg-red-100 text-red-700 hover:bg-red-200 min-h-[32px] touch-manipulation"
            >
              <Tag size={10} />
              <span className="max-w-[100px] truncate">{item}</span>
              <X size={10} className="ml-1 flex-shrink-0" />
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
  accountsLoading,
  onSuccess,
  categories = [],
  onCategoryCreated,
  currentStep: externalCurrentStep = 1,
  onStepChange,
}) => {
  const { token } = useAuth();
  const [internalCurrentStep, setInternalCurrentStep] = useState(1);
  const currentStep = onStepChange ? externalCurrentStep : internalCurrentStep;
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    selectedAccount: string;
    amount: number;
    currency: string;
    type: TransactionType;
    selectedCategories: number[];
  }>({
    name: "",
    description: "",
    selectedAccount: "",
    amount: 0,
    currency: "RON",
    type: TransactionType.EXPENSE,
    selectedCategories: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
    useState(false);
  const [localCategories, setLocalCategories] = useState(categories);

  const [aiSuggestions, setAiSuggestions] = useState<AICategorySuggestion[]>(
    []
  );
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [aiSuggestionsError, setAiSuggestionsError] = useState<string | null>(
    null
  );
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  const [suggestionsAccepted, setSuggestionsAccepted] = useState(false);
  const [hasTriggeredSuggestions, setHasTriggeredSuggestions] = useState(false);
  const [creatingCategories, setCreatingCategories] = useState<string[]>([]);

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

  const steps = ["Basic Info", "Categories", "Account & Review"];

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    console.log("Checking AI suggestions trigger:", {
      currentStep,
      showAiSuggestions,
      hasTriggeredSuggestions,
      name: formData.name,
      nameValid: formData.name.trim(),
      amount: formData.amount,
      amountValid: formData.amount > 0,
      token: !!token,
    });
    if (
      currentStep === 2 &&
      showAiSuggestions &&
      !hasTriggeredSuggestions &&
      formData.name.trim() &&
      formData.amount > 0 &&
      token
    ) {
      console.log("🚀 Triggering AI suggestions for expense...");
      fetchAICategorySuggestions();
    }
  }, [
    currentStep,
    formData.name,
    formData.amount,
    showAiSuggestions,
    hasTriggeredSuggestions,
    token,
  ]);

  const createNewCategory = async (categoryName: string) => {
    try {
      setCreatingCategories((prev) => [...prev, categoryName]);

      const response = await fetch(
        "https://financeapp-bg0k.onrender.com/categories/createUserCategory",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            categoryName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      const result = await response.json();

      const newCategory = {
        id: result.id || Date.now(),
        name: categoryName,
      } as CustomCategory;
      setLocalCategories((prev) => [...prev, newCategory]);

      setFormData((prev) => ({
        ...prev,
        selectedCategories: [...prev.selectedCategories, newCategory.id],
      }));

      if (onCategoryCreated) {
        await onCategoryCreated();
      }

      console.log("✅ Category created successfully:", categoryName);
      return result;
    } catch (error) {
      console.error("❌ Error creating category:", error);
      throw error;
    } finally {
      setCreatingCategories((prev) =>
        prev.filter((name) => name !== categoryName)
      );
    }
  };

  const fetchAICategorySuggestions = async () => {
    if (!formData.name || !formData.amount || !token) {
      return;
    }

    setAiSuggestionsLoading(true);
    setAiSuggestionsError(null);

    try {
      console.log(
        "🤖 Fetching enhanced AI category suggestions for expense..."
      );

      const response = await fetch(
        "https://financeapp-bg0k.onrender.com/ai/aiCategorySuggestion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentName: formData.name,
            paymentAmount: formData.amount,
            paymentType: "EXPENSE",
            currency: formData.currency,
            description: formData.description || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.suggestions && Array.isArray(data.suggestions)) {
        console.log("✅ Received enhanced AI suggestions:", data.suggestions);
        setAiSuggestions(data.suggestions);
        setHasTriggeredSuggestions(true);
      } else {
        throw new Error(data.error || "Failed to get AI suggestions");
      }
    } catch (error) {
      console.error("❌ Error fetching enhanced AI suggestions:", error);
      setAiSuggestionsError("Failed to get AI suggestions. Please try again.");
      setHasTriggeredSuggestions(true);
    } finally {
      setAiSuggestionsLoading(false);
    }
  };

  const acceptAISuggestion = async (suggestion: AICategorySuggestion) => {
    try {
      if (suggestion.type === "existing") {
        if (!formData.selectedCategories.includes(suggestion.categoryId)) {
          setFormData((prev) => ({
            ...prev,
            selectedCategories: [
              ...prev.selectedCategories,
              suggestion.categoryId,
            ],
          }));
        }
      } else if (suggestion.type === "new") {
        await createNewCategory(suggestion.categoryName);
      }
    } catch (error) {
      console.error("Error accepting suggestion:", error);
      setAiSuggestionsError("Failed to process suggestion. Please try again.");
    }
  };

  const acceptAllAISuggestions = async () => {
    try {
      for (const suggestion of aiSuggestions) {
        if (suggestion.type === "existing") {
          if (!formData.selectedCategories.includes(suggestion.categoryId)) {
            setFormData((prev) => ({
              ...prev,
              selectedCategories: [
                ...prev.selectedCategories,
                suggestion.categoryId,
              ],
            }));
          }
        } else if (suggestion.type === "new") {
          await createNewCategory(suggestion.categoryName);
        }
      }
      setSuggestionsAccepted(true);
    } catch (error) {
      console.error("Error accepting all suggestions:", error);
      setAiSuggestionsError(
        "Failed to process some suggestions. Please try individually."
      );
    }
  };

  const retryAISuggestions = () => {
    setHasTriggeredSuggestions(false);
    setAiSuggestions([]);
    setAiSuggestionsError(null);
    fetchAICategorySuggestions();
  };

  const dismissAISuggestions = () => {
    setShowAiSuggestions(false);
    setSuggestionsAccepted(true);
  };

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

  const handleCategoryToggle = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((id) => id !== categoryId)
        : [...prev.selectedCategories, categoryId],
    }));
  };

  const handleCategorySelect = (categoryName: string) => {
    const selectedCategory = localCategories.find(
      (cat) => cat.name === categoryName
    );
    if (selectedCategory) {
      handleCategoryToggle(selectedCategory.id);
    }
  };

  const handleCategoryCreated = async () => {
    try {
      setIsCreateCategoryModalOpen(false);
      if (onCategoryCreated) {
        await onCategoryCreated();
      }
      console.log("Category created and categories refreshed");
    } catch (error) {
      console.error("Error handling category creation:", error);
    }
  };

  const filteredCategories = localCategories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const categorySuggestions = filteredCategories.map((cat) => cat.name);
  const selectedCategoryNames = localCategories
    .filter((cat) => formData.selectedCategories.includes(cat.id))
    .map((cat) => cat.name);

  const resetForm = () => {
    handleStepChange(1);
    setFormData({
      name: "",
      description: "",
      selectedAccount: "",
      amount: 0,
      currency: "RON",
      type: TransactionType.EXPENSE,
      selectedCategories: [],
    });
    setAmountString("");
    setSelectedAccount(null);
    setAccountSearchTerm("");
    setCategorySearchTerm("");
    setConversionDetails({
      originalAmount: 0,
      convertedAmount: 0,
      rate: 1,
      error: null,
    });
    setError(null);
    // Reset AI suggestions state
    setShowAiSuggestions(true);
    setHasTriggeredSuggestions(false);
    setAiSuggestions([]);
    setAiSuggestionsError(null);
    setSuggestionsAccepted(false);
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

    // Reset AI suggestions if payment details change
    if (field === "name" || field === "amount") {
      setHasTriggeredSuggestions(false);
      setAiSuggestions([]);
      setAiSuggestionsError(null);
    }
  };

  const handleAccountSelect = (accountName: string) => {
    const account = accounts.find((acc) => acc.name === accountName);
    if (account) {
      setSelectedAccount(account);
      setFormData((prev) => ({ ...prev, selectedAccount: String(account.id) }));
      setAccountSearchTerm("");
    }
  };

  const clearAccountSelection = () => {
    setSelectedAccount(null);
    setFormData((prev) => ({ ...prev, selectedAccount: "" }));
    setAccountSearchTerm("");
  };

  const accountSuggestions = accounts
    .filter((acc) =>
      acc.name.toLowerCase().includes(accountSearchTerm.toLowerCase())
    )
    .map((acc) => acc.name);

  const getAvailableCurrencies = () => {
    if (Object.keys(rates).length === 0) {
      return ["USD", "EUR", "GBP", "JPY", "RON"];
    }

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

    const allAvailableCurrencies = Object.keys(rates);

    const prioritizedCurrencies = topCurrencies.filter((curr) => rates[curr]);

    if (
      !prioritizedCurrencies.includes(currentCurrency) &&
      rates[currentCurrency]
    ) {
      prioritizedCurrencies.unshift(currentCurrency);
    }

    const remainingCurrencies = allAvailableCurrencies
      .filter((curr) => !prioritizedCurrencies.includes(curr))
      .sort();

    return [...prioritizedCurrencies, ...remainingCurrencies];
  };

  const availableCurrencies = getAvailableCurrencies();

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.amount > 0;
      case 2:
        return true; // Categories are optional
      case 3:
        return formData.selectedAccount;
      default:
        return false;
    }
  };

  const handleStepChange = (newStep: number) => {
    if (onStepChange) {
      onStepChange(newStep);
    } else {
      setInternalCurrentStep(newStep);
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 3) {
      handleStepChange(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      handleStepChange(currentStep - 1);
    }
  };

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

    try {
      await createExpense(
        formData.name,
        formData.amount,
        formData.currency,
        parseInt(formData.selectedAccount),
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
          <div className="space-y-4 sm:space-y-3">
            {/* Name Field */}
            <div>
              <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1 flex items-center">
                <span className="text-red-500 mr-1">🏷️</span>
                Expense Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-4 sm:px-3 py-3 sm:py-2.5 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-red-50/50 shadow-sm text-base sm:text-sm"
                placeholder="Enter expense name"
                required
              />
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2">
              <div className="sm:col-span-1">
                <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1 flex items-center">
                  <span className="text-red-500 mr-1">💰</span>
                  Amount<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 sm:left-2.5 top-1/2 transform -translate-y-1/2 text-red-400"
                  />
                  <input
                    type="text"
                    className="w-full pl-10 sm:pl-8 pr-4 sm:pr-3 py-3 sm:py-2.5 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-red-50/50 shadow-sm font-medium text-base sm:text-sm"
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

              <div className="sm:col-span-1">
                <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1">
                  Currency
                </label>
                <div className="relative" ref={currencyRef}>
                  <button
                    type="button"
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    disabled={fetchingRates}
                    className="w-full p-3 sm:p-2.5 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-left flex items-center justify-between bg-red-50/50 shadow-sm transition-all disabled:opacity-50 text-base sm:text-sm touch-manipulation"
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
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-32 sm:max-h-28 overflow-y-auto"
                    >
                      {availableCurrencies.map((currency) => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => {
                            handleInputChange("currency", currency);
                            setIsCurrencyOpen(false);
                          }}
                          className={`w-full text-left px-4 sm:px-3 py-3 sm:py-2 hover:bg-red-50 transition-colors text-base sm:text-sm touch-manipulation ${
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
              <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1 flex items-center">
                <span className="text-red-500 mr-1">📝</span>
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full px-4 sm:px-3 py-3 sm:py-2.5 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-red-50/50 shadow-sm text-base sm:text-sm resize-none"
                placeholder="Add expense details"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 sm:space-y-4">
            {/* Categories Selection - TOP */}
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-1">
                <label className="block text-sm sm:text-xs font-medium text-gray-700 flex items-center">
                  <span className="text-red-500 mr-1">🏷️</span>
                  Categories (Optional)
                </label>
                <motion.button
                  type="button"
                  onClick={() => setIsCreateCategoryModalOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-1 px-3 py-2 sm:px-2 sm:py-1 bg-red-600 text-white text-sm sm:text-xs rounded-lg hover:bg-red-700 transition-colors shadow-sm touch-manipulation"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={14} className="sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Add</span>
                </motion.button>
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

            {/* AI Category Suggestions - BOTTOM */}
            {showAiSuggestions && (
              <div className="space-y-4 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain
                      size={18}
                      className="text-purple-600 sm:w-4 sm:h-4"
                    />
                    <label className="text-base sm:text-sm font-medium text-gray-700">
                      AI Suggestions
                    </label>
                  </div>
                  {aiSuggestions.length > 0 && (
                    <button
                      type="button"
                      onClick={retryAISuggestions}
                      className="flex items-center gap-1 px-3 py-2 sm:px-2 sm:py-1 text-sm sm:text-xs text-gray-500 hover:text-gray-700 transition-colors touch-manipulation"
                      title="Get new suggestions"
                    >
                      <RefreshCw size={14} className="sm:w-3 sm:h-3" />
                      Refresh
                    </button>
                  )}
                </div>

                {aiSuggestionsLoading && (
                  <div className="flex items-center justify-center p-5 sm:p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <Loader
                      className="animate-spin text-purple-600 mr-3 sm:mr-2"
                      size={20}
                    />
                    <span className="text-base sm:text-sm text-purple-700">
                      AI is analyzing your expense for the best categories...
                    </span>
                  </div>
                )}

                {aiSuggestionsError && (
                  <div className="p-4 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle
                          size={16}
                          className="text-red-600 flex-shrink-0"
                        />
                        <span className="text-sm text-red-700">
                          {aiSuggestionsError}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={retryAISuggestions}
                        className="text-sm text-red-600 hover:text-red-800 underline self-start sm:self-auto touch-manipulation"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {aiSuggestions.length > 0 && !aiSuggestionsLoading && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-3 gap-3 sm:gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles
                          size={16}
                          className="text-purple-600 flex-shrink-0"
                        />
                        <span className="text-base sm:text-sm font-medium text-purple-800">
                          Suggested for "{formData.name}"
                        </span>
                      </div>
                      <div className="flex gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={acceptAllAISuggestions}
                          disabled={creatingCategories.length > 0}
                          className="px-4 py-2 sm:px-3 sm:py-1 bg-purple-600 text-white text-sm sm:text-xs rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5 sm:gap-1 disabled:opacity-50 touch-manipulation"
                        >
                          <ThumbsUp size={14} className="sm:w-3 sm:h-3" />
                          <span className="hidden sm:inline">Accept All</span>
                        </button>
                        <button
                          type="button"
                          onClick={dismissAISuggestions}
                          className="px-4 py-2 sm:px-3 sm:py-1 bg-white text-red-600 text-sm sm:text-xs rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 sm:gap-1 touch-manipulation"
                        >
                          <ThumbsDown size={14} className="sm:w-3 sm:h-3" />
                          <span className="hidden sm:inline">Skip</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-2">
                      {aiSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={`${suggestion.type}-${suggestion.categoryName}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 sm:p-3 bg-white rounded-lg border border-purple-100 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2 sm:mb-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 min-w-0 flex-1">
                              <span className="text-base sm:text-sm font-medium text-gray-800 truncate">
                                {suggestion.categoryName}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 sm:px-1.5 sm:py-0.5 rounded-full self-start sm:self-auto ${
                                  suggestion.type === "new"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {suggestion.type === "new" ? "New" : "Existing"}{" "}
                                • {Math.round(suggestion.confidence * 100)}%
                                match
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => acceptAISuggestion(suggestion)}
                              disabled={
                                (suggestion.type === "existing" &&
                                  formData.selectedCategories.includes(
                                    suggestion.categoryId
                                  )) ||
                                (suggestion.type === "new" &&
                                  creatingCategories.includes(
                                    suggestion.categoryName
                                  )) ||
                                (suggestion.type === "new" &&
                                  localCategories.some(
                                    (cat) =>
                                      cat.name.toLowerCase() ===
                                      suggestion.categoryName.toLowerCase()
                                  ))
                              }
                              className={`w-10 h-10 sm:w-8 sm:h-8 rounded-lg text-sm sm:text-xs transition-colors touch-manipulation flex-shrink-0 flex items-center justify-center ${
                                (suggestion.type === "existing" &&
                                  formData.selectedCategories.includes(
                                    suggestion.categoryId
                                  )) ||
                                (suggestion.type === "new" &&
                                  localCategories.some(
                                    (cat) =>
                                      cat.name.toLowerCase() ===
                                      suggestion.categoryName.toLowerCase()
                                  ))
                                  ? "bg-green-100 text-green-700 cursor-default"
                                  : creatingCategories.includes(
                                        suggestion.categoryName
                                      )
                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                    : suggestion.type === "new"
                                      ? "bg-green-600 text-white hover:bg-green-700"
                                      : "bg-purple-600 text-white hover:bg-purple-700"
                              }`}
                            >
                              {(suggestion.type === "existing" &&
                                formData.selectedCategories.includes(
                                  suggestion.categoryId
                                )) ||
                              (suggestion.type === "new" &&
                                localCategories.some(
                                  (cat) =>
                                    cat.name.toLowerCase() ===
                                    suggestion.categoryName.toLowerCase()
                                )) ? (
                                <Check size={16} className="sm:w-3 sm:h-3" />
                              ) : creatingCategories.includes(
                                  suggestion.categoryName
                                ) ? (
                                <Loader
                                  size={16}
                                  className="animate-spin sm:w-3 sm:h-3"
                                />
                              ) : (
                                <Plus size={16} className="sm:w-3 sm:h-3" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm sm:text-xs text-gray-600 leading-relaxed">
                            {suggestion.reason}
                          </p>
                          {suggestion.type === "new" &&
                            suggestion.description && (
                              <p className="text-sm sm:text-xs text-gray-500 mt-2 sm:mt-1 italic leading-relaxed">
                                {suggestion.description}
                              </p>
                            )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {!aiSuggestionsLoading &&
                  !aiSuggestionsError &&
                  aiSuggestions.length === 0 &&
                  hasTriggeredSuggestions && (
                    <div className="p-4 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                      <p className="text-base sm:text-sm text-gray-600">
                        No specific category suggestions found. Please select
                        categories manually.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 sm:space-y-4">
            {/* Account Selection */}
            <div>
              <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-3 sm:mb-1 flex items-center">
                <span className="text-red-500 mr-1">💳</span>
                Select Account<span className="text-red-500">*</span>
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-12 sm:h-11 bg-gray-200 rounded-xl"></div>
              ) : accounts.length === 0 ? (
                <div className="p-4 sm:p-3 text-sm sm:text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
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
                    <div className="mt-3 sm:mt-2 p-3 sm:p-2 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-red-800 text-base sm:text-sm truncate">
                            {selectedAccount.name}
                          </div>
                          <div className="text-sm sm:text-xs text-red-600">
                            Balance: {selectedAccount.amount.toFixed(2)}{" "}
                            {selectedAccount.currency}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearAccountSelection}
                          className="text-red-500 hover:text-red-700 transition-colors p-1 touch-manipulation"
                        >
                          <X size={16} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Preview Section */}
            {selectedAccount && (
              <div className="space-y-4 sm:space-y-3">
                {/* Expense Summary */}
                <div className="p-4 sm:p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-lg sm:text-base mb-3 sm:mb-2 text-red-800">
                    {formData.name}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 text-sm sm:text-xs">
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
                  </div>

                  {formData.description && (
                    <div className="mt-3 sm:mt-2 pt-3 sm:pt-2 border-t border-red-200">
                      <span className="text-gray-600 text-sm sm:text-xs">
                        Description:{" "}
                      </span>
                      <span className="text-sm sm:text-xs text-gray-800">
                        {formData.description}
                      </span>
                    </div>
                  )}

                  {formData.selectedCategories.length > 0 && (
                    <div className="mt-3 sm:mt-2 pt-3 sm:pt-2 border-t border-red-200">
                      <span className="text-gray-600 text-sm sm:text-xs">
                        Categories:{" "}
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-1 mt-2 sm:mt-1">
                        {selectedCategoryNames.map((categoryName, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 sm:px-1.5 sm:py-0.5 bg-red-100 text-red-700 text-sm sm:text-xs rounded"
                          >
                            {categoryName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Transaction Summary */}
                {formData.amount > 0 && (
                  <div className="p-4 sm:p-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-xl shadow-sm">
                    <h3 className="font-bold text-red-700 mb-3 sm:mb-2 flex items-center text-base sm:text-sm">
                      <span className="mr-1">💰</span>
                      Transaction Summary
                    </h3>

                    {balanceInfo && !balanceInfo.isValid ? (
                      <div className="p-3 sm:p-2 bg-red-100 rounded-lg border border-red-200">
                        <div className="flex items-center text-red-600 font-medium mb-2 sm:mb-1">
                          <AlertCircle
                            size={16}
                            className="mr-2 flex-shrink-0"
                          />
                          Insufficient funds
                        </div>
                        <div className="bg-white p-3 sm:p-2 rounded-lg border border-red-100">
                          <p className="text-sm sm:text-xs text-gray-700">
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
                          <div className="p-3 sm:p-2 flex justify-between items-center">
                            <span className="text-sm sm:text-xs text-gray-600">
                              Current Balance:
                            </span>
                            <span className="font-medium text-base sm:text-sm">
                              {balanceInfo.currentBalance.toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </span>
                          </div>
                          <div className="p-3 sm:p-2 flex justify-between items-center">
                            <span className="text-sm sm:text-xs text-gray-600">
                              Transaction:
                            </span>
                            <span className="text-red-500 font-medium text-base sm:text-sm">
                              -{balanceInfo.transactionAmount.toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </span>
                          </div>
                          <div className="p-3 sm:p-2 flex justify-between items-center bg-red-50/50">
                            <span className="text-sm sm:text-xs font-medium text-gray-700">
                              New Balance:
                            </span>
                            <span className="font-bold text-base sm:text-sm">
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
                        <div className="mt-3 sm:mt-2 text-sm sm:text-xs">
                          <div className="flex items-center text-red-700 mb-2 sm:mb-1">
                            <Info size={14} className="mr-1 flex-shrink-0" />
                            <span className="font-medium">
                              Currency Conversion
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="px-3 py-2 sm:px-2 sm:py-1 bg-white rounded-lg border border-red-200 text-red-900 text-center">
                              <p className="text-sm sm:text-xs font-medium">
                                {formData.amount.toFixed(2)} {formData.currency}
                              </p>
                            </div>

                            <div className="flex items-center justify-center px-2 sm:px-1">
                              <ArrowRight
                                size={14}
                                className="text-red-500 flex-shrink-0"
                              />
                            </div>

                            <div className="px-3 py-2 sm:px-2 sm:py-1 bg-red-500 text-white rounded-lg shadow-md text-center">
                              <p className="text-sm sm:text-xs font-medium">
                                {conversionDetails.convertedAmount.toFixed(2)}{" "}
                                {selectedAccount.currency}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm sm:text-xs mt-2 sm:mt-1 text-red-600 border-t border-red-100 pt-2 sm:pt-1">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 " onClick={handleClose} />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 w-full max-w-md mx-auto"
        style={{
          minHeight: isMobileView ? "60vh" : "50vh",
          maxHeight: isMobileView ? "80vh" : "85vh",
        }}
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 relative overflow-hidden flex-shrink-0">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 bg-white/20 rounded-full w-16 h-16 sm:w-12 sm:h-12 -translate-y-8 translate-x-8 sm:-translate-y-6 sm:translate-x-6"></div>
          <div className="absolute bottom-0 left-0 bg-white/10 rounded-full w-10 h-10 sm:w-8 sm:h-8 translate-y-5 -translate-x-5 sm:translate-y-4 sm:-translate-x-4"></div>
          <div className="absolute bg-white/15 rounded-full w-8 h-8 sm:w-6 sm:h-6 top-2 left-20 sm:top-1 sm:left-14"></div>

          <div className="relative z-10 px-5 py-4 sm:px-4 sm:py-3 flex items-center justify-between mb-3 sm:mb-2">
            <div className="flex items-center min-w-0">
              <div className="bg-white rounded-full flex items-center justify-center mr-3 shadow-lg w-10 h-10 sm:w-8 sm:h-8">
                <span className="text-lg sm:text-base">💸</span>
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-white text-lg sm:text-base truncate">
                  Add an Expense
                </h2>
                <p className="text-white/90 text-sm sm:text-xs truncate">
                  {steps[currentStep - 1]}
                </p>
              </div>
            </div>

            <motion.button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-2 sm:p-1 touch-manipulation"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} className="sm:w-5 sm:h-5" />
            </motion.button>
          </div>

          {/* Progress */}
          <div className="relative z-10 px-5 pb-4 sm:px-4 sm:pb-3">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 sm:h-1 flex-1 rounded transition-all duration-300 ${
                    index < currentStep ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-4 sm:py-3 min-h-0">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-3 p-3 sm:p-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm sm:text-xs flex items-center gap-2 shadow-sm"
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50/50 backdrop-blur-sm flex justify-between px-5 py-4 sm:px-4 sm:py-3 flex-shrink-0">
          <motion.button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 sm:gap-1 px-4 py-3 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base sm:text-sm touch-manipulation"
            whileHover={{ scale: currentStep === 1 ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft size={16} className="sm:w-4 sm:h-4" />
            Back
          </motion.button>

          {currentStep < 3 ? (
            <motion.button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2 sm:gap-1 px-6 py-3 sm:px-4 sm:py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-base sm:text-sm touch-manipulation"
              whileHover={{ scale: !canProceed() ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue
              <ArrowRight size={16} className="sm:w-4 sm:h-4" />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              disabled={
                isLoading || (balanceInfo ? !balanceInfo.isValid : false)
              }
              className="flex items-center gap-2 sm:gap-1 px-6 py-3 sm:px-4 sm:py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-base sm:text-sm touch-manipulation"
              whileHover={{
                scale:
                  isLoading || (balanceInfo && !balanceInfo.isValid) ? 1 : 1.02,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                "💸"
              )}
              Create Expense
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
      />
    </div>
  );
};

export default CreateExpensePopup;
