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
  value?: string;
}> = ({
  placeholder,
  onSearch,
  suggestions,
  variant,
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

  const colorClass = variant === "expense" ? "red" : "green";

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search
          size={14}
          className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 text-${colorClass}-400`}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className={`w-full pl-8 pr-3 py-2.5 text-sm border border-${colorClass}-200 rounded-xl focus:ring-2 focus:ring-${colorClass}-500 focus:border-transparent transition-colors shadow-sm bg-${colorClass}-50/50`}
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
              className={`w-full text-left px-3 py-2.5 sm:py-2 text-sm hover:bg-${colorClass}-50 transition-colors ${
                selectedItems.includes(suggestion)
                  ? `bg-${colorClass}-50 text-${colorClass}-700`
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
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-colors hover:opacity-75 bg-${colorClass}-100 text-${colorClass}-700 hover:bg-${colorClass}-200 min-h-[32px] touch-manipulation`}
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

const CreatePaymentPopup: React.FC<CreatePaymentPopupProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onCategoryCreated,
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
  const [isClosing, setIsClosing] = useState(false);

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
    if (formData.type === PaymentType.EXPENSE) {
      return {
        gradient: "bg-gradient-to-r from-red-600 to-red-800",
        variant: "expense" as const,
        icon: "💸",
        colorClass: "red",
        focusRing: "focus:ring-red-500",
        bgColor: "bg-red-50/50",
        borderColor: "border-red-200",
        textColor: "text-red-500",
        buttonBg: "bg-red-600 hover:bg-red-700",
      };
    } else {
      return {
        gradient: "bg-gradient-to-r from-green-600 to-green-800",
        variant: "income" as const,
        icon: "💰",
        colorClass: "green",
        focusRing: "focus:ring-green-500",
        bgColor: "bg-green-50/50",
        borderColor: "border-green-200",
        textColor: "text-green-500",
        buttonBg: "bg-green-600 hover:bg-green-700",
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
        "https://financeapp-bg0k.onrender.com/ai/aiCategorySuggestion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
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
    if (isOpen) {
      loadExchangeRates();
    }
  }, [isOpen]);

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

    if (field === "type") {
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
      setAccountSearchTerm("");
    }
  };

  const clearAccountSelection = () => {
    setFormData((prev) => ({ ...prev, accountId: "" }));
    setAccountSearchTerm("");
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

      handleClose();
      onSuccess();
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
    handleStepChange(1);
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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      resetForm();
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-3">
            <div>
              <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1 flex items-center">
                <span className={`${theme.textColor} mr-1`}>🏷️</span>
                Payment Name<span className={theme.textColor}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-4 sm:px-3 py-3 sm:py-2.5 border ${theme.borderColor} rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent transition-all ${theme.bgColor} shadow-sm text-base sm:text-sm`}
                placeholder={`Enter ${formData.type === PaymentType.EXPENSE ? "expense" : "income"} name`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2">
              <div className="sm:col-span-1">
                <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1 flex items-center">
                  <span className={`${theme.textColor} mr-1`}>💰</span>
                  Amount<span className={theme.textColor}>*</span>
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className={`absolute left-3 sm:left-2.5 top-1/2 transform -translate-y-1/2 ${theme.textColor.replace("text-", "text-").replace("-500", "-400")}`}
                  />
                  <input
                    type="text"
                    className={`w-full pl-10 sm:pl-8 pr-4 sm:pr-3 py-3 sm:py-2.5 border ${theme.borderColor} rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent transition-all ${theme.bgColor} shadow-sm font-medium text-base sm:text-sm`}
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^[0-9]*([.,][0-9]*)?$/.test(value)) {
                        handleInputChange("amount", value);
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
                    className={`w-full p-3 sm:p-2.5 border ${theme.borderColor} rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent text-left flex items-center justify-between ${theme.bgColor} shadow-sm transition-all text-base sm:text-sm touch-manipulation`}
                  >
                    <span>{formData.currency}</span>
                    <ChevronDown
                      size={16}
                      className={theme.textColor
                        .replace("text-", "text-")
                        .replace("-500", "-400")}
                    />
                  </button>

                  {isCurrencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-32 sm:max-h-28 overflow-y-auto"
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
                          className={`w-full text-left px-4 sm:px-3 py-3 sm:py-2 hover:bg-gray-50 transition-colors text-base sm:text-sm touch-manipulation ${
                            formData.currency === currency
                              ? `${theme.bgColor} ${theme.textColor.replace("-500", "-700")}`
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
              <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1 flex items-center">
                <span className={`${theme.textColor} mr-1`}>📝</span>
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className={`w-full px-4 sm:px-3 py-3 sm:py-2.5 border ${theme.borderColor} rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent transition-all ${theme.bgColor} shadow-sm text-base sm:text-sm resize-none`}
                placeholder="Add payment details"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-3">
            <div>
              <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1 flex items-center">
                <span className={`${theme.textColor} mr-1`}>📅</span>
                Start Date<span className={theme.textColor}>*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className={`w-full px-4 sm:px-3 py-3 sm:py-2.5 border ${theme.borderColor} rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent transition-all ${theme.bgColor} shadow-sm text-base sm:text-sm relative z-[100]`}
                  style={{
                    colorScheme: "light",
                    // Add these styles for mobile
                    WebkitAppearance: "none",
                    minHeight: "3rem", // Makes it easier to tap on mobile
                  }}
                  onClick={(e) => {
                    if (isMobileView) {
                      e.currentTarget.showPicker();
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (isMobileView) {
                      e.currentTarget.showPicker();
                    }
                  }}
                  required
                />
                {/* Add a calendar icon that triggers the picker on mobile */}
                {isMobileView && (
                  <div
                    className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none"
                    onClick={(e) => {
                      const input =
                        e.currentTarget.parentElement?.querySelector(
                          'input[type="date"]'
                        );
                      if (input) (input as HTMLInputElement).showPicker();
                    }}
                  >
                    
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1 flex items-center">
                <span className={`${theme.textColor} mr-1`}>🔄</span>
                Frequency<span className={theme.textColor}>*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-1">
                {Object.values(Frequency).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => handleInputChange("frequency", freq)}
                    className={`p-3 sm:p-2.5 rounded-xl border text-sm sm:text-xs transition-colors shadow-sm font-medium touch-manipulation ${
                      formData.frequency === freq
                        ? `${theme.borderColor.replace("border-", "border-").replace("-200", "-500")} ${theme.bgColor} ${theme.textColor.replace("-500", "-700")}`
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {freq.charAt(0) + freq.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {formData.amount && formData.startDate && (
              <div className="space-y-3 sm:space-y-2">
                <div
                  className={`${theme.bgColor} border ${theme.borderColor} p-4 sm:p-3 rounded-xl shadow-sm`}
                >
                  <div className="flex items-center gap-2 mb-3 sm:mb-2">
                    <Calendar
                      size={14}
                      className={theme.textColor.replace("-500", "-600")}
                    />
                    <span
                      className={`text-sm sm:text-xs font-medium ${theme.textColor.replace("-500", "-800")}`}
                    >
                      Next 3 Payments
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-1">
                    {calculateNextPayments().map((date, index) => (
                      <div
                        key={index}
                        className={`text-xs sm:text-xs ${theme.textColor.replace("-500", "-700")} ${theme.bgColor.replace("/50", "").replace("bg-", "bg-").replace("-50", "-100")} px-2 py-1 rounded text-center font-medium`}
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
          <div className="space-y-5 sm:space-y-4">
            <div>
              <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-3 sm:mb-1 flex items-center">
                <span className={`${theme.textColor} mr-1`}>💳</span>
                Select Account<span className={theme.textColor}>*</span>
              </label>
              <SearchWithSuggestions
                placeholder="Search and select account..."
                onSearch={setAccountSearchTerm}
                suggestions={accountSuggestions}
                variant={theme.variant}
                onSelect={handleAccountSelect}
                value={
                  formData.accountId
                    ? accounts.find(
                        (acc) => acc.id.toString() === formData.accountId
                      )?.name || ""
                    : accountSearchTerm
                }
              />
              {formData.accountId && (
                <div
                  className={`mt-3 sm:mt-2 p-3 sm:p-2 ${theme.bgColor} border ${theme.borderColor} rounded-xl shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium text-base sm:text-sm truncate ${theme.textColor.replace("-500", "-800")}`}
                      >
                        {
                          accounts.find(
                            (acc) => acc.id.toString() === formData.accountId
                          )?.name
                        }
                      </div>
                      <div
                        className={`text-sm sm:text-xs ${theme.textColor.replace("-500", "-600")}`}
                      >
                        Balance:{" "}
                        {accounts
                          .find(
                            (acc) => acc.id.toString() === formData.accountId
                          )
                          ?.amount.toFixed(2)}{" "}
                        {
                          accounts.find(
                            (acc) => acc.id.toString() === formData.accountId
                          )?.currency
                        }
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearAccountSelection}
                      className={`${theme.textColor} hover:${theme.textColor.replace("-500", "-700")} transition-colors p-1 touch-manipulation`}
                    >
                      <X size={16} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-1">
                <label className="block text-sm sm:text-xs font-medium text-gray-700 flex items-center">
                  <span className={`${theme.textColor} mr-1`}>🏷️</span>
                  Categories{" "}
                  {!showAiSuggestions || suggestionsAccepted
                    ? "(Optional)"
                    : "(or select manually)"}
                </label>
                <motion.button
                  type="button"
                  onClick={() => setIsCreateCategoryModalOpen(true)}
                  className={`flex items-center gap-1.5 sm:gap-1 px-3 py-2 sm:px-2 sm:py-1 text-white text-sm sm:text-xs rounded-lg transition-colors shadow-sm touch-manipulation ${theme.buttonBg}`}
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
                variant={theme.variant}
                onSelect={handleCategorySelect}
                selectedItems={selectedCategoryNames}
                multiSelect={true}
              />
            </div>

            {!isEditMode && showAiSuggestions && (
              <div className="space-y-4 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain
                      size={18}
                      className="text-purple-600 sm:w-4 sm:h-4"
                    />
                    <label className="text-base sm:text-sm font-medium text-gray-700">
                      AI Category Suggestions
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
                      AI is analyzing your payment for the best categories...
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
                              className={`w-10 h-10 sm:w-8 sm:h-8 rounded-lg text-sm sm:text-xs transition-colors touch-manipulation flex-shrink-0 flex items-center justify-center ${
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

      case 4:
        return (
          <div className="space-y-4 sm:space-y-3">
            <div
              className={`p-4 sm:p-3 border ${theme.borderColor} rounded-xl hover:border-gray-300 shadow-sm transition-colors`}
            >
              <div className="flex items-center justify-between">
                <label className="text-sm sm:text-xs font-medium text-gray-700 flex items-center cursor-pointer">
                  <Bell size={16} className={`mr-2 ${theme.textColor}`} />
                  Email notifications
                </label>
                <input
                  type="checkbox"
                  checked={formData.emailNotification}
                  onChange={(e) =>
                    handleInputChange("emailNotification", e.target.checked)
                  }
                  className={`w-4 h-4 ${theme.textColor.replace("text-", "text-").replace("-500", "-600")} focus:ring-2 ${theme.focusRing} rounded`}
                />
              </div>

              {formData.emailNotification && (
                <div
                  className={`mt-3 sm:mt-2 pt-3 sm:pt-2 border-t ${theme.borderColor}`}
                >
                  <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1">
                    Notification timing
                  </label>
                  <div className="relative" ref={notificationRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setIsNotificationDayOpen(!isNotificationDayOpen)
                      }
                      className={`w-full p-3 sm:p-2.5 border ${theme.borderColor} rounded-xl focus:ring-2 ${theme.focusRing} focus:border-transparent text-left flex items-center justify-between text-sm sm:text-xs shadow-sm ${theme.bgColor} transition-all touch-manipulation`}
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
                      <ChevronDown
                        size={16}
                        className={theme.textColor.replace("-500", "-400")}
                      />
                    </button>

                    {isNotificationDayOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 max-h-32 sm:max-h-28 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-y-auto"
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
                            className={`w-full text-left px-3 py-2 sm:py-1.5 text-sm sm:text-xs hover:bg-gray-50 transition-colors touch-manipulation ${
                              formData.notificationDay === option.value
                                ? `${theme.bgColor} ${theme.textColor.replace("-500", "-700")}`
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

            <div
              className={`p-4 sm:p-3 border ${theme.borderColor} rounded-xl hover:border-gray-300 transition-colors shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <label className="text-sm sm:text-xs font-medium text-gray-700 flex items-center cursor-pointer">
                  <Zap size={16} className={`mr-2 ${theme.textColor}`} />
                  Automatic processing
                </label>
                <input
                  type="checkbox"
                  checked={formData.automaticPayment}
                  onChange={(e) =>
                    handleInputChange("automaticPayment", e.target.checked)
                  }
                  className={`w-4 h-4 ${theme.textColor.replace("text-", "text-").replace("-500", "-600")} focus:ring-2 ${theme.focusRing} rounded`}
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
          <div className="space-y-4 sm:space-y-3">
            <div
              className={`p-4 sm:p-3 ${theme.bgColor} backdrop-blur-sm border ${theme.borderColor.replace("-200", "-200/50")} rounded-xl shadow-sm`}
            >
              <h3
                className={`font-semibold text-lg sm:text-base mb-3 sm:mb-2 ${theme.textColor.replace("-500", "-800")}`}
              >
                {formData.name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 text-sm sm:text-xs">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">
                    {formData.type === PaymentType.EXPENSE
                      ? "💸 Expense"
                      : "💰 Income"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="ml-2 font-medium">
                    {formData.amount} {formData.currency}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Frequency:</span>
                  <span className="ml-2 font-medium">
                    {formData.frequency.charAt(0) +
                      formData.frequency.slice(1).toLowerCase()}
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
                <div>
                  <span className="text-gray-600">Notifications:</span>
                  <span className="ml-2 font-medium">
                    {formData.emailNotification ? "✅ Enabled" : "❌ Disabled"}
                  </span>
                </div>
              </div>

              {formData.description && (
                <div
                  className={`mt-3 sm:mt-2 pt-3 sm:pt-2 border-t ${theme.borderColor}`}
                >
                  <span className="text-gray-600 text-sm sm:text-xs">
                    Description:{" "}
                  </span>
                  <span className="text-sm sm:text-xs text-gray-800">
                    {formData.description}
                  </span>
                </div>
              )}

              {selectedCategories.length > 0 && (
                <div
                  className={`mt-3 sm:mt-2 pt-3 sm:pt-2 border-t ${theme.borderColor}`}
                >
                  <span className="text-gray-600 text-sm sm:text-xs">
                    Categories:{" "}
                  </span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-1 mt-2 sm:mt-1">
                    {selectedCategories.map((category) => (
                      <span
                        key={category.id}
                        className={`px-2.5 py-1 sm:px-1.5 sm:py-0.5 ${theme.bgColor.replace("/50", "").replace("bg-", "bg-").replace("-50", "-100")} ${theme.textColor.replace("-500", "-700")} text-sm sm:text-xs rounded`}
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(formData.emailNotification || formData.automaticPayment) && (
                <div
                  className={`mt-3 sm:mt-2 pt-3 sm:pt-2 border-t ${theme.borderColor}`}
                >
                  <span className="text-gray-600 text-sm sm:text-xs">
                    Settings:{" "}
                  </span>
                  <div className="flex flex-wrap gap-2 sm:gap-1 mt-2 sm:mt-1">
                    {formData.automaticPayment && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-1.5 sm:py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        <Zap size={10} />
                        Auto Payment
                      </span>
                    )}
                    {formData.emailNotification && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-1.5 sm:py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        <Bell size={10} />
                        Email Alerts
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 " onClick={handleClose} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col z-50 w-full max-w-md mx-auto"
        style={{
          maxHeight: isMobileView ? "90vh" : "65vh",
        }}
      >
        <div
          className={`${theme.gradient} relative overflow-hidden flex-shrink-0 rounded-t-2xl`}
        >
          <div className="absolute top-0 right-0 bg-white/20 rounded-full w-16 h-16 sm:w-12 sm:h-12 -translate-y-8 translate-x-8 sm:-translate-y-6 sm:translate-x-6"></div>
          <div className="absolute bottom-0 left-0 bg-white/10 rounded-full w-10 h-10 sm:w-8 sm:h-8 translate-y-5 -translate-x-5 sm:translate-y-4 sm:-translate-x-4"></div>
          <div className="absolute bg-white/15 rounded-full w-8 h-8 sm:w-6 sm:h-6 top-2 left-20 sm:top-1 sm:left-14"></div>

          <div className="relative z-10 px-5 py-4 sm:px-4 sm:py-3 flex items-center justify-between mb-3 sm:mb-2">
            <div className="flex items-center min-w-0">
              <div className="bg-white rounded-full flex items-center justify-center mr-3 shadow-lg w-10 h-10 sm:w-8 sm:h-8">
                <span className="text-lg sm:text-base">{theme.icon}</span>
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-white text-lg sm:text-base truncate">
                  {isEditMode ? "Edit" : "Create"}{" "}
                  {formData.type === PaymentType.EXPENSE ? "Bill" : "Income"}
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

        <div
          className="flex-1 px-5 py-4 sm:px-4 sm:py-3 min-h-0"
          style={{ overflowY: currentStep === 2 ? "visible" : "auto" }}
        >
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

        <div className="border-t bg-gray-50/50 backdrop-blur-sm flex justify-between px-5 py-4 sm:px-4 sm:py-3 flex-shrink-0 rounded-b-2xl">
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

          {currentStep < 5 ? (
            <motion.button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex items-center gap-2 sm:gap-1 px-6 py-3 sm:px-4 sm:py-2 font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-base sm:text-sm touch-manipulation ${
                formData.type === PaymentType.EXPENSE
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white focus:ring-red-500"
                  : "bg-gradient-to-r from-green-600 to-green-700 text-white focus:ring-green-500"
              }`}
              whileHover={{ scale: !canProceed() ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue
              <ArrowRight size={16} className="sm:w-4 sm:h-4" />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center gap-2 sm:gap-1 px-6 py-3 sm:px-4 sm:py-2 font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-base sm:text-sm touch-manipulation ${
                isEditMode
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white focus:ring-blue-500"
                  : formData.type === PaymentType.EXPENSE
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white focus:ring-red-500"
                    : "bg-gradient-to-r from-green-600 to-green-700 text-white focus:ring-green-500"
              }`}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : isEditMode ? (
                <Edit size={16} className="sm:w-4 sm:h-4" />
              ) : (
                theme.icon
              )}
              {isEditMode ? "Update Payment" : "Create Payment"}
            </motion.button>
          )}
        </div>
      </motion.div>

      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
      />
    </div>
  );
};

export default CreatePaymentPopup;
