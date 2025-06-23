import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ChevronDown,
  RefreshCw,
  Plus,
  Filter,
  BarChart3,
  AlertTriangle,
  Search,
  X,
  Receipt,
  Brain,
  Loader2,
  Tag,
} from "lucide-react";
import { Budget } from "../../interfaces/Budget";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { Transaction } from "../../interfaces/Transaction";
import { useAuth } from "../../context/AuthContext";
import {
  fetchExchangeRates,
  convertAmount,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import {
  createUserBudgetWithCategories,
  updateUserBudget,
} from "../../services/budgetService";
import { getUserAllTransactions } from "../../services/transactionService";
import { CurrencyType } from "../../interfaces/enums";
import CreateNewBudget from "./CreateNewBudget";
import EditBudget from "./EditBudget";
import EmptyBudget from "./EmptyBudget";
import AIBudgetRecommendationsModal from "./AIBudgetRecommendation";
import { AIBudgetRecommendation } from "../../interfaces/AIBudgetRecommendation";

interface BudgetDashboardProps {
  budgets: Budget[] | null;
  categories: CustomCategory[];
  deletedBudgets: Budget[];
  onSuccess?: () => void;
}

interface SearchWithSuggestionsProps {
  placeholder: string;
  onSearch: (term: string) => void;
  suggestions: string[];
  variant: "budget";
}

const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  placeholder,
  onSearch,
  suggestions,
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
    setSearchTerm(suggestion);
    onSearch(suggestion);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setSearchTerm("");
    onSearch("");
    setIsOpen(false);
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
          className={`w-full pl-8 ${searchTerm ? "pr-8" : "pr-3"} py-2 text-sm border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors shadow-sm bg-indigo-50/50`}
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
            onClick={clearSearch}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-indigo-200 rounded-xl shadow-lg z-[9999] max-h-28 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors text-gray-700"
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  budgets,
  categories,
  onSuccess,
}) => {
  const { token } = useAuth();

  const [isMobileView, setIsMobileView] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<string>(
    CurrencyType.RON
  );
  const [rates, setRates] = useState<any>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [selectedBudgetPreview, setSelectedBudgetPreview] =
    useState<Budget | null>(null);
  const [selectedTransactionPreview, setSelectedTransactionPreview] =
    useState<Transaction | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(
    null
  );

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<
    AIBudgetRecommendation[]
  >([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>(undefined);

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
        setAvailableCurrencies(Object.keys(ratesData));
      } catch (err) {
        setRates({});
        setAvailableCurrencies([CurrencyType.RON]);
      } finally {
        setFetchingRates(false);
      }
    };
    loadExchangeRates();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await getUserAllTransactions();
      let transactionsArray: Transaction[] = [];

      if (Array.isArray(data)) {
        transactionsArray = data;
      } else if (data && typeof data === "object") {
        if (data.id !== undefined) {
          transactionsArray = [data as Transaction];
        } else {
          const arrayProps = Object.values(data).filter((val) =>
            Array.isArray(val)
          );
          if (arrayProps.length > 0) {
            transactionsArray = arrayProps[0] as Transaction[];
          }
        }
      }

      setTransactions(transactionsArray);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactionsError("Failed to fetch transactions");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setTransactionsLoading(true);
      setTransactionsError(null);

      try {
        await fetchTransactions();
      } catch (err) {
        console.error("Error loading transactions:", err);
      } finally {
        setTransactionsLoading(false);
      }
    };

    loadData();
  }, []);

  const editBudgetsAi = async () => {
    if (!token) return;

    setIsLoadingAI(true);
    setAiError(undefined);
    setIsAIModalOpen(true);

    try {
      const response = await fetch(
        "https://financeapp-bg0k.onrender.com/ai/budgetEdit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transactions: transactions,
            categories,
            budgets: budgets,
            futureOutgoingPayments: [],
            futureIncomingPayments: [],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI recommendations");
      }

      const data = await response.json();

      if (data.success && data.recommendations) {
        setAiRecommendations(data.recommendations);
      } else {
        setAiRecommendations([]);
      }
    } catch (error) {
      console.error("AI recommendations error:", error);
      setAiError(
        error instanceof Error
          ? error.message
          : "Failed to get AI recommendations"
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleApplyAIRecommendations = async (
    recommendations: AIBudgetRecommendation[]
  ) => {
    const results = [];

    for (const rec of recommendations) {
      try {
        if (rec.action === "create") {
          await createUserBudgetWithCategories(
            rec.name,
            rec.limitAmount,
            rec.currency,
            rec.categoryIds
          );
          results.push({ success: true, action: "create", name: rec.name });
        } else if (rec.action === "update" && rec.budgetId) {
          await updateUserBudget(
            rec.budgetId,
            rec.name,
            rec.limitAmount,
            rec.currency,
            rec.categoryIds
          );
          results.push({ success: true, action: "update", name: rec.name });
        }
      } catch (error) {
        console.error(`Failed to ${rec.action} budget ${rec.name}:`, error);
        results.push({
          success: false,
          action: rec.action,
          name: rec.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    onSuccess?.();

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      console.error(`Failed to apply ${failed.length} recommendations`);
    }
  };

  const calculateBudgetSpent = useMemo(() => {
    return (budget: Budget): number => {
      if (!transactions || transactions.length === 0 || transactionsLoading)
        return budget.currentSpent;

      const budgetCategoryIds = budget.customCategories.map((cat) =>
        String(cat.id)
      );

      const budgetTransactions = transactions.filter((transaction) => {
        return (transaction as any).transactionCategories?.some((tc: any) =>
          budgetCategoryIds.includes(String(tc.customCategoryId))
        );
      });

      const calculatedSpent = budgetTransactions.reduce(
        (total, transaction) => {
          if (transaction.type === "EXPENSE") {
            let convertedAmount = transaction.amount;
            if (
              transaction.currency !== budget.currency &&
              rates[transaction.currency] &&
              rates[budget.currency]
            ) {
              try {
                convertedAmount = convertAmount(
                  transaction.amount,
                  transaction.currency,
                  budget.currency,
                  rates
                );
              } catch (error) {
                console.warn(
                  "Currency conversion failed, using original amount:",
                  error
                );
                convertedAmount = transaction.amount;
              }
            }
            return total + convertedAmount;
          }
          return total;
        },
        0
      );

      return Math.max(budget.currentSpent, calculatedSpent);
    };
  }, [transactions, transactionsLoading, rates]);

  const convertToDisplayCurrency = (
    amount: number,
    currency: string
  ): number => {
    if (
      currency === displayCurrency ||
      !rates[currency] ||
      !rates[displayCurrency]
    )
      return amount;
    const validation = validateCurrencyConversion(
      currency as CurrencyType,
      displayCurrency as CurrencyType,
      rates
    );
    if (!validation.valid) return amount;
    return convertAmount(amount, currency, displayCurrency, rates);
  };

  const filteredBudgets = useMemo(() => {
    if (!budgets) return [];

    return budgets.filter((budget) => {
      const nameMatch =
        nameSearchTerm === "" ||
        budget.name.toLowerCase().includes(nameSearchTerm.toLowerCase());

      const categoryMatch =
        categorySearchTerm === "" ||
        budget.customCategories.some((cat) =>
          cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
        );

      return nameMatch && categoryMatch;
    });
  }, [budgets, nameSearchTerm, categorySearchTerm]);

  const budgetCategoryIds = useMemo(() => {
    const categoryIds = new Set<string>();
    filteredBudgets.forEach((budget) => {
      budget.customCategories.forEach((cat) => {
        categoryIds.add(String(cat.id));
      });
    });
    return Array.from(categoryIds);
  }, [filteredBudgets]);

  const filteredTransactions = useMemo(() => {
    if (filteredBudgets.length === 0) {
      return transactions.filter((transaction) => {
        const transactionName = transaction.name || "";
        const transactionDescription = transaction.description || "";
        const categoryName =
          (transaction as any).transactionCategories?.[0]?.customCategory
            ?.name || "";

        const matchesSearch =
          transactionSearchTerm === "" ||
          transactionName
            .toLowerCase()
            .includes(transactionSearchTerm.toLowerCase()) ||
          transactionDescription
            .toLowerCase()
            .includes(transactionSearchTerm.toLowerCase()) ||
          categoryName
            .toLowerCase()
            .includes(transactionSearchTerm.toLowerCase());

        return matchesSearch;
      });
    }

    return transactions.filter((transaction) => {
      const belongsToFilteredCategory =
        (transaction as any).transactionCategories?.some((tc: any) =>
          budgetCategoryIds.includes(String(tc.customCategoryId))
        ) || false;

      const transactionName = transaction.name || "";
      const transactionDescription = transaction.description || "";
      const categoryName =
        (transaction as any).transactionCategories?.[0]?.customCategory?.name ||
        "";

      const matchesSearch =
        transactionSearchTerm === "" ||
        transactionName
          .toLowerCase()
          .includes(transactionSearchTerm.toLowerCase()) ||
        transactionDescription
          .toLowerCase()
          .includes(transactionSearchTerm.toLowerCase()) ||
        categoryName
          .toLowerCase()
          .includes(transactionSearchTerm.toLowerCase());

      return belongsToFilteredCategory && matchesSearch;
    });
  }, [transactions, budgetCategoryIds, filteredBudgets, transactionSearchTerm]);

  const budgetNames = useMemo(() => {
    return budgets?.map((budget) => budget.name) || [];
  }, [budgets]);

  const allBudgetCategories = useMemo(() => {
    const categories = new Set<string>();
    budgets?.forEach((budget) => {
      budget.customCategories.forEach((cat) => {
        categories.add(cat.name);
      });
    });
    return Array.from(categories);
  }, [budgets]);

  const handleCurrencyChange = (currency: string) => {
    setDisplayCurrency(currency);
    setIsCurrencyMenuOpen(false);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsEditModalOpen(true);
  };

  const handleBudgetPreview = (budget: Budget) => {
    setSelectedBudgetPreview(budget);
  };

  const handleTransactionPreview = (transaction: Transaction) => {
    setSelectedTransactionPreview(transaction);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    onSuccess?.();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedBudget(null);
    onSuccess?.();
  };

  const calculatePercentage = (spent: number, limit: number) => {
    return limit > 0 ? (spent / limit) * 100 : 0;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 75)
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        bar: "bg-red-500",
        accent: "bg-red-100",
        gradient: "from-red-300 to-pink-500",
      };
    if (percentage >= 50)
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
        bar: "bg-orange-500",
        accent: "bg-orange-100",
        gradient: "from-orange-300 to-red-400",
      };
    return {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      bar: "bg-green-500",
      accent: "bg-green-100",
      gradient: "from-green-300 to-emerald-500",
    };
  };

  if (!budgets || budgets.length === 0) {
    return <EmptyBudget categories={categories} onSuccess={onSuccess} />;
  }

  return (
    <div className="space-y-4">
      <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
          isMobileView ? "p-2.5 mx-2" : "p-4"
        }`}
      >
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-indigo-300 to-purple-500 rounded-full opacity-20 ${
            isMobileView
              ? "w-12 h-12 -translate-y-6 translate-x-6"
              : "w-28 h-28 -translate-y-14 translate-x-14"
          }`}
        ></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <motion.div
                className={`bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md ${
                  isMobileView ? "w-7 h-7" : "w-10 h-10"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Calculator
                  size={isMobileView ? 16 : 20}
                  className="text-white"
                />
              </motion.div>
              <div>
                <h2
                  className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                    isMobileView ? "text-base" : "text-lg"
                  }`}
                >
                  Budget Dashboard
                </h2>
                <p
                  className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                >
                  {filteredBudgets.length} budget
                  {filteredBudgets.length !== 1 ? "s" : ""} active
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${
                  isMobileView
                    ? "bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white p-3 rounded-lg text-xs shadow-md flex items-center justify-center touch-manipulation active:scale-90 transition-all duration-200"
                    : "bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-md flex items-center gap-1"
                }`}
                onClick={() => setIsCreateModalOpen(true)}
                title="Create Budget"
              >
                <Plus size={isMobileView ? 20 : 14} />
                {!isMobileView && <span>Create Budget</span>}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${isMobileView ? "space-y-4" : "grid grid-cols-12 gap-6"}`}
      >
        {isMobileView && (
          <div className="mx-2">
            <motion.button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="w-full bg-white rounded-xl shadow-lg border border-gray-100 p-4 mb-2 flex justify-between items-center active:scale-95 touch-manipulation transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-blue-600" />
                <span className="font-medium">Filters</span>
              </div>
              <ChevronDown
                size={16}
                className={`transform transition-transform ${isFilterExpanded ? "rotate-180" : ""}`}
              />
            </motion.button>

            <AnimatePresence>
              {isFilterExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 mb-4"
                >
                  <div className="space-y-3">
                    <SearchWithSuggestions
                      placeholder="Search by budget name..."
                      onSearch={setNameSearchTerm}
                      suggestions={budgetNames}
                      variant="budget"
                    />
                    <SearchWithSuggestions
                      placeholder="Search by category..."
                      onSearch={setCategorySearchTerm}
                      suggestions={allBudgetCategories}
                      variant="budget"
                    />

                    {/* Currency Selector for Mobile */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Currency
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-md flex items-center justify-between transition-all touch-manipulation p-3 rounded-lg text-sm active:scale-95 duration-200"
                        onClick={() =>
                          setIsCurrencyMenuOpen(!isCurrencyMenuOpen)
                        }
                        title="Select currency"
                        disabled={fetchingRates}
                      >
                        <span>{displayCurrency}</span>
                        {!fetchingRates && (
                          <ChevronDown
                            size={16}
                            className={`transform transition-transform ${isCurrencyMenuOpen ? "rotate-180" : ""}`}
                          />
                        )}
                        {fetchingRates && (
                          <RefreshCw size={14} className="animate-spin" />
                        )}
                      </motion.button>

                      {isCurrencyMenuOpen && availableCurrencies.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-indigo-200/50 z-[9999] overflow-hidden"
                        >
                          <div className="max-h-48 overflow-y-auto">
                            {availableCurrencies.map((curr) => (
                              <motion.button
                                key={curr}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                  curr === displayCurrency
                                    ? "bg-indigo-100 text-indigo-700 font-medium"
                                    : "text-gray-700 hover:bg-indigo-50"
                                }`}
                                onClick={() => handleCurrencyChange(curr)}
                              >
                                {curr}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className={`${isMobileView ? "" : "col-span-7"} space-y-4`}>
          <div
            className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
              isMobileView ? "p-2.5 mx-2" : "p-4"
            }`}
            style={{
              height: isMobileView
                ? "calc(100vh - 260px)"
                : "calc(100vh - 200px)",
            }}
          >
            <div
              className={`absolute top-0 right-0 bg-gradient-to-br from-purple-300 to-indigo-500 rounded-full opacity-10 ${
                isMobileView
                  ? "w-16 h-16 -translate-y-8 translate-x-8"
                  : "w-24 h-24 -translate-y-12 translate-x-12"
              }`}
            ></div>

            <div className="relative z-10 h-full flex flex-col">
              <div
                className={`flex-shrink-0 ${isMobileView ? "mb-2" : "mb-4"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className={`bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border border-purple-200/50 backdrop-blur-sm ${
                        isMobileView ? "p-1.5" : "p-2"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BarChart3
                        size={isMobileView ? 16 : 20}
                        className="text-purple-600"
                      />
                    </motion.div>
                    <div>
                      <h3
                        className={`font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                          isMobileView ? "text-base" : "text-lg"
                        }`}
                      >
                        Budget Progress
                      </h3>
                      <p
                        className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                      >
                        Track your spending across all budgets
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${
                      isMobileView
                        ? "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white p-2 rounded-lg shadow-md flex items-center justify-center touch-manipulation active:scale-90 transition-all duration-200"
                        : "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-md flex items-center gap-1"
                    }`}
                    onClick={editBudgetsAi}
                    title="AI Budget Recommendations"
                  >
                    <Brain size={isMobileView ? 16 : 14} />
                    {!isMobileView && <span>AI Recommendations</span>}
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {filteredBudgets.length > 0 ? (
                  <ul className={`space-y-${isMobileView ? "2" : "3"}`}>
                    {filteredBudgets.map((budget) => {
                      const actualSpent = calculateBudgetSpent(budget);
                      const convertedSpent = convertToDisplayCurrency(
                        actualSpent,
                        budget.currency
                      );
                      const convertedLimit = convertToDisplayCurrency(
                        budget.limitAmount,
                        budget.currency
                      );
                      const percentage = calculatePercentage(
                        actualSpent,
                        budget.limitAmount
                      );
                      const isCompleted = percentage >= 100;
                      const showConversion =
                        budget.currency !== displayCurrency;

                      return (
                        <motion.li
                          key={budget.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileTap={{ scale: isMobileView ? 0.97 : 0.98 }}
                          whileHover={!isMobileView ? { scale: 1.01 } : {}}
                          onClick={() => handleBudgetPreview(budget)}
                          className={`${isMobileView ? "p-3 active:scale-95" : "p-5"} rounded-xl border-l-4 shadow-sm active:shadow-lg transition-all duration-200 w-full cursor-pointer touch-manipulation select-none ${
                            isCompleted
                              ? "bg-gradient-to-r from-red-50 to-red-100 border-l-red-500 active:from-red-100 active:to-red-150"
                              : percentage >= 75
                                ? "bg-gradient-to-r from-orange-50 to-red-50 border-l-orange-500 active:from-orange-100 active:to-red-100"
                                : percentage >= 50
                                  ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-l-orange-400 active:from-orange-100 active:to-yellow-100"
                                  : "bg-gradient-to-r from-green-50 to-emerald-50 border-l-green-400 active:from-green-100 active:to-emerald-100"
                          }`}
                        >
                          <div
                            className={`flex items-start justify-between ${isMobileView ? "mb-2" : "mb-3"}`}
                          >
                            <div className="min-w-0 flex-1 max-w-full">
                              <div
                                className={`flex items-center gap-${isMobileView ? "2" : "3"}`}
                              >
                                <div
                                  className={`${isMobileView ? "p-2" : "p-3"} rounded-xl shadow-sm flex-shrink-0 ${
                                    isCompleted
                                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                      : percentage >= 75
                                        ? "bg-gradient-to-r from-red-400 to-red-500 text-white"
                                        : percentage >= 50
                                          ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                                          : "bg-gradient-to-r from-green-400 to-green-500 text-white"
                                  }`}
                                >
                                  <Calculator size={isMobileView ? 14 : 20} />
                                </div>

                                <div className="flex-1 min-w-0 max-w-full">
                                  <div
                                    className={`flex items-center gap-1.5 flex-wrap max-w-full ${isMobileView ? "mb-1.5" : "mb-2"}`}
                                  >
                                    <p
                                      className={`font-semibold text-gray-900 ${
                                        isMobileView
                                          ? "text-sm leading-tight"
                                          : "text-lg"
                                      }`}
                                      style={
                                        isMobileView
                                          ? {
                                              maxWidth: "120px",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }
                                          : {}
                                      }
                                    >
                                      {budget.name}
                                    </p>

                                    {budget.customCategories.length > 0 && (
                                      <span
                                        className={`px-1.5 py-0.5 rounded-md text-xs font-medium truncate flex items-center gap-1 ${
                                          percentage >= 75
                                            ? "bg-red-100/80 text-red-700"
                                            : percentage >= 50
                                              ? "bg-orange-100/80 text-orange-700"
                                              : "bg-green-100/80 text-green-700"
                                        }`}
                                      >
                                        <Tag size={10} />
                                        {budget.customCategories
                                          .map((category) => category.name)
                                          .join(", ")}
                                      </span>
                                    )}
                                    {isMobileView &&
                                      budget.customCategories.length > 2 && (
                                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium text-[10px]">
                                          +{budget.customCategories.length - 2}
                                        </span>
                                      )}
                                    {isCompleted && (
                                      <span
                                        className={`px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700 ${
                                          isMobileView
                                            ? "text-[10px]"
                                            : "text-sm"
                                        }`}
                                      >
                                        {isMobileView ? "⚠️" : "⚠️ Exceeded"}
                                      </span>
                                    )}
                                    {percentage >= 80 && !isCompleted && (
                                      <span
                                        className={`px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 ${
                                          isMobileView
                                            ? "text-[10px]"
                                            : "text-sm"
                                        }`}
                                      >
                                        {isMobileView ? "⚡" : "⚡ High"}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <span
                                      className={`text-gray-700 font-medium ${isMobileView ? "text-xs" : "text-base"}`}
                                    >
                                      {percentage.toFixed(0)}% spent
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Amounts in Top Right Corner */}
                            <div
                              className={`text-right ${isMobileView ? "ml-2" : "ml-3"} flex-shrink-0`}
                            >
                              {/* Original Currency Display */}
                              <div
                                className={`text-gray-800 font-bold ${isMobileView ? "text-xs leading-tight" : "text-base"} mb-0.5`}
                              >
                                {isMobileView ? (
                                  <div className="flex flex-col items-end">
                                    <span>
                                      {calculateBudgetSpent(
                                        budget
                                      ).toLocaleString(undefined, {
                                        maximumFractionDigits: 0,
                                      })}
                                    </span>
                                    <span className="text-[10px] text-gray-600">
                                      /{" "}
                                      {budget.limitAmount.toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 0 }
                                      )}{" "}
                                      {budget.currency}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    {calculateBudgetSpent(
                                      budget
                                    ).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}{" "}
                                    /{" "}
                                    {budget.limitAmount.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}{" "}
                                    {budget.currency}
                                  </>
                                )}
                              </div>

                              {/* Converted Currency Display */}
                              {showConversion && (
                                <div
                                  className={`text-gray-500 font-medium ${isMobileView ? "text-[10px] leading-tight" : "text-sm"}`}
                                >
                                  {isMobileView ? (
                                    <div className="flex flex-col items-end">
                                      <span>
                                        ≈{" "}
                                        {convertedSpent.toLocaleString(
                                          undefined,
                                          { maximumFractionDigits: 0 }
                                        )}
                                      </span>
                                      <span className="text-[9px]">
                                        /{" "}
                                        {convertedLimit.toLocaleString(
                                          undefined,
                                          { maximumFractionDigits: 0 }
                                        )}{" "}
                                        {displayCurrency}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      ≈{" "}
                                      {convertedSpent.toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}{" "}
                                      /{" "}
                                      {convertedLimit.toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}{" "}
                                      {displayCurrency}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar - Full Width at Bottom */}
                          <div
                            className={`w-full bg-gray-200 rounded-full shadow-inner ${isMobileView ? "h-2" : "h-3"} touch-none`}
                          >
                            <motion.div
                              className={`${isMobileView ? "h-2" : "h-3"} rounded-full ${getStatusColor(percentage).bar}`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(percentage, 100)}%`,
                              }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500 flex flex-col items-center gap-3">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-indigo-100/80 backdrop-blur-sm p-4 rounded-full border border-indigo-200/50 text-4xl"
                      >
                        💰
                      </motion.div>
                      <p>No budgets match your search criteria</p>
                      <motion.button
                        className="mt-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md touch-manipulation active:scale-95 duration-200"
                        onClick={() => setIsCreateModalOpen(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Create Your First Budget
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isMobileView && (
          <div className="col-span-5 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    className={`bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border border-blue-200/50 ${
                      isMobileView ? "p-1.5" : "p-2"
                    }`}
                  >
                    <Filter
                      size={isMobileView ? 16 : 18}
                      className="text-blue-600"
                    />
                  </motion.div>
                  <h3
                    className={`font-semibold text-gray-900 ${isMobileView ? "text-base" : "text-lg"}`}
                  >
                    Filters
                  </h3>
                </div>

                <div className="relative currency-dropdown">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-md flex items-center transition-all touch-manipulation ${
                      isMobileView
                        ? "p-2 px-3 rounded-lg text-xs active:scale-90 duration-200"
                        : "p-2 px-3 rounded-lg text-sm"
                    }`}
                    onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                    title="Select currency"
                    disabled={fetchingRates}
                  >
                    {displayCurrency}
                    {!fetchingRates && (
                      <ChevronDown size={14} className="ml-1" />
                    )}
                    {fetchingRates && (
                      <RefreshCw size={12} className="animate-spin ml-1" />
                    )}
                  </motion.button>

                  {isCurrencyMenuOpen && availableCurrencies.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-32 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-indigo-200/50 z-[9999] overflow-hidden"
                    >
                      <div className="max-h-48 overflow-y-auto">
                        {availableCurrencies.map((curr) => (
                          <motion.button
                            key={curr}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                              curr === displayCurrency
                                ? "bg-indigo-100 text-indigo-700 font-medium"
                                : "text-gray-700 hover:bg-indigo-50"
                            }`}
                            onClick={() => handleCurrencyChange(curr)}
                          >
                            {curr}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <SearchWithSuggestions
                  placeholder="Search by budget name..."
                  onSearch={setNameSearchTerm}
                  suggestions={budgetNames}
                  variant="budget"
                />
                <SearchWithSuggestions
                  placeholder="Search by category..."
                  onSearch={setCategorySearchTerm}
                  suggestions={allBudgetCategories}
                  variant="budget"
                />
              </div>
            </div>

            <div
              className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${
                isMobileView ? "p-2 mx-2 mb-20" : "p-4"
              } flex flex-col`}
              style={{
                height: isMobileView
                  ? "calc(100vh - 350px)"
                  : "calc(100vh - 386px)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    className={`bg-gradient-to-r from-red-100 to-red-100 rounded-xl border border-red-200/50 ${
                      isMobileView ? "p-1.5" : "p-2"
                    }`}
                  >
                    <Receipt
                      size={isMobileView ? 14 : 18}
                      className="text-red-600"
                    />
                  </motion.div>
                  <div>
                    <h3
                      className={`font-semibold text-gray-900 ${isMobileView ? "text-sm" : "text-lg"}`}
                    >
                      Transactions
                    </h3>
                    <p
                      className={`text-gray-500 ${isMobileView ? "text-xs" : "text-xs"}`}
                    >
                      {transactionsLoading
                        ? "Loading..."
                        : `${filteredTransactions.length} found`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="relative">
                  <Search
                    size={isMobileView ? 12 : 14}
                    className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-red-400"
                  />
                  <input
                    type="text"
                    placeholder={
                      isMobileView ? "Search..." : "Search transactions..."
                    }
                    value={transactionSearchTerm}
                    onChange={(e) => setTransactionSearchTerm(e.target.value)}
                    className={`w-full ${isMobileView ? "pl-8" : "pl-8"} pr-3 py-2 ${
                      isMobileView ? "text-xs" : "text-sm"
                    } border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors shadow-sm bg-red-50/50`}
                  />
                  {transactionSearchTerm && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600"
                      onClick={() => setTransactionSearchTerm("")}
                    >
                      <X size={isMobileView ? 12 : 14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {transactionsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2
                        size={isMobileView ? 20 : 24}
                        className="animate-spin text-red-600 mx-auto mb-2"
                      />
                      <p
                        className={`text-gray-500 ${isMobileView ? "text-xs" : "text-sm"}`}
                      >
                        Loading transactions...
                      </p>
                    </div>
                  </div>
                ) : transactionsError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-red-500">
                      <AlertTriangle
                        size={isMobileView ? 20 : 24}
                        className="mx-auto mb-2"
                      />
                      <p className={`${isMobileView ? "text-xs" : "text-sm"}`}>
                        {transactionsError}
                      </p>
                    </div>
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  <div className={`space-y-${isMobileView ? "1.5" : "3"}`}>
                    {filteredTransactions.slice(0, 20).map((transaction) => {
                      const categoryId = (transaction as any)
                        .transactionCategories?.[0]?.customCategoryId;
                      const budget = categoryId
                        ? budgets?.find((b) =>
                            b.customCategories.some(
                              (cat) => String(cat.id) === String(categoryId)
                            )
                          )
                        : null;
                      const convertedAmount = convertToDisplayCurrency(
                        transaction.amount,
                        transaction.currency
                      );

                      const displayName =
                        transaction.name ||
                        transaction.description ||
                        "Untitled Transaction";

                      const showConversion =
                        transaction.currency !== displayCurrency;

                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileTap={{ scale: isMobileView ? 0.97 : 0.98 }}
                          onClick={() => handleTransactionPreview(transaction)}
                          className={`rounded-xl ${isMobileView ? "p-3 active:scale-95" : "p-4"} border-l-4 shadow-sm hover:shadow-md active:shadow-lg transition-all duration-200 touch-manipulation select-none cursor-pointer ${
                            transaction.type === "EXPENSE"
                              ? "bg-gradient-to-r from-red-50 to-red-100 border-l-red-500 active:from-red-100 active:to-red-150"
                              : transaction.type === "INCOME"
                                ? "bg-gradient-to-r from-green-50 to-green-100 border-l-green-500 active:from-green-100 active:to-green-150"
                                : "bg-gradient-to-r from-blue-50 to-blue-100 border-l-blue-500 active:from-blue-100 active:to-blue-150"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div
                                className={`flex items-center gap-${isMobileView ? "2" : "3"} ${isMobileView ? "mb-1.5" : "mb-2"}`}
                              >
                                <div
                                  className={`${isMobileView ? "p-2" : "p-3"} rounded-xl shadow-sm flex-shrink-0 ${
                                    transaction.type === "EXPENSE"
                                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                      : transaction.type === "INCOME"
                                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                  }`}
                                >
                                  <Receipt size={isMobileView ? 12 : 16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4
                                    className={`font-medium text-gray-900 ${isMobileView ? "text-[11px] leading-tight" : "text-base"}`}
                                    style={
                                      isMobileView
                                        ? {
                                            maxWidth: "120px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }
                                        : {}
                                    }
                                    title={displayName}
                                  >
                                    {isMobileView && displayName.length > 12
                                      ? displayName.substring(0, 12) + "..."
                                      : displayName}
                                  </h4>
                                  <div className={`flex flex-wrap gap-1 mt-1`}>
                                    {(
                                      transaction.transactionCategories || []
                                    ).map(
                                      (category: {
                                        customCategoryId: number;
                                        customCategory?: { name: string };
                                      }) => (
                                        <span
                                          key={category.customCategoryId}
                                          className="text-xs px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-700 font-semibold truncate flex items-center gap-1"
                                        >
                                          <Tag size={10} />
                                          {category.customCategory?.name ||
                                            "Uncategorized"}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Transaction Amounts in Right Side */}
                            <div
                              className={`text-right ${isMobileView ? "ml-1.5" : "ml-3"} flex-shrink-0`}
                            >
                              {/* Original Currency */}
                              <div
                                className={`font-bold ${isMobileView ? "text-[11px] leading-tight" : "text-base"} mb-0.5 ${
                                  transaction.type === "EXPENSE"
                                    ? "text-red-600"
                                    : transaction.type === "INCOME"
                                      ? "text-green-600"
                                      : "text-blue-600"
                                }`}
                              >
                                {isMobileView ? (
                                  <div className="flex flex-col items-end">
                                    <span>
                                      {transaction.amount.toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 0 }
                                      )}
                                    </span>
                                    <span className="text-[9px] text-gray-600">
                                      {transaction.currency}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    {transaction.amount.toFixed(2)}{" "}
                                    {transaction.currency}
                                  </>
                                )}
                              </div>

                              {/* Converted Currency */}
                              {showConversion && (
                                <div
                                  className={`text-gray-500 font-medium ${isMobileView ? "text-[9px] leading-tight" : "text-sm"}`}
                                >
                                  {isMobileView ? (
                                    <div className="flex flex-col items-end">
                                      <span>
                                        ≈{" "}
                                        {convertedAmount.toLocaleString(
                                          undefined,
                                          { maximumFractionDigits: 0 }
                                        )}
                                      </span>
                                      <span className="text-[8px]">
                                        {displayCurrency}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      ≈ {convertedAmount.toFixed(2)}{" "}
                                      {displayCurrency}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {filteredTransactions.length > 20 && (
                      <div
                        className={`text-center text-gray-500 py-2 ${isMobileView ? "text-xs" : "text-sm"}`}
                      >
                        Showing 20 of {filteredTransactions.length} transactions
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`bg-red-100/80 rounded-full mb-2 inline-block ${isMobileView ? "p-3" : "p-4"}`}
                      >
                        <Receipt
                          size={isMobileView ? 20 : 24}
                          className="text-red-600"
                        />
                      </motion.div>
                      <p className={`${isMobileView ? "text-xs" : "text-sm"}`}>
                        {filteredBudgets.length === 0
                          ? "Filter budgets to see related transactions"
                          : "No transactions found for selected budgets"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isMobileView && (
          <div className="mx-2">
            <div
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 mb-20 flex flex-col"
              style={{ height: "calc(100vh - 350px)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    className={`bg-gradient-to-r from-red-100 to-red-100 rounded-xl border border-red-200/50 ${
                      isMobileView ? "p-1.5" : "p-2"
                    }`}
                  >
                    <Receipt
                      size={isMobileView ? 14 : 18}
                      className="text-red-600"
                    />
                  </motion.div>
                  <div>
                    <h3
                      className={`font-semibold text-gray-900 ${isMobileView ? "text-sm" : "text-lg"}`}
                    >
                      Transactions
                    </h3>
                    <p
                      className={`text-gray-500 ${isMobileView ? "text-xs" : "text-xs"}`}
                    >
                      {transactionsLoading
                        ? "Loading..."
                        : `${filteredTransactions.length} found`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="relative">
                  <Search
                    size={isMobileView ? 12 : 14}
                    className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-red-400"
                  />
                  <input
                    type="text"
                    placeholder={
                      isMobileView ? "Search..." : "Search transactions..."
                    }
                    value={transactionSearchTerm}
                    onChange={(e) => setTransactionSearchTerm(e.target.value)}
                    className={`w-full ${isMobileView ? "pl-8" : "pl-8"} pr-3 py-2 ${
                      isMobileView ? "text-xs" : "text-sm"
                    } border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors shadow-sm bg-red-50/50`}
                  />
                  {transactionSearchTerm && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600"
                      onClick={() => setTransactionSearchTerm("")}
                    >
                      <X size={isMobileView ? 12 : 14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {transactionsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2
                        size={isMobileView ? 20 : 24}
                        className="animate-spin text-red-600 mx-auto mb-2"
                      />
                      <p
                        className={`text-gray-500 ${isMobileView ? "text-xs" : "text-sm"}`}
                      >
                        Loading transactions...
                      </p>
                    </div>
                  </div>
                ) : transactionsError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-red-500">
                      <AlertTriangle
                        size={isMobileView ? 20 : 24}
                        className="mx-auto mb-2"
                      />
                      <p className={`${isMobileView ? "text-xs" : "text-sm"}`}>
                        {transactionsError}
                      </p>
                    </div>
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  <div className={`space-y-${isMobileView ? "1.5" : "3"}`}>
                    {filteredTransactions.slice(0, 20).map((transaction) => {
                      const categoryId = (transaction as any)
                        .transactionCategories?.[0]?.customCategoryId;
                      const convertedAmount = convertToDisplayCurrency(
                        transaction.amount,
                        transaction.currency
                      );

                      const displayName =
                        transaction.name ||
                        transaction.description ||
                        "Untitled Transaction";

                      const showConversion =
                        transaction.currency !== displayCurrency;

                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileTap={{ scale: isMobileView ? 0.97 : 0.98 }}
                          onClick={() => handleTransactionPreview(transaction)}
                          className={`rounded-xl ${isMobileView ? "p-3 active:scale-95" : "p-4"} border-l-4 shadow-sm hover:shadow-md active:shadow-lg transition-all duration-200 touch-manipulation select-none cursor-pointer ${
                            transaction.type === "EXPENSE"
                              ? "bg-gradient-to-r from-red-50 to-red-100 border-l-red-500 active:from-red-100 active:to-red-150"
                              : transaction.type === "INCOME"
                                ? "bg-gradient-to-r from-green-50 to-green-100 border-l-green-500 active:from-green-100 active:to-green-150"
                                : "bg-gradient-to-r from-blue-50 to-blue-100 border-l-blue-500 active:from-blue-100 active:to-blue-150"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div
                                className={`flex items-center gap-${isMobileView ? "2" : "3"} ${isMobileView ? "mb-1.5" : "mb-2"}`}
                              >
                                <div
                                  className={`${isMobileView ? "p-2" : "p-3"} rounded-xl shadow-sm flex-shrink-0 ${
                                    transaction.type === "EXPENSE"
                                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                      : transaction.type === "INCOME"
                                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                  }`}
                                >
                                  <Receipt size={isMobileView ? 12 : 16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4
                                    className={`font-medium text-gray-900 ${isMobileView ? "text-[11px] leading-tight" : "text-base"}`}
                                    style={
                                      isMobileView
                                        ? {
                                            maxWidth: "120px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }
                                        : {}
                                    }
                                    title={displayName}
                                  >
                                    {isMobileView && displayName.length > 12
                                      ? displayName.substring(0, 12) + "..."
                                      : displayName}
                                  </h4>
                                  <div className={`flex flex-wrap gap-1 mt-1`}>
                                    {(
                                      transaction.transactionCategories || []
                                    ).map(
                                      (category: {
                                        customCategoryId: number;
                                        customCategory?: { name: string };
                                      }) => (
                                        <span
                                          key={category.customCategoryId}
                                          className="text-xs px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-700 font-semibold truncate flex items-center gap-1"
                                        >
                                          <Tag size={10} />
                                          {category.customCategory?.name ||
                                            "Uncategorized"}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Transaction Amounts in Right Side */}
                            <div
                              className={`text-right ${isMobileView ? "ml-1.5" : "ml-3"} flex-shrink-0`}
                            >
                              {/* Original Currency */}
                              <div
                                className={`font-bold ${isMobileView ? "text-[11px] leading-tight" : "text-base"} mb-0.5 ${
                                  transaction.type === "EXPENSE"
                                    ? "text-red-600"
                                    : transaction.type === "INCOME"
                                      ? "text-green-600"
                                      : "text-blue-600"
                                }`}
                              >
                                {isMobileView ? (
                                  <div className="flex flex-col items-end">
                                    <span>
                                      {transaction.amount.toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 0 }
                                      )}
                                    </span>
                                    <span className="text-[9px] text-gray-600">
                                      {transaction.currency}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    {transaction.amount.toFixed(2)}{" "}
                                    {transaction.currency}
                                  </>
                                )}
                              </div>

                              {/* Converted Currency */}
                              {showConversion && (
                                <div
                                  className={`text-gray-500 font-medium ${isMobileView ? "text-[9px] leading-tight" : "text-sm"}`}
                                >
                                  {isMobileView ? (
                                    <div className="flex flex-col items-end">
                                      <span>
                                        ≈{" "}
                                        {convertedAmount.toLocaleString(
                                          undefined,
                                          { maximumFractionDigits: 0 }
                                        )}
                                      </span>
                                      <span className="text-[8px]">
                                        {displayCurrency}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      ≈ {convertedAmount.toFixed(2)}{" "}
                                      {displayCurrency}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {filteredTransactions.length > 20 && (
                      <div
                        className={`text-center text-gray-500 py-2 ${isMobileView ? "text-xs" : "text-sm"}`}
                      >
                        Showing 20 of {filteredTransactions.length} transactions
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`bg-red-100/80 rounded-full mb-2 inline-block ${isMobileView ? "p-3" : "p-4"}`}
                      >
                        <Receipt
                          size={isMobileView ? 20 : 24}
                          className="text-red-600"
                        />
                      </motion.div>
                      <p className={`${isMobileView ? "text-xs" : "text-sm"}`}>
                        {filteredBudgets.length === 0
                          ? "Filter budgets to see related transactions"
                          : "No transactions found for selected budgets"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateNewBudget
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          categories={categories}
          onSuccess={handleCreateSuccess}
        />
      )}

      {isEditModalOpen && selectedBudget && (
        <EditBudget
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          budget={selectedBudget}
          categories={categories}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Budget Preview Modal */}
      {selectedBudgetPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          onClick={() => setSelectedBudgetPreview(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Budget Details
                </h3>
                <button
                  onClick={() => setSelectedBudgetPreview(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">
                    {selectedBudgetPreview.name}
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedBudgetPreview.customCategories.map((category) => (
                      <span
                        key={category.id}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium text-sm"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">
                      Original Currency
                    </p>
                    <p className="font-bold text-gray-900">
                      {calculateBudgetSpent(
                        selectedBudgetPreview
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      /{" "}
                      {selectedBudgetPreview.limitAmount.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}{" "}
                      {selectedBudgetPreview.currency}
                    </p>
                  </div>

                  {selectedBudgetPreview.currency !== displayCurrency && (
                    <div className="bg-indigo-50 p-4 rounded-xl">
                      <p className="text-sm text-indigo-600 mb-1">
                        Converted ({displayCurrency})
                      </p>
                      <p className="font-bold text-indigo-900">
                        {convertToDisplayCurrency(
                          calculateBudgetSpent(selectedBudgetPreview),
                          selectedBudgetPreview.currency
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        /{" "}
                        {convertToDisplayCurrency(
                          selectedBudgetPreview.limitAmount,
                          selectedBudgetPreview.currency
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {displayCurrency}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">
                      {calculatePercentage(
                        calculateBudgetSpent(selectedBudgetPreview),
                        selectedBudgetPreview.limitAmount
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getStatusColor(calculatePercentage(calculateBudgetSpent(selectedBudgetPreview), selectedBudgetPreview.limitAmount)).bar}`}
                      style={{
                        width: `${Math.min(calculatePercentage(calculateBudgetSpent(selectedBudgetPreview), selectedBudgetPreview.limitAmount), 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedBudgetPreview(null);
                      handleEditBudget(selectedBudgetPreview);
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    Edit Budget
                  </button>
                  <button
                    onClick={() => setSelectedBudgetPreview(null)}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Transaction Preview Modal */}
      {selectedTransactionPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          onClick={() => setSelectedTransactionPreview(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Transaction Details
                </h3>
                <button
                  onClick={() => setSelectedTransactionPreview(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-3 rounded-xl shadow-sm ${
                      selectedTransactionPreview.type === "EXPENSE"
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                        : selectedTransactionPreview.type === "INCOME"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    }`}
                  >
                    <Receipt size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900">
                      {selectedTransactionPreview.name ||
                        selectedTransactionPreview.description ||
                        "Untitled Transaction"}
                    </h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {selectedTransactionPreview.type.toLowerCase()}{" "}
                      Transaction
                    </p>
                  </div>
                </div>

                {selectedTransactionPreview.description &&
                  selectedTransactionPreview.name && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Description</p>
                      <p className="text-gray-900">
                        {selectedTransactionPreview.description}
                      </p>
                    </div>
                  )}

                <div className="grid grid-cols-1 gap-4">
                  <div
                    className={`p-4 rounded-xl ${
                      selectedTransactionPreview.type === "EXPENSE"
                        ? "bg-red-50"
                        : selectedTransactionPreview.type === "INCOME"
                          ? "bg-green-50"
                          : "bg-blue-50"
                    }`}
                  >
                    <p
                      className={`text-sm mb-1 ${
                        selectedTransactionPreview.type === "EXPENSE"
                          ? "text-red-600"
                          : selectedTransactionPreview.type === "INCOME"
                            ? "text-green-600"
                            : "text-blue-600"
                      }`}
                    >
                      Original Amount
                    </p>
                    <p
                      className={`font-bold text-lg ${
                        selectedTransactionPreview.type === "EXPENSE"
                          ? "text-red-900"
                          : selectedTransactionPreview.type === "INCOME"
                            ? "text-green-900"
                            : "text-blue-900"
                      }`}
                    >
                      {selectedTransactionPreview.amount.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}{" "}
                      {selectedTransactionPreview.currency}
                    </p>
                  </div>

                  {selectedTransactionPreview.currency !== displayCurrency && (
                    <div className="bg-indigo-50 p-4 rounded-xl">
                      <p className="text-sm text-indigo-600 mb-1">
                        Converted ({displayCurrency})
                      </p>
                      <p className="font-bold text-lg text-indigo-900">
                        {convertToDisplayCurrency(
                          selectedTransactionPreview.amount,
                          selectedTransactionPreview.currency
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {displayCurrency}
                      </p>
                    </div>
                  )}
                </div>

                {(() => {
                  const categoryInfo = (selectedTransactionPreview as any)
                    .transactionCategories?.[0]?.customCategory;
                  return (
                    categoryInfo && (
                      <div className="bg-purple-50 p-4 rounded-xl">
                        <p className="text-sm text-purple-600 mb-2">Category</p>
                        <div className="space-y-2">
                          {(
                            selectedTransactionPreview.transactionCategories ||
                            []
                          ).map(
                            (category: {
                              customCategoryId: number;
                              customCategory?: { name: string };
                            }) => (
                              <span
                                key={category.customCategoryId}
                                className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium text-sm mr-2 mb-2"
                              >
                                {category.customCategory?.name ||
                                  "Uncategorized"}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )
                  );
                })()}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSelectedTransactionPreview(null)}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <AIBudgetRecommendationsModal
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          setAiRecommendations([]);
          setAiError(undefined);
        }}
        onApplyRecommendations={handleApplyAIRecommendations}
        currentBudgets={budgets || []}
        categories={categories}
        isLoading={isLoadingAI}
        recommendations={aiRecommendations}
        error={aiError}
      />
    </div>
  );
};

export default BudgetDashboard;
