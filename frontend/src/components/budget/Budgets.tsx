import { useState } from "react";

import { motion } from "framer-motion";
import { Budget } from "../../interfaces/Budget";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { useAuth } from "../../context/AuthContext";
import EmptyBudget from "./EmptyBudget";
import CreateNewBudget from "./CreateNewBudget";

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
        <EmptyBudget categories={categories} onSuccess={onSuccess} />
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
              {budgets.map((budget, index) => {
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
                    className="relative bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 group backdrop-blur-sm"
                    style={{
                      background: `radial-gradient(circle at top right, ${getLightColor(mainColor)}, white 70%)`,
                    }}
                  >
                    {/* Decorative corner accent - updated */}
                    <div
                      className="absolute top-0 right-0 w-24 h-24 opacity-20 rounded-bl-[100%] transition-all duration-300 group-hover:opacity-30"
                      style={{ backgroundColor: mainColor }}
                    ></div>

                    {/* Wave background at bottom - updated */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 z-0 overflow-hidden opacity-60 group-hover:opacity-80 transition-opacity duration-300">
                      <div
                        className="absolute bottom-0 left-0 w-full h-full z-0"
                        style={{
                          backgroundColor: mainColor,
                          clipPath:
                            "path('M0,50 Q50,0 100,50 T200,50 T300,50 T400,50 L400,100 L0,100 Z')",
                        }}
                      ></div>
                    </div>

                    <div className="relative">
                      {/* Options Menu Button - updated */}
                      <div className="absolute -top-1 -right-1 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === String(budget.id)
                                ? null
                                : String(budget.id)
                            );
                          }}
                          className="p-1.5 rounded-full hover:bg-white/80 transition-colors"
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
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditBudget(budget);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-700 flex items-center transition-colors rounded-md"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2 text-blue-500"
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
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-100 hover:text-red-700 flex items-center transition-colors rounded-md"
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
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xl font-bold text-gray-800 tracking-tight truncate group-hover:text-gray-900 transition-colors">
                          {budget.name}
                        </h3>
                      </div>

                      <motion.span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4"
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
                                  ? `${budget.currency} ${remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : remainingAmount === 0
                                    ? `${budget.currency} ${budget.limitAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `${budget.currency} ${Math.abs(remainingAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

                        {/* Categories */}
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
