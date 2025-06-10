import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Calendar,
  DollarSign,
  Tag,
  Bell,
  Zap,
  Info,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Search,
  Edit,
  Brain,
  Sparkles,
  Check,
  Loader,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import { CurrencyType, Frequency, PaymentType } from "../../interfaces/enums";
import { createPayment } from "../../services/paymentService";
import CreateCategoryModal from "../categories/CreateCategoryModal";
import { useAuth } from "../../context/AuthContext";

interface CreatePaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCategoryCreated?: () => void;
  userId: number;
  accounts: Array<{
    id: number;
    name: string;
    currency: CurrencyType;
    amount: number;
  }>;
  categories: Array<{ id: number; name: string }>;
  defaultType?: PaymentType;
  budgets?: Array<{
    id: number;
    name: string;
    limitAmount: number;
    currency: string;
    categoryIds: number[];
  }>;
  editPayment?: {
    id: number;
    name: string;
    amount: number;
    frequency: string;
    nextExecution: string;
    currency: string;
    category: string;
    categories?: string[];
    account: string;
    isDue: boolean;
    type?: PaymentType;
    description?: string;
    emailNotification?: boolean;
    automaticPayment?: boolean;
  } | null;
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
  variant: "income" | "expense";
  onSelect?: (suggestion: string) => void;
  selectedItems?: string[];
  multiSelect?: boolean;
}> = ({
  placeholder,
  onSearch,
  suggestions,
  variant,
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

  const baseClasses =
    "w-full pl-8 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:border-transparent transition-colors shadow-sm";
  const variantClasses =
    variant === "expense"
      ? "border-red-200 focus:ring-red-500 bg-red-50/50"
      : "border-green-200 focus:ring-green-500 bg-green-50/50";

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search
          size={14}
          className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 ${variant === "expense" ? "text-red-400" : "text-green-400"}`}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className={`${baseClasses} ${variantClasses}`}
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
                  ? variant === "expense"
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
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
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors hover:opacity-75 ${
                variant === "expense"
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
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

const CreatePaymentPopup: React.FC<CreatePaymentPopupProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onCategoryCreated,
  userId,
  accounts,
  categories,
  defaultType = PaymentType.EXPENSE,
  budgets = [],
  editPayment = null,
  currentStep: externalCurrentStep = 1,
  onStepChange,
}) => {
  const { token } = useAuth();
  const [internalCurrentStep, setInternalCurrentStep] = useState(1);
  const currentStep = onStepChange ? externalCurrentStep : internalCurrentStep;

  const [isMobileView, setIsMobileView] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    description: "",
    accountId: "",
    frequency: Frequency.MONTHLY,
    emailNotification: false,
    notificationDay: 0,
    automaticPayment: false,
    type: defaultType,
    currency: CurrencyType.RON,
    categoriesId: [] as number[],
    startDate: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [originalCurrency, setOriginalCurrency] = useState<string>("");
  const currencyRef = useRef<HTMLDivElement>(null);

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

  const steps = [
    "Basic Info",
    "Timing",
    "Account & Categories",
    "Settings",
    "Review",
  ];

  const [isNotificationDayOpen, setIsNotificationDayOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const getThemeColors = () => {
    if (defaultType === PaymentType.EXPENSE) {
      return {
        gradient: "bg-gradient-to-r from-red-600 to-red-800",
        editButtonBg: "bg-gradient-to-r from-blue-600 to-blue-700",
        createButtonBg: "bg-gradient-to-r from-red-600 to-red-700",
      };
    } else {
      return {
        gradient: "bg-gradient-to-r from-green-600 to-green-800",
        editButtonBg: "bg-gradient-to-r from-blue-600 to-blue-700",
        createButtonBg: "bg-gradient-to-r from-green-600 to-green-700",
      };
    }
  };

  const theme = getThemeColors();

  const handleStepChange = (newStep: number) => {
    if (onStepChange) {
      onStepChange(newStep);
    } else {
      setInternalCurrentStep(newStep);
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

  const createNewCategory = async (categoryName: string) => {
    try {
      setCreatingCategories((prev) => [...prev, categoryName]);

      const response = await fetch(
        "http://localhost:3000/categories/createUserCategory",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            categoryName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      const result = await response.json();

      const newCategory = { id: result.id || Date.now(), name: categoryName };
      setLocalCategories((prev) => [...prev, newCategory]);

      setFormData((prev) => ({
        ...prev,
        categoriesId: [...prev.categoriesId, newCategory.id],
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
      console.log("🤖 Fetching enhanced AI category suggestions...");

      const response = await fetch(
        "http://localhost:3000/ai/aiCategorySuggestion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            paymentName: formData.name,
            paymentAmount: parseFloat(formData.amount),
            paymentType: formData.type,
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
        if (!formData.categoriesId.includes(suggestion.categoryId)) {
          setFormData((prev) => ({
            ...prev,
            categoriesId: [...prev.categoriesId, suggestion.categoryId],
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
          if (!formData.categoriesId.includes(suggestion.categoryId)) {
            setFormData((prev) => ({
              ...prev,
              categoriesId: [...prev.categoriesId, suggestion.categoryId],
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
    console.log("Checking AI suggestions trigger:", {
      currentStep,
      isEditMode,
      showAiSuggestions,
      hasTriggeredSuggestions,
      name: formData.name,
      nameValid: formData.name.trim(),
      amount: formData.amount,
      amountValid: parseFloat(formData.amount) > 0,
    });
    if (
      currentStep === 3 &&
      !isEditMode &&
      showAiSuggestions &&
      !hasTriggeredSuggestions &&
      formData.name.trim() &&
      formData.amount &&
      parseFloat(formData.amount) > 0
    ) {
      console.log("🚀 Triggering AI suggestions...");
      fetchAICategorySuggestions();
    }
  }, [
    currentStep,
    formData.name,
    formData.amount,
    isEditMode,
    showAiSuggestions,
    hasTriggeredSuggestions,
  ]);

  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const ratesData = await fetchExchangeRates();
        setRates(ratesData);
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
      }
    };
    loadExchangeRates();
  }, []);

  useEffect(() => {
    if (editPayment && isOpen) {
      setIsEditMode(true);

      const account = accounts.find((acc) => acc.name === editPayment.account);

      const categoryIds =
        editPayment.categories && editPayment.categories.length > 0
          ? localCategories
              .filter((cat) => editPayment.categories!.includes(cat.name))
              .map((cat) => cat.id)
          : localCategories
              .filter((cat) => cat.name === editPayment.category)
              .map((cat) => cat.id);

      setOriginalCurrency(editPayment.currency);

      setFormData({
        name: editPayment.name,
        amount: editPayment.amount.toString(),
        description: editPayment.description || "",
        accountId: account ? account.id.toString() : "",
        frequency: editPayment.frequency.toUpperCase() as Frequency,
        emailNotification: editPayment.emailNotification || false,
        notificationDay: 0,
        automaticPayment: editPayment.automaticPayment || false,
        type: editPayment.type || defaultType,
        currency: editPayment.currency as CurrencyType,
        categoriesId: categoryIds,
        startDate:
          editPayment.nextExecution || new Date().toISOString().split("T")[0],
      });
    }
  }, [editPayment, isOpen, accounts, localCategories, defaultType]);

  const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    if (fromCurrency === toCurrency || Object.keys(rates).length === 0) {
      return amount;
    }
    try {
      if (
        !Object.values(CurrencyType).includes(fromCurrency as CurrencyType) ||
        !Object.values(CurrencyType).includes(toCurrency as CurrencyType)
      ) {
        console.error("Invalid currency type");
        return amount;
      }

      const validation = validateCurrencyConversion(
        fromCurrency as CurrencyType,
        toCurrency as CurrencyType,
        rates
      );
      if (!validation.valid) {
        console.error(validation.error);
        return amount;
      }
      return convertAmount(amount, fromCurrency, toCurrency, rates);
    } catch (err) {
      console.error("Conversion error:", err);
      return amount;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationDayOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData((prev) => ({
        ...prev,
        accountId: accounts[0].id.toString(),
        currency: accounts[0].currency,
      }));
    }
  }, [accounts]);

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

  const calculateNextPayments = () => {
    const dates = [];
    let current = new Date(formData.startDate);

    for (let i = 0; i < 3; i++) {
      dates.push(new Date(current));

      switch (formData.frequency) {
        case Frequency.WEEKLY:
          current.setDate(current.getDate() + 7);
          break;
        case Frequency.BIWEEKLY:
          current.setDate(current.getDate() + 14);
          break;
        case Frequency.MONTHLY:
          current.setMonth(current.getMonth() + 1);
          break;
        case Frequency.QUARTERLY:
          current.setMonth(current.getMonth() + 3);
          break;
        case Frequency.YEARLY:
          current.setFullYear(current.getFullYear() + 1);
          break;
        case Frequency.DAILY:
          current.setDate(current.getDate() + 1);
          break;
        case Frequency.ONCE:
          return dates;
        case Frequency.CUSTOM:
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    return dates;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);

    if ((field === "name" || field === "amount") && !isEditMode) {
      setHasTriggeredSuggestions(false);
      setAiSuggestions([]);
      setAiSuggestionsError(null);
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoriesId: prev.categoriesId.includes(categoryId)
        ? prev.categoriesId.filter((id) => id !== categoryId)
        : [...prev.categoriesId, categoryId],
    }));
  };

  const handleAccountSelect = (accountName: string) => {
    const selectedAccount = accounts.find((acc) => acc.name === accountName);
    if (selectedAccount) {
      setFormData((prev) => ({
        ...prev,
        accountId: selectedAccount.id.toString(),
        currency: selectedAccount.currency,
      }));
    }
  };

  const handleCategorySelect = (categoryName: string) => {
    const selectedCategory = localCategories.find(
      (cat) => cat.name === categoryName
    );
    if (selectedCategory) {
      handleCategoryToggle(selectedCategory.id);
    }
  };

  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(accountSearchTerm.toLowerCase())
  );

  const filteredCategories = localCategories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const accountSuggestions = filteredAccounts.map((acc) => acc.name);
  const categorySuggestions = filteredCategories.map((cat) => cat.name);
  const selectedCategoryNames = localCategories
    .filter((cat) => formData.categoriesId.includes(cat.id))
    .map((cat) => cat.name);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.name && formData.amount && parseFloat(formData.amount) > 0
        );
      case 2:
        return formData.startDate && formData.frequency;
      case 3:
        return formData.accountId;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 5) {
      handleStepChange(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await createPayment({
        userId,
        name: formData.name,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        accountId: parseInt(formData.accountId),
        startDate: new Date(formData.startDate),
        frequency: formData.frequency,
        emailNotification: formData.emailNotification,
        notificationDay: formData.notificationDay || 0,
        automaticPayment: formData.automaticPayment,
        type: formData.type,
        currency: formData.currency,
        categoriesId:
          formData.categoriesId.length > 0 ? formData.categoriesId : undefined,
        paymentId: editPayment?.id,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? "update" : "create"} payment`
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setOriginalCurrency("");
    setSuggestionsAccepted(false);
    setShowAiSuggestions(true);
    setHasTriggeredSuggestions(false);
    setAiSuggestions([]);
    setAiSuggestionsError(null);
    setFormData({
      name: "",
      amount: "",
      description: "",
      accountId: accounts[0]?.id.toString() || "",
      frequency: Frequency.MONTHLY,
      emailNotification: false,
      notificationDay: 0,
      automaticPayment: false,
      type: defaultType,
      currency: accounts[0]?.currency || CurrencyType.RON,
      categoriesId: [],
      startDate: new Date().toISOString().split("T")[0],
    });
    setError(null);
    setAccountSearchTerm("");
    setCategorySearchTerm("");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                placeholder="e.g., Monthly Rent, Salary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="0.00"
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between shadow-sm"
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
                      {Object.values(CurrencyType).map((currency) => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => {
                            if (
                              isEditMode &&
                              currency !== formData.currency &&
                              originalCurrency
                            ) {
                              const currentAmount =
                                parseFloat(formData.amount) || 0;
                              const convertedAmount = convertCurrency(
                                currentAmount,
                                formData.currency,
                                currency
                              );

                              handleInputChange("currency", currency);
                              handleInputChange(
                                "amount",
                                convertedAmount.toFixed(2)
                              );
                            } else {
                              handleInputChange("currency", currency);
                            }
                            setIsCurrencyOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                            formData.currency === currency
                              ? "bg-blue-50 text-blue-700"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                rows={3}
                placeholder="Optional description..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Frequency).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => handleInputChange("frequency", freq)}
                    className={`p-3 rounded-xl border text-sm transition-colors shadow-sm ${
                      formData.frequency === freq
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {freq.charAt(0) + freq.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {formData.amount && formData.startDate && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Next 3 Payments
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {calculateNextPayments().map((date, index) => (
                      <div
                        key={index}
                        className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded text-center"
                      >
                        {date.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account *
              </label>
              <SearchWithSuggestions
                placeholder="Search and select account..."
                onSearch={setAccountSearchTerm}
                suggestions={accountSuggestions}
                variant={
                  defaultType === PaymentType.EXPENSE ? "expense" : "income"
                }
                onSelect={handleAccountSelect}
                selectedItems={
                  formData.accountId
                    ? [
                        accounts.find(
                          (acc) => acc.id.toString() === formData.accountId
                        )?.name || "",
                      ]
                    : []
                }
              />
              {formData.accountId && (
                <div className="mt-2 p-2 bg-gray-50 rounded-xl shadow-sm">
                  <div className="text-sm text-gray-600">
                    Selected:{" "}
                    <span className="font-medium">
                      {
                        accounts.find(
                          (acc) => acc.id.toString() === formData.accountId
                        )?.name
                      }
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      (
                      {accounts
                        .find((acc) => acc.id.toString() === formData.accountId)
                        ?.amount.toFixed(2)}{" "}
                      {
                        accounts.find(
                          (acc) => acc.id.toString() === formData.accountId
                        )?.currency
                      }
                      )
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isEditMode && showAiSuggestions && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-purple-600" />
                    <label className="text-sm font-medium text-gray-700">
                      AI Category Suggestions
                    </label>
                  </div>
                  {aiSuggestions.length > 0 && (
                    <button
                      type="button"
                      onClick={retryAISuggestions}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      title="Get new suggestions"
                    >
                      <RefreshCw size={12} />
                      Refresh
                    </button>
                  )}
                </div>

                {aiSuggestionsLoading && (
                  <div className="flex items-center justify-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <Loader
                      className="animate-spin text-purple-600 mr-2"
                      size={16}
                    />
                    <span className="text-sm text-purple-700">
                      AI is analyzing your payment for the best categories...
                    </span>
                  </div>
                )}

                {aiSuggestionsError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-600" />
                        <span className="text-sm text-red-700">
                          {aiSuggestionsError}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={retryAISuggestions}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {aiSuggestions.length > 0 && !aiSuggestionsLoading && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">
                          Suggested for "{formData.name}"
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={acceptAllAISuggestions}
                          disabled={creatingCategories.length > 0}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <ThumbsUp size={12} />
                          Accept All
                        </button>
                        <button
                          type="button"
                          onClick={dismissAISuggestions}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                          <ThumbsDown size={12} />
                          Skip
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {aiSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={`${suggestion.type}-${suggestion.categoryName}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100 shadow-sm"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-800">
                                {suggestion.categoryName}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full ${
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
                            <p className="text-xs text-gray-600">
                              {suggestion.reason}
                            </p>
                            {suggestion.type === "new" &&
                              suggestion.description && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  {suggestion.description}
                                </p>
                              )}
                          </div>
                          <button
                            type="button"
                            onClick={() => acceptAISuggestion(suggestion)}
                            disabled={
                              (suggestion.type === "existing" &&
                                formData.categoriesId.includes(
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
                            className={`ml-3 p-2 rounded-lg text-xs transition-colors ${
                              (suggestion.type === "existing" &&
                                formData.categoriesId.includes(
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
                              formData.categoriesId.includes(
                                suggestion.categoryId
                              )) ||
                            (suggestion.type === "new" &&
                              localCategories.some(
                                (cat) =>
                                  cat.name.toLowerCase() ===
                                  suggestion.categoryName.toLowerCase()
                              )) ? (
                              <Check size={12} />
                            ) : creatingCategories.includes(
                                suggestion.categoryName
                              ) ? (
                              <Loader size={12} className="animate-spin" />
                            ) : (
                              <Plus size={12} />
                            )}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {!aiSuggestionsLoading &&
                  !aiSuggestionsError &&
                  aiSuggestions.length === 0 &&
                  hasTriggeredSuggestions && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                      <p className="text-sm text-gray-600">
                        No specific category suggestions found. Please select
                        categories manually.
                      </p>
                    </div>
                  )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Categories{" "}
                  {!showAiSuggestions || suggestionsAccepted
                    ? ""
                    : "(or select manually)"}
                </label>
                <motion.button
                  type="button"
                  onClick={() => setIsCreateCategoryModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={12} />
                  Add New
                </motion.button>
              </div>
              <SearchWithSuggestions
                placeholder="Search and select categories..."
                onSearch={setCategorySearchTerm}
                suggestions={categorySuggestions}
                variant={
                  defaultType === PaymentType.EXPENSE ? "expense" : "income"
                }
                onSelect={handleCategorySelect}
                selectedItems={selectedCategoryNames}
                multiSelect={true}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 flex items-center cursor-pointer">
                  <Bell size={16} className="mr-2 text-blue-500" />
                  Email notifications
                </label>
                <input
                  type="checkbox"
                  checked={formData.emailNotification}
                  onChange={(e) =>
                    handleInputChange("emailNotification", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div>

              {formData.emailNotification && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification timing
                  </label>
                  <div className="relative" ref={notificationRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setIsNotificationDayOpen(!isNotificationDayOpen)
                      }
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between text-sm shadow-sm"
                    >
                      <span>
                        {formData.notificationDay === 0 && "On the payment day"}
                        {formData.notificationDay === 1 && "1 day before"}
                        {formData.notificationDay === 2 && "2 days before"}
                        {formData.notificationDay === 3 && "3 days before"}
                        {formData.notificationDay === 5 && "5 days before"}
                        {formData.notificationDay === 7 && "1 week before"}
                        {formData.notificationDay === 14 && "2 weeks before"}
                        {formData.notificationDay === 30 && "1 month before"}
                      </span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>

                    {isNotificationDayOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 max-h-28 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-y-auto"
                      >
                        {[
                          { value: 0, label: "On the payment day" },
                          { value: 1, label: "1 day before" },
                          { value: 2, label: "2 days before" },
                          { value: 3, label: "3 days before" },
                          { value: 5, label: "5 days before" },
                          { value: 7, label: "1 week before" },
                          { value: 14, label: "2 weeks before" },
                          { value: 30, label: "1 month before" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              handleInputChange(
                                "notificationDay",
                                option.value
                              );
                              setIsNotificationDayOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              formData.notificationDay === option.value
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 flex items-center cursor-pointer">
                  <Zap size={16} className="mr-2 text-blue-500" />
                  Automatic processing
                </label>
                <input
                  type="checkbox"
                  checked={formData.automaticPayment}
                  onChange={(e) =>
                    handleInputChange("automaticPayment", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        const selectedAccount = accounts.find(
          (acc) => acc.id.toString() === formData.accountId
        );
        const selectedCategories = localCategories.filter((cat) =>
          formData.categoriesId.includes(cat.id)
        );

        return (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border shadow-sm ${defaultType === PaymentType.EXPENSE ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
            >
              <h3 className="font-semibold text-lg mb-3">{formData.name}</h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="ml-2 font-medium">
                    {formData.amount} {formData.currency}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Frequency:</span>
                  <span className="ml-2 font-medium">
                    {formData.frequency.toLowerCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Start Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(formData.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Account:</span>
                  <span className="ml-2 font-medium">
                    {selectedAccount?.name}
                  </span>
                </div>
              </div>

              {selectedCategories.length > 0 && (
                <div className="mt-3">
                  <span className="text-gray-600 text-sm">Categories: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCategories.map((category) => (
                      <span
                        key={category.id}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.description && (
                <div className="mt-3">
                  <span className="text-gray-600 text-sm">Description: </span>
                  <p className="text-sm text-gray-800 mt-1">
                    {formData.description}
                  </p>
                </div>
              )}
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
          onClick={onClose}
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
            <div
              className={`relative overflow-hidden ${theme.gradient} text-white`}
            >
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
                      className={`bg-white rounded-full shadow-lg ${
                        isMobileView ? "p-1.5" : "p-1.5"
                      } ${defaultType === PaymentType.EXPENSE ? "text-red-600" : "text-green-600"}`}
                    >
                      {defaultType === PaymentType.EXPENSE ? "💸" : "💰"}
                    </div>
                    <div>
                      <h2
                        className={`font-semibold ${isMobileView ? "text-lg" : "text-lg"}`}
                      >
                        {isEditMode ? "Edit" : "Create"}{" "}
                        {defaultType === PaymentType.EXPENSE
                          ? "Bill"
                          : "Income"}
                      </h2>
                      <p
                        className={`opacity-90 ${isMobileView ? "text-sm" : "text-sm"}`}
                      >
                        {steps[currentStep - 1]}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => {
                      onClose();
                      resetForm();
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={isMobileView ? 20 : 20} />
                  </motion.button>
                </div>

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

            <div
              className={`${isMobileView ? "p-3" : "p-4"} min-h-[300px] overflow-y-auto`}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2 mb-4 shadow-sm"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              {renderStepContent()}
            </div>

            <div
              className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 flex justify-between`}
            >
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

              {currentStep < 5 ? (
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
                  className={`flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all shadow-md disabled:opacity-50 ${
                    isEditMode
                      ? theme.editButtonBg + " focus:ring-blue-500"
                      : theme.createButtonBg +
                        " focus:ring-" +
                        (defaultType === PaymentType.EXPENSE
                          ? "red"
                          : "green") +
                        "-500"
                  }`}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Edit size={16} />
                  )}
                  {isEditMode ? "Update" : "Create"}
                </motion.button>
              )}
            </div>
          </motion.div>

          <CreateCategoryModal
            isOpen={isCreateCategoryModalOpen}
            onClose={() => setIsCreateCategoryModalOpen(false)}
            onSuccess={handleCategoryCreated}
            userId={userId}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePaymentPopup;
