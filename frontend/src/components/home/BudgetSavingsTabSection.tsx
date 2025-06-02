import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Account } from '../../interfaces/Account';
import { AccountType } from '../../interfaces/enums';

interface BudgetSavingsTabSectionProps {
  accounts: Account[];
  budgets: any[];
  transactions: any[];
  displayCurrency: string;
}

const BudgetSavingsTabSection: React.FC<BudgetSavingsTabSectionProps> = ({
  accounts,
  budgets,
  transactions,
  displayCurrency
}) => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'savings'>('budgets');
  const [isMobileView, setIsMobileView] = useState(false);

  // Enhanced mobile detection with more breakpoints
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  // Process savings data
  const savingsData = useMemo(() => {
    const savingsAccountsWithGoals = accounts
      .filter(account => 
        account.type === AccountType.SAVINGS && 
        account.savingAccount?.targetAmount && 
        account.savingAccount?.targetAmount > 0
      )
      .map(account => {
        const currentBalance = account.amount || 0;
        const goal = account.savingAccount?.targetAmount || 0;
        const progressPercentage = goal > 0 ? Math.min((currentBalance / goal) * 100, 100) : 0;
        
        return {
          ...account,
          progressPercentage,
          isCompleted: currentBalance >= goal
        };
      });

    const totalSaved = savingsAccountsWithGoals.reduce((sum, acc) => sum + (acc.amount || 0), 0);
    const totalGoals = savingsAccountsWithGoals.reduce((sum, acc) => sum + (acc.savingAccount?.targetAmount || 0), 0);
    const completedGoals = savingsAccountsWithGoals.filter(acc => acc.isCompleted).length;
    const overallProgress = totalGoals > 0 ? (totalSaved / totalGoals) * 100 : 0;

    return {
      accounts: savingsAccountsWithGoals,
      totalSaved,
      totalGoals,
      completedGoals,
      totalGoalsCount: savingsAccountsWithGoals.length,
      overallProgress
    };
  }, [accounts]);

  // Process budget data
  const budgetData = useMemo(() => {
    if (!budgets || budgets.length === 0) {
      return {
        budgets: [],
        totalBudget: 0,
        totalSpent: 0,
        completedBudgets: 0,
        totalBudgetsCount: 0,
        overallProgress: 0
      };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const budgetsWithProgress = budgets.map(budget => {
      // Use currentSpent from budget or calculate from transactions linked to this budget
      const budgetTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transaction.budgetId === budget.id &&
               transaction.type === 'EXPENSE' &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      });

      // Use currentSpent from budget if available, otherwise calculate from transactions
      const spent = budget.currentSpent || budgetTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
      const limitAmount = budget.limitAmount || 0;
      const progressPercentage = limitAmount > 0 ? Math.min((spent / limitAmount) * 100, 100) : 0;
      const isCompleted = spent >= limitAmount;

      return {
        ...budget,
        spent,
        limitAmount,
        progressPercentage,
        isCompleted,
        remaining: Math.max(limitAmount - spent, 0)
      };
    });

    const totalBudget = budgetsWithProgress.reduce((sum, budget) => sum + (budget.limitAmount || 0), 0);
    const totalSpent = budgetsWithProgress.reduce((sum, budget) => sum + (budget.spent || 0), 0);
    const completedBudgets = budgetsWithProgress.filter(budget => budget.isCompleted).length;
    const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      budgets: budgetsWithProgress,
      totalBudget,
      totalSpent,
      completedBudgets,
      totalBudgetsCount: budgetsWithProgress.length,
      overallProgress
    };
  }, [budgets, transactions]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const BudgetSummary = () => (
    <div className="space-y-2">
      {budgetData.budgets.length > 0 && (
        <div>
          <div className="space-y-2">
            {budgetData.budgets
              .sort((a, b) => b.progressPercentage - a.progressPercentage)
              .map((budget, index) => (
                <motion.div 
                  key={budget.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-xl border-l-4 shadow-sm active:shadow-md transition-shadow w-full ${
                    budget.isCompleted 
                      ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-red-500' 
                      : budget.progressPercentage >= 80
                        ? 'bg-gradient-to-r from-orange-50 to-red-50 border-l-orange-500'
                        : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-l-orange-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      {/* Enhanced Mobile-Friendly Icon */}
                      <div
                        className={`${isMobileView ? "p-2" : "p-2"} rounded-xl shadow-sm ${
                          budget.isCompleted 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                            : budget.progressPercentage >= 80
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                              : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>

                      {/* Enhanced Mobile Budget Info */}
                      <div className="flex-1 min-w-0 max-w-full">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1 max-w-full">
                            <div className="flex items-center gap-2 flex-wrap max-w-full">
                              <p className={`font-semibold text-gray-900 truncate max-w-full ${isMobileView ? "text-sm" : "text-sm"}`}>
                                {budget.name}
                              </p>
                              {budget.isCompleted && (
                                <span className={`px-1.5 py-0.5 rounded-full font-medium ${isMobileView ? "text-xs" : "text-xs"} bg-red-100 text-red-700`}>
                                  ⚠️ Exceeded
                                </span>
                              )}
                              {budget.progressPercentage >= 80 && !budget.isCompleted && (
                                <span className={`px-1.5 py-0.5 rounded-full font-medium ${isMobileView ? "text-xs" : "text-xs"} bg-orange-100 text-orange-700`}>
                                  ⚡ High
                                </span>
                              )}
                            </div>

                            {/* Mobile-optimized Progress Bar */}
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 shadow-inner">
                                <motion.div 
                                  className={`h-2 rounded-full ${
                                    budget.isCompleted ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    budget.progressPercentage >= 80 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                                    'bg-gradient-to-r from-orange-400 to-orange-500'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(budget.progressPercentage, 100)}%` }}
                                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                                />
                              </div>
                              <span className={`text-gray-700 font-medium ${isMobileView ? "text-xs" : "text-xs"}`}>
                                {budget.progressPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Enhanced Mobile Amount Display */}
                          <div className="text-right ml-3 flex-shrink-0 max-w-[40%]">
                            <p className={`font-bold break-words ${isMobileView ? "text-sm" : "text-sm"} text-gray-800`}>
                              {(budget.spent || 0).toFixed(2)}
                              <span className="text-gray-500 font-normal">/{(budget.limitAmount || 0).toFixed(2)}</span>
                            </p>
                            <p className={`text-gray-600 font-medium break-words ${isMobileView ? "text-xs" : "text-xs"}`}>
                              {budget.currency || displayCurrency}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const SavingsSummary = () => (
    <div className="space-y-2">
      {savingsData.accounts.length > 0 && (
        <div>
          <div className="space-y-2">
            {savingsData.accounts
              .sort((a, b) => b.progressPercentage - a.progressPercentage)
              .map((account, index) => (
                <motion.div 
                  key={account.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-xl border-l-4 shadow-sm active:shadow-md transition-shadow w-full ${
                    account.isCompleted 
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-l-emerald-500' 
                      : account.progressPercentage >= 80
                        ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-l-emerald-400'
                        : account.progressPercentage >= 50
                          ? 'bg-gradient-to-r from-teal-50 to-emerald-50 border-l-teal-400'
                          : 'bg-gradient-to-r from-cyan-50 to-teal-50 border-l-cyan-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      {/* Enhanced Mobile-Friendly Icon */}
                      <div
                        className={`${isMobileView ? "p-2" : "p-2"} rounded-xl shadow-sm ${
                          account.isCompleted 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                            : account.progressPercentage >= 80
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white'
                              : account.progressPercentage >= 50
                                ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-white'
                                : 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>

                      {/* Enhanced Mobile Savings Info */}
                      <div className="flex-1 min-w-0 max-w-full">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1 max-w-full">
                            <div className="flex items-center gap-2 flex-wrap max-w-full">
                              <p className={`font-semibold text-gray-900 truncate max-w-full ${isMobileView ? "text-sm" : "text-sm"}`}>
                                {account.name}
                              </p>
                              {account.isCompleted && (
                                <span className={`px-1.5 py-0.5 rounded-full font-medium ${isMobileView ? "text-xs" : "text-xs"} bg-emerald-100 text-emerald-700`}>
                                  ✅ Complete
                                </span>
                              )}
                              {account.progressPercentage >= 80 && !account.isCompleted && (
                                <span className={`px-1.5 py-0.5 rounded-full font-medium ${isMobileView ? "text-xs" : "text-xs"} bg-emerald-100 text-emerald-700`}>
                                  🚀 Almost
                                </span>
                              )}
                              {account.progressPercentage >= 50 && account.progressPercentage < 80 && (
                                <span className={`px-1.5 py-0.5 rounded-full font-medium ${isMobileView ? "text-xs" : "text-xs"} bg-teal-100 text-teal-700`}>
                                  📈 Good
                                </span>
                              )}
                            </div>

                            {/* Mobile-optimized Progress Bar */}
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 shadow-inner">
                                <motion.div 
                                  className={`h-2 rounded-full ${
                                    account.isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                    account.progressPercentage >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                    account.progressPercentage >= 50 ? 'bg-gradient-to-r from-teal-400 to-emerald-400' :
                                    'bg-gradient-to-r from-cyan-400 to-teal-400'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(account.progressPercentage, 100)}%` }}
                                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                                />
                              </div>
                              <span className={`text-gray-700 font-medium ${isMobileView ? "text-xs" : "text-xs"}`}>
                                {account.progressPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Enhanced Mobile Amount Display */}
                          <div className="text-right ml-3 flex-shrink-0 max-w-[40%]">
                            <p className={`font-bold break-words ${isMobileView ? "text-sm" : "text-sm"} text-gray-800`}>
                              {(account.amount || 0).toFixed(2)}
                              <span className="text-gray-500 font-normal">/{(account.savingAccount?.targetAmount || 0).toFixed(2)}</span>
                            </p>
                            <p className={`text-gray-600 font-medium break-words ${isMobileView ? "text-xs" : "text-xs"}`}>
                              {account.currency || displayCurrency}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const EmptyState = ({ type }: { type: 'budgets' | 'savings' }) => (
    <div className="text-center py-6">
      <motion.div 
        className="text-gray-400 mb-3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg className={`${isMobileView ? "w-8 h-8" : "w-12 h-12"} mx-auto`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {type === 'budgets' ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          )}
        </svg>
      </motion.div>
      <p className={`text-gray-600 mb-2 ${isMobileView ? "text-sm" : ""}`}>
        No {type} set up yet
      </p>
      <p className={`text-gray-500 ${isMobileView ? "text-xs" : "text-sm"}`}>
        {type === 'budgets' 
          ? 'Create budgets to track your spending' 
          : 'Add savings goals to your accounts to track progress'
        }
      </p>
    </div>
  );

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
        isMobileView 
          ? "p-3 mb-4 mx-2" 
          : "p-6 mb-8"
      }`}
      style={{ 
        height: isMobileView ? "350px" : "400px",
        overflowX: "hidden"
      }}
    >
      {/* Mobile-optimized background elements */}
      <div
        className={`absolute top-0 right-0 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full opacity-20 ${
          isMobileView
            ? "w-12 h-12 -translate-y-6 translate-x-6"
            : "w-28 h-28 -translate-y-14 translate-x-14"
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 bg-gradient-to-tr from-emerald-300 to-cyan-400 rounded-full opacity-15 ${
          isMobileView
            ? "w-8 h-8 translate-y-4 -translate-x-4"
            : "w-20 h-20 translate-y-10 -translate-x-10"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-amber-300 to-orange-400 rounded-full opacity-10 ${
          isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-indigo-300 to-blue-400 rounded-full opacity-10 ${
          isMobileView ? "bottom-3 right-12 w-6 h-6" : "bottom-12 right-20 w-12 h-12"
        }`}
      ></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Enhanced Mobile Header */}
        <div className={`flex-shrink-0 ${isMobileView ? "mb-3" : "mb-6"}`}>
          {/* Title Section - Always on top for mobile */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <motion.div
                className={`rounded-xl flex items-center justify-center shadow-md ${
                  isMobileView ? "w-8 h-8" : "w-12 h-12"
                } ${
                  activeTab === 'budgets' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {activeTab === 'budgets' ? (
                  <svg 
                    className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg 
                    className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </motion.div>
              <div>
                <h3
                  className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                    isMobileView ? "text-lg" : "text-xl"
                  }`}
                >
                  {activeTab === 'budgets' ? 'Budget Overview' : 'Savings Progress'}
                </h3>
                <p
                  className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                >
                  {activeTab === 'budgets' 
                    ? `${budgetData.totalBudgetsCount} budget${budgetData.totalBudgetsCount !== 1 ? 's' : ''} tracked`
                    : `${savingsData.totalGoalsCount} savings goal${savingsData.totalGoalsCount !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Mobile Tab System */}
          <div className="relative">
            <div className={`flex ${isMobileView ? "space-x-1" : "space-x-1"} bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1 shadow-inner`}>
              <motion.button
                onClick={() => setActiveTab('budgets')}
                className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'budgets'
                    ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 active:bg-white/70'
                }`}
                whileHover={{ scale: activeTab !== 'budgets' ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>💰</span>
                  <span className={isMobileView ? "text-xs" : ""}>Budgets</span>
                  {budgetData.totalBudgetsCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full ${isMobileView ? "text-xs" : "text-xs"} ${
                      activeTab === 'budgets' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {budgetData.totalBudgetsCount}
                    </span>
                  )}
                </div>
              </motion.button>

              <motion.button
                onClick={() => setActiveTab('savings')}
                className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'savings'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 active:bg-white/70'
                }`}
                whileHover={{ scale: activeTab !== 'savings' ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>🎯</span>
                  <span className={isMobileView ? "text-xs" : ""}>Savings</span>
                  {savingsData.totalGoalsCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full ${isMobileView ? "text-xs" : "text-xs"} ${
                      activeTab === 'savings' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {savingsData.totalGoalsCount}
                    </span>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Enhanced Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="pr-2" style={{ paddingBottom: "1rem" }}>
            <AnimatePresence mode="wait">
              {activeTab === 'budgets' ? (
                <motion.div
                  key="budgets"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 overflow-x-hidden"
                >
                  {budgetData.totalBudgetsCount > 0 ? (
                    <BudgetSummary />
                  ) : (
                    <EmptyState type="budgets" />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="savings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 overflow-x-hidden"
                >
                  {savingsData.totalGoalsCount > 0 ? (
                    <SavingsSummary />
                  ) : (
                    <EmptyState type="savings" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSavingsTabSection;