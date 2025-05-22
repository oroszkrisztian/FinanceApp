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
} from "lucide-react";
import { CurrencyType, Frequency, PaymentType } from "../../interfaces/enums";
import { createPayment } from "../../services/paymentService";

interface CreatePaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  accounts: Array<{
    id: number;
    name: string;
    currency: CurrencyType;
    amount: number;
  }>;
  categories: Array<{ id: number; name: string }>;
  defaultType?: PaymentType;
}

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
    "w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors";
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
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
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
  userId,
  accounts,
  categories,
  defaultType = PaymentType.EXPENSE,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
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

  // Search states
  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const currencyRef = useRef<HTMLDivElement>(null);

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

  // Close currency dropdown on outside click
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

  const calculateMonthlyImpact = () => {
    const amount = parseFloat(formData.amount) || 0;
    const multipliers = {
      [Frequency.WEEKLY]: 4.33,
      [Frequency.BIWEEKLY]: 2.17,
      [Frequency.MONTHLY]: 1,
      [Frequency.QUARTERLY]: 0.33,
      [Frequency.YEARLY]: 0.083,
      [Frequency.DAILY]: 30,
      [Frequency.CUSTOM]: 1,
      [Frequency.ONCE]: 0,
    };
    return amount * multipliers[formData.frequency];
  };

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
    const selectedCategory = categories.find(
      (cat) => cat.name === categoryName
    );
    if (selectedCategory) {
      handleCategoryToggle(selectedCategory.id);
    }
  };

  // Get filtered data based on search terms
  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(accountSearchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  // Get suggestion arrays
  const accountSuggestions = filteredAccounts.map((acc) => acc.name);
  const categorySuggestions = filteredCategories.map((cat) => cat.name);
  const selectedCategoryNames = categories
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
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payment");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      name: "",
      amount: "",
      description: "",
      accountId: accounts[0]?.id.toString() || "",
      frequency: Frequency.MONTHLY,
      emailNotification: false,
      notificationDay: 0, // Reset to default
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between"
                  >
                    <span>{formData.currency}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {isCurrencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
                    >
                      {Object.values(CurrencyType).map((currency) => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => {
                            handleInputChange("currency", currency);
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className={`p-3 rounded-lg border text-sm transition-colors ${
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
                <div
                  className={`p-3 rounded-lg ${
                    defaultType === PaymentType.EXPENSE
                      ? "bg-red-50 border border-red-200"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Info
                      size={14}
                      className={
                        defaultType === PaymentType.EXPENSE
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    />
                    <span
                      className={`text-sm font-medium ${defaultType === PaymentType.EXPENSE ? "text-red-800" : "text-green-800"}`}
                    >
                      Monthly Impact
                    </span>
                  </div>
                  <p
                    className={`text-sm ${defaultType === PaymentType.EXPENSE ? "text-red-700" : "text-green-700"}`}
                  >
                    {calculateMonthlyImpact().toFixed(2)} {formData.currency}{" "}
                    per month
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
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
                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
              </label>
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
            <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 ">
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
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsNotificationDayOpen(!isNotificationDayOpen)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between text-sm"
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
                        className="absolute top-full left-0 right-0 mt-1 max-h-28 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-y-auto"
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

            <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
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
        const selectedCategories = categories.filter((cat) =>
          formData.categoriesId.includes(cat.id)
        );

        return (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg border ${defaultType === PaymentType.EXPENSE ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
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
            </div>

            <div
              className={`p-3 rounded-lg ${defaultType === PaymentType.EXPENSE ? "bg-red-50" : "bg-green-50"}`}
            >
              <p
                className={`text-sm ${defaultType === PaymentType.EXPENSE ? "text-red-700" : "text-green-700"}`}
              >
                Monthly Impact:{" "}
                <span className="font-semibold">
                  {defaultType === PaymentType.EXPENSE ? "-" : "+"}
                  {calculateMonthlyImpact().toFixed(2)} {formData.currency}
                </span>
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
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`p-4 ${defaultType === PaymentType.EXPENSE ? "bg-gradient-to-r from-red-600 to-red-500 text-white" : "bg-gradient-to-r from-green-600 to-green-500 text-white"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`bg-white rounded-full p-1.5 shadow-md ${defaultType === PaymentType.EXPENSE ? "text-red-600" : "text-green-600"}`}
                  >
                    {defaultType === PaymentType.EXPENSE ? "💸" : "💰"}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Create{" "}
                      {defaultType === PaymentType.EXPENSE ? "Bill" : "Income"}
                    </h2>
                    <p className="text-sm opacity-90">
                      {steps[currentStep - 1]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200"
                >
                  <X size={20} />
                </button>
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
            <div className="p-4 min-h-[300px]">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {renderStepContent()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors ${
                    defaultType === PaymentType.EXPENSE
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-50`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Create
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePaymentPopup;
