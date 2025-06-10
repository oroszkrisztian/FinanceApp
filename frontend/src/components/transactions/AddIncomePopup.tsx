import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Search,
  ChevronDown,
  Info,
  AlertCircle,
  Tag,
  Plus,
} from "lucide-react";
import { Account } from "../../interfaces/Account";
import { useAuth } from "../../context/AuthContext";
import { TransactionType } from "../../interfaces/enums";
import {
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
  ExchangeRates,
  fetchExchangeRates,
} from "../../services/exchangeRateService";
import { addFundsDefaultAccount } from "../../services/transactionService";
import { CustomCategory } from "../../interfaces/CustomCategory";
import CreateCategoryModal from "../categories/CreateCategoryModal";

interface IncomeProps {
  onClose: () => void;
  isOpen: boolean;
  accounts: Account[];
  categories: CustomCategory[];
  accountsLoading: boolean;
  onSuccess: () => void;
  onCategoryCreated?: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

const SearchWithSuggestions: React.FC<{
  placeholder: string;
  onSearch: (term: string) => void;
  suggestions: string[];
  onSelect?: (suggestion: string) => void;
  value?: string;
  selectedItems?: string[];
  multiSelect?: boolean;
}> = ({
  placeholder,
  onSearch,
  suggestions,
  onSelect,
  value = "",
  selectedItems = [],
  multiSelect = false,
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
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-green-400"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-8 pr-3 py-2.5 text-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors shadow-sm bg-green-50/50"
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
              className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors ${
                selectedItems.includes(suggestion)
                  ? "bg-green-50 text-green-700"
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
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors hover:opacity-75 bg-green-100 text-green-700 hover:bg-green-200"
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

const AddIncomePopup: React.FC<IncomeProps> = ({
  onClose,
  isOpen,
  accounts,
  categories,
  accountsLoading,
  onSuccess,
  onCategoryCreated,
  currentStep: externalCurrentStep = 1,
  onStepChange,
}) => {
  const { user } = useAuth();
  const [internalCurrentStep, setInternalCurrentStep] = useState(1);
  const currentStep = onStepChange ? externalCurrentStep : internalCurrentStep;
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
    useState(false);
  const [localCategories, setLocalCategories] = useState(categories);

  const [formData, setFormData] = useState({
    amount: 0,
    name: "",
    description: "",
    selectedAccount: "",
    currency: "RON",
  });

  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

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

  const steps = ["Basic Info", "Account & Review"];

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
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
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
    .filter((cat) => selectedCategories.includes(cat.id))
    .map((cat) => cat.name);

  const resetForm = () => {
    handleStepChange(1);
    setFormData({
      amount: 0,
      name: "",
      description: "",
      selectedAccount: "",
      currency: "RON",
    });
    setAmountString("");
    setSelectedAccount(null);
    setAccountSearchTerm("");
    setSelectedCategories([]);
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
    if (canProceed() && currentStep < 2) {
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
    currentBalance: number;
    newBalance: number;
  } | null => {
    if (!selectedAccount || selectedAccount.amount === undefined) return null;

    const transactionAmount = getTransactionAmount();
    const currentBalance = selectedAccount.amount;
    const newBalance = currentBalance + transactionAmount;

    return {
      currentBalance,
      newBalance,
    };
  };

  const balanceInfo = selectedAccount ? calculateNewBalance() : null;

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError("User not found");
      setIsLoading(false);
      return;
    }
    if (!selectedAccount) {
      setError("No account selected");
      setIsLoading(false);
      return;
    }
    if (formData.amount <= 0) {
      setError("Invalid amount");
      setIsLoading(false);
      return;
    }

    try {
      const finalAmount = getTransactionAmount();
      await addFundsDefaultAccount(
        user.id,
        formData.name,
        formData.description,
        finalAmount,
        TransactionType.INCOME,
        selectedAccount.id,
        selectedCategories.length > 0 ? selectedCategories : null,
        selectedAccount.currency
      );
      onSuccess();
      handleClose();
      handleStepChange(1);
    } catch (error) {
      console.error("Failed to add income:", error);
      setError(error instanceof Error ? error.message : "Failed to add income");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            {/* Name Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-green-500 mr-1">🏷️</span>
                Income Name<span className="text-green-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2.5 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-green-50/50 shadow-sm text-sm"
                placeholder="Enter income name"
                required
              />
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <span className="text-green-500 mr-1">💰</span>
                  Amount<span className="text-green-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-green-400"
                  />
                  <input
                    type="text"
                    className="w-full pl-8 pr-3 py-2.5 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-green-50/50 shadow-sm font-medium text-sm"
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <div className="relative" ref={currencyRef}>
                  <button
                    type="button"
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    disabled={fetchingRates}
                    className="w-full p-2.5 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-left flex items-center justify-between bg-green-50/50 shadow-sm transition-all disabled:opacity-50 text-sm"
                  >
                    <span>
                      {fetchingRates ? "Loading..." : formData.currency}
                    </span>
                    <ChevronDown size={14} className="text-green-400" />
                  </button>

                  {isCurrencyOpen && !fetchingRates && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-28 overflow-y-auto"
                    >
                      {availableCurrencies.map((currency) => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => {
                            handleInputChange("currency", currency);
                            setIsCurrencyOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-green-50 transition-colors text-sm ${
                            formData.currency === currency
                              ? "bg-green-50 text-green-700"
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
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-green-500 mr-1">📝</span>
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2.5 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-green-50/50 shadow-sm text-sm"
                placeholder="Add income details"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Account Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-green-500 mr-1">💳</span>
                Select Account<span className="text-green-500">*</span>
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-11 bg-gray-200 rounded-xl"></div>
              ) : accounts.length === 0 ? (
                <div className="p-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
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
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-green-800 text-sm">
                            {selectedAccount.name}
                          </div>
                          <div className="text-xs text-green-600">
                            Balance: {selectedAccount.amount.toFixed(2)}{" "}
                            {selectedAccount.currency}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearAccountSelection}
                          className="text-green-500 hover:text-green-700 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Categories Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700 flex items-center">
                  <span className="text-green-500 mr-1">🏷️</span>
                  Categories (Optional)
                </label>
                <motion.button
                  type="button"
                  onClick={() => setIsCreateCategoryModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={12} />
                  Add
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

            {/* Preview Section */}
            {selectedAccount && (
              <div className="space-y-3">
                {/* Income Summary */}
                <div className="p-3 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-base mb-2 text-green-800">
                    {formData.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
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
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <span className="text-gray-600 text-xs">
                        Description:{" "}
                      </span>
                      <span className="text-xs text-gray-800">
                        {formData.description}
                      </span>
                    </div>
                  )}

                  {selectedCategories.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <span className="text-gray-600 text-xs">
                        Categories:{" "}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedCategoryNames.map((categoryName, index) => (
                          <span
                            key={index}
                            className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded"
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
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl shadow-sm">
                    <h3 className="font-bold text-green-700 mb-2 flex items-center text-sm">
                      <span className="mr-1">💰</span>
                      Transaction Summary
                    </h3>

                    {balanceInfo && (
                      <div className="bg-white rounded-lg border border-green-100 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 divide-y divide-green-50">
                          <div className="p-2 flex justify-between items-center">
                            <span className="text-xs text-gray-600">
                              Current Balance:
                            </span>
                            <span className="font-medium text-sm">
                              {balanceInfo.currentBalance.toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </span>
                          </div>
                          <div className="p-2 flex justify-between items-center">
                            <span className="text-xs text-gray-600">
                              Transaction:
                            </span>
                            <span className="text-green-500 font-medium text-sm">
                              +{getTransactionAmount().toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </span>
                          </div>
                          <div className="p-2 flex justify-between items-center bg-green-50/50">
                            <span className="text-xs font-medium text-gray-700">
                              New Balance:
                            </span>
                            <span className="font-bold text-sm">
                              {balanceInfo.newBalance.toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Currency Conversion Info */}
                    {formData.currency !== selectedAccount.currency &&
                      !conversionDetails.error &&
                      !fetchingRates && (
                        <div className="mt-2 text-xs">
                          <div className="flex items-center text-green-700 mb-1">
                            <Info size={12} className="mr-1" />
                            <span className="font-medium">
                              Currency Conversion
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="px-2 py-1 bg-white rounded-lg border border-green-200 text-green-900">
                              <p className="text-xs font-medium">
                                {formData.amount.toFixed(2)} {formData.currency}
                              </p>
                            </div>

                            <div className="flex items-center justify-center px-1">
                              <ArrowRight
                                size={12}
                                className="text-green-500"
                              />
                            </div>

                            <div className="px-2 py-1 bg-green-500 text-white rounded-lg shadow-md">
                              <p className="text-xs font-medium">
                                {conversionDetails.convertedAmount.toFixed(2)}{" "}
                                {selectedAccount.currency}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs mt-1 text-green-600 border-t border-green-100 pt-1">
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
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
        style={{
          width: isMobileView ? "90%" : "28rem",
          minHeight: "50vh",
          maxHeight: "90vh",
        }}
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 relative overflow-hidden">
          {/* Mobile-optimized background elements */}
          <div
            className={`absolute top-0 right-0 bg-white/20 rounded-full ${
              isMobileView
                ? "w-10 h-10 -translate-y-5 translate-x-5"
                : "w-12 h-12 -translate-y-6 translate-x-6"
            }`}
          ></div>
          <div
            className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${
              isMobileView
                ? "w-6 h-6 translate-y-3 -translate-x-3"
                : "w-8 h-8 translate-y-4 -translate-x-4"
            }`}
          ></div>
          <div
            className={`absolute bg-white/15 rounded-full ${
              isMobileView ? "top-1 left-12 w-4 h-4" : "top-1 left-14 w-6 h-6"
            }`}
          ></div>

          <div
            className={`${isMobileView ? "px-4 py-3" : "px-4 py-3"} flex items-center justify-between relative z-10 mb-2`}
          >
            <div className="flex items-center">
              <div
                className={`bg-white rounded-full flex items-center justify-center mr-3 shadow-lg ${isMobileView ? "w-8 h-8" : "w-10 h-10"}`}
              >
                <span className={isMobileView ? "text-base" : "text-lg"}>
                  💰
                </span>
              </div>
              <div>
                <h2
                  className={`font-bold text-white ${isMobileView ? "text-base" : "text-lg"}`}
                >
                  Add Income
                </h2>
                <p
                  className={`text-white/90 ${isMobileView ? "text-xs" : "text-sm"}`}
                >
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
              <X size={isMobileView ? 18 : 20} />
            </motion.button>
          </div>

          {/* Progress */}
          <div
            className={`${isMobileView ? "px-4 pb-3" : "px-4 pb-3"} relative z-10`}
          >
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
        <div
          className={`flex-1 overflow-y-auto ${isMobileView ? "p-3" : "p-4"}`}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 shadow-sm"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div
          className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 backdrop-blur-sm flex justify-between`}
        >
          <motion.button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            whileHover={{ scale: currentStep === 1 ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft size={14} />
            Back
          </motion.button>

          {currentStep < 2 ? (
            <motion.button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-sm"
              whileHover={{ scale: !canProceed() ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue
              <ArrowRight size={14} />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-sm"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
              ) : (
                "💰"
              )}
              Add Income
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
        userId={user?.id || 0}
      />
    </div>
  );
};

export default AddIncomePopup;
