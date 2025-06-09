import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  X,
  Check,
  Plus,
  Edit,
  Loader2,
  AlertCircle,
  TrendingUp,
  Target,
  Tag,
} from "lucide-react";
import { Budget } from "../../interfaces/Budget";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { AIBudgetRecommendation } from "../../interfaces/AIBudgetRecommendation";

interface AIBudgetRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRecommendations: (
    recommendations: AIBudgetRecommendation[]
  ) => Promise<void>;
  currentBudgets: Budget[];
  categories: CustomCategory[];
  isLoading: boolean;
  recommendations: AIBudgetRecommendation[];
  error?: string | undefined;
}

const AIBudgetRecommendationsModal: React.FC<
  AIBudgetRecommendationsModalProps
> = ({
  isOpen,
  onClose,
  onApplyRecommendations,
  currentBudgets,
  categories,
  isLoading,
  recommendations,
  error,
}) => {
  const [selectedRecommendations, setSelectedRecommendations] = useState<
    number[]
  >([]);
  const [isApplying, setIsApplying] = useState(false);

  const toggleRecommendation = (index: number) => {
    setSelectedRecommendations((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleApplySelected = async () => {
    if (selectedRecommendations.length === 0) return;

    setIsApplying(true);
    try {
      const selectedRecs = selectedRecommendations.map(
        (index) => recommendations[index]
      );
      await onApplyRecommendations(selectedRecs);
      onClose();
    } catch (error) {
      console.error("Failed to apply recommendations:", error);
    } finally {
      setIsApplying(false);
    }
  };

  const getCurrentBudgetName = (budgetId?: number) => {
    if (!budgetId) return null;
    return currentBudgets.find((b) => b.id === budgetId)?.name;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg sm:rounded-xl">
                  <Brain size={18} className="text-white sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                    AI Budget Recommendations
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                    Smart suggestions based on your spending patterns
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-500 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 md:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-12">
                <div className="text-center">
                  <Loader2
                    size={24}
                    className="animate-spin text-purple-600 mx-auto mb-2 sm:mb-4 sm:w-8 sm:h-8"
                  />
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                    Analyzing Your Finances
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600 px-4">
                    AI is generating personalized budget recommendations...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-6 sm:py-12">
                <div className="text-center">
                  <AlertCircle
                    size={24}
                    className="text-red-500 mx-auto mb-2 sm:mb-4 sm:w-8 sm:h-8"
                  />
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                    Failed to Generate Recommendations
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600 px-4">{error}</p>
                </div>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="flex items-center justify-center py-6 sm:py-12">
                <div className="text-center">
                  <Target size={24} className="text-green-500 mx-auto mb-2 sm:mb-4 sm:w-8 sm:h-8" />
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                    Your Budgets Look Great!
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600 px-4">
                    AI couldn't find any significant improvements to suggest.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-purple-600 sm:w-5 sm:h-5" />
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {recommendations.length} Recommendations Found
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Select the recommendations you'd like to apply. You can
                    choose individual suggestions or apply all at once.
                  </p>
                </div>

                {recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border-2 rounded-lg sm:rounded-xl p-2.5 sm:p-4 transition-all cursor-pointer ${
                      selectedRecommendations.includes(index)
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleRecommendation(index)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div
                          className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg flex-shrink-0 ${
                            rec.action === "create"
                              ? "bg-green-100 text-green-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {rec.action === "create" ? (
                            <Plus size={14} className="sm:w-4 sm:h-4" />
                          ) : (
                            <Edit size={14} className="sm:w-4 sm:h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                            <h5 className="font-semibold text-gray-900 text-sm sm:text-base">
                              {rec.action === "create"
                                ? "Create New Budget"
                                : "Update Budget"}
                            </h5>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium self-start sm:self-auto ${
                                rec.action === "create"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {rec.action}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-xs sm:text-sm font-medium text-gray-700">
                                Budget Name:{" "}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-900 break-words">
                                {rec.name}
                              </span>
                              {rec.action === "update" && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Currently: {getCurrentBudgetName(rec.budgetId as number)}
                                </div>
                              )}
                            </div>

                            <div>
                              <span className="text-xs sm:text-sm font-medium text-gray-700">
                                Limit:{" "}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-900 font-semibold">
                                {rec.limitAmount.toLocaleString()}{" "}
                                {rec.currency}
                              </span>
                            </div>

                            <div>
                              <span className="text-xs sm:text-sm font-medium text-gray-700">
                                Categories:{" "}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rec.categoryIds.map((catId) => {
                                  const category = categories.find(
                                    (c) => c.id === catId
                                  );
                                  return category ? (
                                    <span
                                      key={catId}
                                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs"
                                    >
                                      <Tag size={8} className="sm:w-2.5 sm:h-2.5" />
                                      <span className="truncate max-w-20 sm:max-w-none">
                                        {category.name}
                                      </span>
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>

                            {rec.reason && (
                              <div className="bg-gray-50 rounded-md sm:rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
                                <span className="text-xs sm:text-sm font-medium text-gray-700">
                                  AI Reasoning:{" "}
                                </span>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                  {rec.reason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedRecommendations.includes(index)
                            ? "border-purple-500 bg-purple-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedRecommendations.includes(index) && (
                          <Check size={10} className="text-white sm:w-3 sm:h-3" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {!isLoading && !error && recommendations.length > 0 && (
            <div className="p-2.5 sm:p-4 md:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  {selectedRecommendations.length} of {recommendations.length}{" "}
                  recommendations selected
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() =>
                        setSelectedRecommendations(
                          recommendations.map((_, i) => i)
                        )
                      }
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedRecommendations([])}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={handleApplySelected}
                    disabled={
                      selectedRecommendations.length === 0 || isApplying
                    }
                    className="px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 size={14} className="animate-spin sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Applying...</span>
                        <span className="sm:hidden">Applying</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          Apply Selected ({selectedRecommendations.length})
                        </span>
                        <span className="sm:hidden">
                          Apply ({selectedRecommendations.length})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIBudgetRecommendationsModal;