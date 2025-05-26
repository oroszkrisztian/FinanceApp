import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Budget } from "../../interfaces/Budget";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { useAuth } from "../../context/AuthContext";
import EmptyBudget from "./EmptyBudget";
import CreateNewBudget from "./CreateNewBudget";
import EditBudget from "./EditBudget";
import { deleteUserBudget } from "../../services/budgetService";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, Tag, TrendingUp, Search, X } from "lucide-react";

interface BudgetsProps {
  budgets: Budget[] | null;
  categories: CustomCategory[];
  onSuccess?: () => void;
}

const Budgets: React.FC<BudgetsProps> = ({
  budgets,
  categories,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [selectedSearchResult, setSelectedSearchResult] =
    useState<Budget | null>(null);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [updatedBudgetId, setUpdatedBudgetId] = useState<number | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // New filter states
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [sortByPercentage, setSortByPercentage] = useState("high-to-low");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const cardVariants = {
    updated: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 8px 30px rgba(0,0,0,0.1)",
        "0 8px 30px rgba(79, 70, 229, 0.4)",
        "0 8px 30px rgba(0,0,0,0.1)",
      ],
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const menuButtonRefs = useRef<Map<string, HTMLButtonElement | null>>(
    new Map()
  );

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const buttonRef = menuButtonRefs.current.get(openMenuId);
        const menuElement = document.querySelector(
          `[data-menu-id="${openMenuId}"]`
        );
        if (
          buttonRef &&
          !buttonRef.contains(event.target as Node) &&
          menuElement &&
          !menuElement.contains(event.target as Node)
        ) {
          setOpenMenuId(null);
        }
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }

      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }

      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const calculatePercentage = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    return Math.min(percentage, 100);
  };

  const getGradientColor = (percentage: number) => {
    let r, g, b;
    if (percentage <= 50) {
      r = 50 + (percentage / 50) * (255 - 50);
      g = 200 + (percentage / 50) * (230 - 200);
      b = 100 - (percentage / 50) * 100;
    } else {
      r = 255;
      g = 230 - ((percentage - 50) / 50) * (230 - 60);
      b = 0 + ((percentage - 50) / 50) * 60;
    }
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  const getLightColor = (color: string) => {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return "rgba(240, 253, 244, 0.8)";
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  };

  const getTextColor = (percentage: number) => {
    if (percentage > 75) return "#991B1B";
    if (percentage > 50) return "#9A3412";
    return "#065F46";
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteBudget = async (budget: Budget) => {
    if (!user) {
      setError("User not found");
      return;
    }
    try {
      const response = await deleteUserBudget(user.id, budget.id);
      if (response.error) {
        setError(response.error);
        return;
      }
      setOpenMenuId(null);
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting budget:", error);
      setError("Failed to delete budget");
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setSelectedSearchResult(null);
    setShowSearchDropdown(true);
  };

  const selectSearchResult = (budget: Budget) => {
    setSelectedSearchResult(budget);
    setSearchInput(budget.name);
    setShowSearchDropdown(false);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSelectedSearchResult(null);
  };

  // Category suggestions based on search
  const filteredCategorySuggestions = useMemo(() => {
    const allCategories = new Set<string>();
    budgets?.forEach((budget) => {
      budget.customCategories.forEach((cat) => {
        allCategories.add(cat.name);
      });
    });
    const categoryArray = Array.from(allCategories);

    if (!categorySearchTerm.trim()) {
      return categoryArray;
    }

    return categoryArray.filter((cat) =>
      cat.toLowerCase().includes(categorySearchTerm.toLowerCase())
    );
  }, [budgets, categorySearchTerm]);

  const searchResults =
    budgets?.filter((budget) =>
      budget.name.toLowerCase().includes(searchInput.toLowerCase())
    ) || [];

  // Enhanced filtering and sorting logic
  const filteredAndSortedBudgets = useMemo(() => {
    if (!budgets) return [];

    let filtered = budgets.filter((budget) => {
      // Name search filter
      const nameMatch = selectedSearchResult
        ? budget.id === selectedSearchResult.id
        : searchInput === "" ||
          budget.name.toLowerCase().includes(searchInput.toLowerCase());

      // Category filter
      const categoryMatch =
        selectedCategory === "" ||
        budget.customCategories.some((cat) =>
          cat.name.toLowerCase().includes(selectedCategory.toLowerCase())
        );

      return nameMatch && categoryMatch;
    });

    // Sort by percentage if selected
    if (sortByPercentage === "high-to-low") {
      filtered = filtered.sort((a, b) => {
        const percentageA = calculatePercentage(a.currentSpent, a.limitAmount);
        const percentageB = calculatePercentage(b.currentSpent, b.limitAmount);
        return percentageB - percentageA;
      });
    } else if (sortByPercentage === "low-to-high") {
      filtered = filtered.sort((a, b) => {
        const percentageA = calculatePercentage(a.currentSpent, a.limitAmount);
        const percentageB = calculatePercentage(b.currentSpent, b.limitAmount);
        return percentageA - percentageB;
      });
    }

    return filtered;
  }, [
    budgets,
    searchInput,
    selectedSearchResult,
    selectedCategory,
    sortByPercentage,
  ]);

  const hasActiveFilters =
    searchInput !== "" ||
    selectedSearchResult !== null ||
    selectedCategory !== "" ||
    (sortByPercentage !== "" && sortByPercentage !== "high-to-low");

  const handleSuccessCallback = useCallback(
    (budgetId?: number) => {
      if (budgetId) {
        setUpdatedBudgetId(budgetId);
      }
      onSuccess?.();
      setTimeout(() => {
        setUpdatedBudgetId(null);
      }, 1500);
    },
    [onSuccess]
  );

  const renderBudgetCards = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={isReloading ? "reloading" : "loaded"}
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-1 h-full max-h-[calc(100vh-200px)] pb-4"
      >
        {filteredAndSortedBudgets.map((budget, index) => {
          const percentage = calculatePercentage(
            budget.currentSpent,
            budget.limitAmount
          );
          const remainingAmount = budget.limitAmount - budget.currentSpent;
          const mainColor = getGradientColor(percentage);
          const lightColor = getLightColor(mainColor);
          const textColor = getTextColor(percentage);

          return (
            <motion.div
              key={budget.id}
              variants={itemVariants}
              animate={updatedBudgetId === budget.id ? "updated" : undefined}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="relative bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden backdrop-blur-sm"
              style={{
                background: `radial-gradient(circle at top right, ${getLightColor(mainColor)}, white 70%)`,
              }}
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 opacity-20 rounded-bl-[100%]"
                style={{ backgroundColor: mainColor }}
              />

              <div className="absolute bottom-0 left-0 right-0 h-20 z-0 overflow-hidden opacity-60">
                <div
                  className="absolute bottom-0 left-0 w-full h-full z-0"
                  style={{
                    backgroundColor: mainColor,
                    clipPath:
                      "path('M0,50 Q50,0 100,50 T200,50 T300,50 T400,50 L400,100 L0,100 Z')",
                  }}
                />
              </div>

              <div className="relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 tracking-tight truncate group-hover:text-gray-900">
                      {budget.name}
                    </h3>
                  </div>

                  <div className="relative">
                    <button
                      ref={(el) =>
                        menuButtonRefs.current.set(String(budget.id), el)
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === String(budget.id)
                            ? null
                            : String(budget.id)
                        );
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-100 group -mr-2 -mt-1"
                      aria-label="More options"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-600 group-hover:text-gray-900 transition-colors duration-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {openMenuId === String(budget.id) && (
                      <div
                        data-menu-id={String(budget.id)}
                        className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 w-64 py-1.5 backdrop-blur-sm bg-white/95"
                        style={{
                          boxShadow:
                            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                          Budget Options
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBudget(budget);
                          }}
                          className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:translate-x-1"
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-medium">Edit Budget</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Modify budget details and settings
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBudget(budget);
                          }}
                          className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:translate-x-1 mt-1 mb-1"
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-50 text-red-600 mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <span className="font-medium">Delete Budget</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Remove this budget permanently
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{
                    backgroundColor: lightColor,
                    color: textColor,
                  }}
                >
                  {`${percentage.toFixed(0)}% Used`}
                </span>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-1">
                        Spent
                      </p>
                      <p
                        className="text-2xl font-bold bg-clip-text text-transparent"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${mainColor}, ${textColor})`,
                        }}
                      >
                        {budget.currency}{" "}
                        {budget.currentSpent.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          backgroundColor: mainColor,
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 font-medium">
                          {remainingAmount > 0
                            ? "Remaining"
                            : remainingAmount === 0
                              ? "Budget Limit"
                              : "Exceeded By"}
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{ color: textColor }}
                        >
                          {remainingAmount > 0
                            ? `${budget.currency} ${remainingAmount.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}`
                            : remainingAmount === 0
                              ? `${budget.currency} ${budget.limitAmount.toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}`
                              : `${budget.currency} ${Math.abs(
                                  remainingAmount
                                ).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`}
                        </p>
                      </div>
                      {remainingAmount <= 0 && (
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Total Budget</span>
                          <span>
                            {budget.currency}{" "}
                            {budget.limitAmount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {budget.customCategories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="p-2 h-full flex flex-col">
      {!budgets || budgets.length === 0 ? (
        <EmptyBudget categories={categories} onSuccess={onSuccess} />
      ) : (
        <div className="flex flex-col h-full margin-auto">
          <AnimatePresence>
            <motion.div
              className="sticky top-0 z-10 mb-5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <motion.div
                className="flex lg:justify-between items-center flex-col sm:flex-row sm:items-center bg-white p-3 rounded-xl shadow-sm border border-indigo-100"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
              >
                <motion.div
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:mr-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  {/* Search */}
                  <div ref={searchRef} className="relative sm:max-w-60 w-full">
                    <div
                      className="flex items-center bg-indigo-50/70 border border-indigo-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent group hover:bg-indigo-50 h-[42px]"
                      onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                    >
                      <div className="px-3 text-indigo-400">
                        <svg
                          className="h-5 w-5 group-hover:text-indigo-500"
                          xmlns="http://www.w3.org/2000/svg"
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
                        ref={searchInputRef}
                        type="text"
                        className="w-full py-2.5 bg-transparent outline-none text-gray-900 font-medium placeholder-gray-500"
                        placeholder="Search budgets..."
                        value={
                          selectedSearchResult
                            ? selectedSearchResult.name
                            : searchInput
                        }
                        onChange={handleSearchInputChange}
                        onClick={() => {
                          setShowSearchDropdown(true);
                          setSearchInput("");
                        }}
                      />

                      {(searchInput || selectedSearchResult) && (
                        <button
                          type="button"
                          className="px-3 text-indigo-400 hover:text-indigo-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearSearch();
                          }}
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
                      )}

                      <div className="px-2 text-indigo-400">
                        <svg
                          className={`w-4 h-4 ${showSearchDropdown ? "transform rotate-180 text-indigo-600" : "text-indigo-400 group-hover:text-indigo-500"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {showSearchDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-indigo-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
                            <svg
                              className="w-5 h-5 mr-2 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                            No matching budgets found
                          </div>
                        ) : (
                          <div className="py-1">
                            {searchResults.map((budget) => {
                              const percentage = calculatePercentage(
                                budget.currentSpent,
                                budget.limitAmount
                              );
                              const mainColor = getGradientColor(percentage);
                              const lightColor = getLightColor(mainColor);
                              const textColor = getTextColor(percentage);

                              return (
                                <div
                                  key={budget.id}
                                  className="px-4 py-3 hover:bg-indigo-50 cursor-pointer"
                                  onClick={() => selectSearchResult(budget)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-700">
                                      {budget.name}
                                    </span>
                                    <span
                                      className="text-xs px-2 py-1 rounded-full font-medium"
                                      style={{
                                        backgroundColor: lightColor,
                                        color: textColor,
                                      }}
                                    >
                                      {budget.currency}{" "}
                                      {budget.currentSpent.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Category Filter with Search + Dropdown */}
                  {(!isSmallScreen || isFilterExpanded) && (
                    <div
                      className="relative sm:max-w-48 w-full"
                      ref={categoryDropdownRef}
                    >
                      <div className="flex items-center bg-indigo-50/70 border border-indigo-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent group hover:bg-indigo-50 h-[42px]">
                        <div className="px-3 text-indigo-400">
                          <Tag size={16} />
                        </div>
                        <input
                          type="text"
                          className="w-full py-2.5 bg-transparent outline-none text-gray-900 font-medium placeholder-gray-500 text-sm"
                          placeholder={selectedCategory || "Category..."}
                          value={categorySearchTerm}
                          onChange={(e) => {
                            setCategorySearchTerm(e.target.value);
                            setIsCategoryDropdownOpen(true);
                          }}
                          onFocus={() => setIsCategoryDropdownOpen(true)}
                        />
                        {selectedCategory && (
                          <button
                            type="button"
                            className="px-2 text-indigo-400 hover:text-indigo-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory("");
                              setCategorySearchTerm("");
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                        <div className="px-2 text-indigo-400">
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>

                      {isCategoryDropdownOpen && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-indigo-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          <button
                            className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 text-gray-700"
                            onClick={() => {
                              setSelectedCategory("");
                              setCategorySearchTerm("");
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            All Categories
                          </button>
                          {filteredCategorySuggestions.map((category) => (
                            <button
                              key={category}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 ${
                                selectedCategory === category
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-gray-700"
                              }`}
                              onClick={() => {
                                setSelectedCategory(category);
                                setCategorySearchTerm("");
                                setIsCategoryDropdownOpen(false);
                              }}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sort by Percentage */}
                  {(!isSmallScreen || isFilterExpanded) && (
                    <div
                      className="relative sm:max-w-44 w-full"
                      ref={sortDropdownRef}
                    >
                      <button
                        className="w-full flex items-center justify-between bg-indigo-50/70 border border-indigo-200 rounded-lg px-3 py-2.5 text-left hover:bg-indigo-50 transition-colors h-[42px]"
                        onClick={() =>
                          setIsSortDropdownOpen(!isSortDropdownOpen)
                        }
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-indigo-400" />
                          <span className="text-gray-700 text-sm">
                            {sortByPercentage === "high-to-low"
                              ? "High to Low"
                              : sortByPercentage === "low-to-high"
                                ? "Low to High"
                                : "Sort %"}
                          </span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-indigo-400 transition-transform ${isSortDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isSortDropdownOpen && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-indigo-200 rounded-lg shadow-lg">
                          <button
                            className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 text-gray-700"
                            onClick={() => {
                              setSortByPercentage("");
                              setIsSortDropdownOpen(false);
                            }}
                          >
                            No Sorting
                          </button>
                          <button
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 ${
                              sortByPercentage === "high-to-low"
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-700"
                            }`}
                            onClick={() => {
                              setSortByPercentage("high-to-low");
                              setIsSortDropdownOpen(false);
                            }}
                          >
                            High to Low %
                          </button>
                          <button
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 ${
                              sortByPercentage === "low-to-high"
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-700"
                            }`}
                            onClick={() => {
                              setSortByPercentage("low-to-high");
                              setIsSortDropdownOpen(false);
                            }}
                          >
                            Low to High %
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Filter Toggle for Mobile */}
                  {isSmallScreen && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors relative"
                      onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    >
                      <Filter size={20} />
                      {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          !
                        </span>
                      )}
                    </motion.button>
                  )}
                </motion.div>

                <motion.button
                  onClick={() => setIsModalOpen(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center whitespace-nowrap"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
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
                  Create
                </motion.button>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div className="flex-1 overflow-hidden">{renderBudgetCards()}</div>

          {isModalOpen && (
            <CreateNewBudget
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              categories={categories}
              onSuccess={handleSuccessCallback}
            />
          )}

          {isEditModalOpen && selectedBudget && (
            <EditBudget
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              budget={selectedBudget}
              categories={categories}
              onSuccess={handleSuccessCallback}
              color={getGradientColor(
                calculatePercentage(
                  selectedBudget.currentSpent,
                  selectedBudget.limitAmount
                )
              )}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Budgets;
