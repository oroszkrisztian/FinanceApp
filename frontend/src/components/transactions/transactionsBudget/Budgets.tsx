import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Budget } from "../../../interfaces/Budget";
import EmptyBudget from "./EmptyBudget";
import { CustomCategory } from "../../../interfaces/CustomCategory";
import CreateNewBudget from "./CreateNewBudget";
import { motion } from "framer-motion";

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

  const calculatePercentage = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    return Math.min(percentage, 100);
  };

  const calculateCircleProgress = (percentage: number) => {
    const circumference = 2 * Math.PI * 40;
    return circumference - (percentage / 100) * circumference;
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

  return (
    <div className="p-5">
      {!budgets || budgets.length === 0 ? (
        <EmptyBudget categories={categories} onSuccess={onSuccess} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-gray-700">Your Budgets</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-md transition-all text-sm font-medium flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {budgets.map((budget, index) => {
              const percentage = calculatePercentage(
                budget.currentSpent,
                budget.limitAmount
              );
              const strokeDashoffset = calculateCircleProgress(percentage);
              const remainingAmount = budget.limitAmount - budget.currentSpent;

              const mainColor = getGradientColor(percentage);
              const lightColor = getLightColor(mainColor);
              const textColor = getTextColor(percentage);

              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="rounded-2xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
                  style={{ backgroundColor: "white" }}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div
                    className="h-2 w-full rounded-t-2xl"
                    style={{ backgroundColor: mainColor }}
                  ></div>

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-base font-bold text-gray-700 truncate max-w-[70%]">
                        {budget.name}
                      </h3>
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className="px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                        style={{
                          backgroundColor: lightColor,
                          color: textColor,
                        }}
                      >
                        {budget.currency}
                      </motion.span>
                    </div>

                    <div className="flex items-center justify-between mb-5">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            backgroundColor: lightColor,
                            opacity: 0.4,
                          }}
                        />

                        <svg
                          className="w-full h-full transform -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="9"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={mainColor}
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 40}
                            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                            animate={{ strokeDashoffset: strokeDashoffset }}
                            transition={{
                              duration: 1.5,
                              delay: 0.2 + index * 0.1,
                              ease: "easeOut",
                            }}
                          />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span
                            className="text-xl font-bold"
                            style={{ color: textColor }}
                          >
                            {`${percentage.toFixed(0)}%`}
                          </span>
                          <span className="text-xs text-gray-400">used</span>
                        </div>
                      </div>

                      <div className="flex-1 ml-5 space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400 font-medium">
                              Budget
                            </span>
                            <motion.span
                              className="font-bold text-gray-700"
                              whileHover={{ scale: 1.05 }}
                            >
                              {budget.currency}{" "}
                              {budget.limitAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </motion.span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400 font-medium">
                              Spent
                            </span>
                            <motion.span
                              className="font-bold text-gray-700"
                              whileHover={{ scale: 1.05 }}
                            >
                              {budget.currency}{" "}
                              {budget.currentSpent.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </motion.span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-gray-400 font-medium">
                              Remaining
                            </span>
                            <motion.span
                              className="font-bold"
                              style={{ color: textColor }}
                              whileHover={{ scale: 1.05 }}
                            >
                              {remainingAmount > 0
                                ? `${budget.currency} ${remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "Exceeded"}
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    </div>

                    
                  </div>
                </motion.div>
              );
            })}
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
