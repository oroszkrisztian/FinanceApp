import { useState, useEffect } from "react";

import { motion } from "framer-motion";
import { Budget } from "../../interfaces/Budget";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { useAuth } from "../../context/AuthContext";
import { getAllSystemCategories } from "../../services/categoriesService";
import EmptyBudget from "./EmptyBudget";
import CreateNewBudget from "./CreateNewBudget";
import { getCategoriesByBudgetId } from "../../services/budgetService";

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [systemCategories, setSystemCategories] = useState<CustomCategory[]>(
    []
  );
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSystemCategories = async () => {
      try {
        const data = await getAllSystemCategories();
        setSystemCategories(data);
      } catch (err) {
        console.error("Failed to fetch system categories:", err);
        setError("Failed to load categories");
      }
    };

    const fetchBudgetCategories = async () => {
      if (!budgets || budgets.length === 0) return;

      try {
        await Promise.all(
          budgets.map(async (budget) => {
            try {
              const categoriesData = await getCategoriesByBudgetId(budget.id);

              // Log the received data for debugging
              console.log(
                `Categories data for budget ${budget.id}:`,
                categoriesData
              );

              // Always initialize as an empty array
              budget.customCategories = [];

              // Handle various response formats
              if (Array.isArray(categoriesData)) {
                // If it's already an array, use it directly
                budget.customCategories = categoriesData;
              } else if (
                categoriesData &&
                typeof categoriesData === "object" &&
                Object.keys(categoriesData).length > 0
              ) {
                // If it's a non-empty object, check for array properties
                const possibleArrays = [
                  "categories",
                  "items",
                  "data",
                  "results",
                ];
                for (const prop of possibleArrays) {
                  if (Array.isArray(categoriesData[prop])) {
                    budget.customCategories = categoriesData[prop];
                    break;
                  }
                }
              }

              // If we reach this point with an empty array, the API returned
              // a format we don't recognize or an empty object
              if (budget.customCategories.length === 0) {
                console.log(`No categories found for budget ${budget.id}`);
              }
            } catch (err) {
              console.error(
                `Error fetching categories for budget ${budget.id}:`,
                err
              );
              budget.customCategories = [];
            }
          })
        );
      } catch (err) {
        console.error("Failed to fetch budget categories:", err);
        setError("Failed to load budget categories");
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchSystemCategories();
    fetchBudgetCategories();
  }, [budgets]);

  const allCategories = [...categories, ...systemCategories];

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
    // Implement edit functionality here
    console.log("Edit budget:", budget);
    setOpenMenuId(null);
  };

  const handleDeleteBudget = (budget: Budget) => {
    // Implement delete functionality here
    console.log("Delete budget:", budget);
    setOpenMenuId(null);
  };

  return (
    <div className="p-5 h-full flex flex-col">
      {!budgets || budgets.length === 0 ? (
        <EmptyBudget categories={allCategories} onSuccess={onSuccess} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className=" flex flex-col h-full"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-700">
              Your Budgets
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-md transition-all text-xs sm:text-sm font-medium flex items-center justify-center sm:justify-start w-full sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Budget
            </motion.button>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-1 h-full max-h-[calc(100vh-200px)] pb-4">
              {categoriesLoading ? (
                <div className="col-span-full flex justify-center items-center">
                  <div className="animate-pulse text-gray-500">
                    Loading budgets...
                  </div>
                </div>
              ) : (
                budgets.map((budget, index) => {
                  const percentage = calculatePercentage(
                    budget.currentSpent,
                    budget.limitAmount
                  );
                  const remainingAmount =
                    budget.limitAmount - budget.currentSpent;

                  const mainColor = getGradientColor(percentage);
                  const lightColor = getLightColor(mainColor);
                  const textColor = getTextColor(percentage);

                  return (
                    <motion.div
                      key={budget.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="relative bg-white p-4 rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Options Menu Button */}
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === String(budget.id)
                                ? null
                                : String(budget.id)
                            );
                          }}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {openMenuId === String(budget.id) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditBudget(budget);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center transition-colors rounded-md"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2 text-indigo-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBudget(budget);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center transition-colors rounded-md"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2 text-red-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </div>

                      {/* Decorative corner accent */}
                      <div
                        className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full"
                        style={{ backgroundColor: mainColor }}
                      ></div>

                      {/* Wave background at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 z-0 overflow-hidden">
                        <div
                          className="absolute bottom-0 left-0 w-full h-full z-0"
                          style={{
                            opacity: 0.4,
                            backgroundColor: mainColor,
                            clipPath:
                              "path('M0 43.9999C106.667 43.9999 213.333 7.99994 320 7.99994C426.667 7.99994 533.333 43.9999 640 43.9999C746.667 43.9999 853.333 7.99994 960 7.99994C1066.67 7.99994 1173.33 43.9999 1280 43.9999C1386.67 43.9999 1440 19.0266 1440 9.01329V100H0V43.9999Z')",
                          }}
                        ></div>

                        <div
                          className="absolute bottom-0 left-0 h-full z-1"
                          style={{
                            width: `${percentage}%`,
                            background:
                              "linear-gradient(to right, rgba(255,255,255,0) 80%, rgba(255,255,255,1) 100%)",
                            transition:
                              "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          }}
                        ></div>

                        <div
                          className="absolute bottom-0 right-0 h-full bg-white z-1"
                          style={{
                            width: `${100 - percentage}%`,
                            transition:
                              "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          }}
                        ></div>
                      </div>

                      <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xl font-bold text-gray-900 tracking-tight truncate">
                            {budget.name}
                          </h3>
                        </div>

                        <motion.span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-3"
                          style={{
                            backgroundColor: lightColor,
                            color: textColor,
                          }}
                        >
                          {`${percentage.toFixed(0)}% Used`}
                        </motion.span>

                        <div className="space-y-4">
                          {/* Amount Display */}
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

                          {/* Progress Bar */}
                          <div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-3 rounded-full"
                                style={{ backgroundColor: mainColor }}
                              ></motion.div>
                            </div>
                          </div>

                          {/* Remaining amount */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-600 font-medium">
                                Remaining
                              </p>
                              <p
                                className="text-lg font-bold"
                                style={{ color: textColor }}
                              >
                                {remainingAmount > 0
                                  ? `${budget.currency} ${remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : "Exceeded"}
                              </p>
                            </div>
                          </div>

                          {/* Display categories */}
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 font-medium mb-1">
                              Categories:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {Array.isArray(budget.customCategories) &&
                              budget.customCategories.length > 0 ? (
                                budget.customCategories.map(
                                  (budgetCategory) => (
                                    <span
                                      key={budgetCategory.id}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200 cursor-default"
                                      title={`${budgetCategory.customCategory?.name} (${budgetCategory.customCategory?.type})`}
                                    >
                                      {budgetCategory.customCategory?.name}
                                    </span>
                                  )
                                )
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  No categories
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {isModalOpen && (
            <CreateNewBudget
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              categories={categories}
              onSuccess={onSuccess}
            />
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Budgets;
