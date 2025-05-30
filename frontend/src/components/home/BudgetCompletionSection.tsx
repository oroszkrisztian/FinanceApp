import React, { useMemo } from 'react';

interface BudgetCompletionSectionProps {
  budgets: any[];
  transactions: any[];
  displayCurrency: string;
}

const BudgetCompletionSection: React.FC<BudgetCompletionSectionProps> = ({
  budgets,
  transactions,
  displayCurrency
}) => {
  
  const budgetsWithProgress = useMemo(() => {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    return budgets
      .filter(budget => budget.amount && budget.amount > 0)
      .map(budget => {
        // Calculate spent amount for this budget category in current month
        const categoryTransactions = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.createdAt || transaction.date);
          const isInCurrentMonth = transactionDate >= startOfMonth && transactionDate <= endOfMonth;
          const matchesCategory = budget.category ? 
            transaction.category === budget.category : 
            true; // If no category specified, include all expenses
          const isExpense = transaction.type === 'EXPENSE';
          
          return isInCurrentMonth && matchesCategory && isExpense;
        });

        const spentAmount = categoryTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const budgetAmount = budget.amount || 0;
        const usagePercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
        const remainingAmount = Math.max(budgetAmount - spentAmount, 0);
        const isOverBudget = spentAmount > budgetAmount;
        const isNearLimit = usagePercentage >= 80 && !isOverBudget;

        return {
          ...budget,
          spentAmount,
          usagePercentage,
          remainingAmount,
          isOverBudget,
          isNearLimit,
          transactionCount: categoryTransactions.length
        };
      })
      .sort((a, b) => b.usagePercentage - a.usagePercentage); // Sort by usage percentage (highest first)
  }, [budgets, transactions]);

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 90) return 'bg-red-400';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getProgressBgColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-50 border-red-200';
    if (percentage >= 90) return 'bg-red-50 border-red-200';
    if (percentage >= 80) return 'bg-orange-50 border-orange-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    if (percentage >= 40) return 'bg-blue-50 border-blue-200';
    return 'bg-green-50 border-green-200';
  };

  const getStatusText = (budget: any) => {
    if (budget.isOverBudget) return 'Over Budget!';
    if (budget.usagePercentage >= 90) return 'Budget Almost Exhausted';
    if (budget.usagePercentage >= 80) return 'Approaching Limit';
    if (budget.usagePercentage >= 60) return 'On Track';
    if (budget.usagePercentage >= 40) return 'Good Progress';
    return 'Just Started';
  };

  const getStatusIcon = (budget: any) => {
    if (budget.isOverBudget) {
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    if (budget.isNearLimit) {
      return (
        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const BudgetCard = ({ budget }: { budget: any }) => (
    <div className={`rounded-lg p-5 border-2 ${getProgressBgColor(budget.usagePercentage, budget.isOverBudget)}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-lg">
              {budget.category || budget.name || 'General Budget'}
            </h4>
            {getStatusIcon(budget)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {getStatusText(budget)}
          </p>
        </div>
        {budget.isOverBudget && (
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            Over Budget
          </div>
        )}
        {budget.isNearLimit && (
          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            Near Limit
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Budget Usage</span>
          <span>{Math.min(budget.usagePercentage, 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(budget.usagePercentage, budget.isOverBudget)}`}
            style={{ width: `${Math.min(budget.usagePercentage, 100)}%` }}
          />
        </div>
        {budget.isOverBudget && (
          <div className="mt-1 text-xs text-red-600">
            Exceeded by {((budget.usagePercentage - 100)).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-600">Spent</p>
          <p className="font-bold text-gray-900 text-lg">
            {budget.spentAmount.toLocaleString()} {displayCurrency}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Budget</p>
          <p className="font-bold text-gray-900 text-lg">
            {budget.amount.toLocaleString()} {displayCurrency}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-600">
              {budget.isOverBudget ? 'Over by:' : 'Remaining:'}
            </span>
            <span className={`font-semibold ml-2 ${budget.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {budget.isOverBudget ? 
                `+${(budget.spentAmount - budget.amount).toLocaleString()}` : 
                budget.remainingAmount.toLocaleString()
              } {displayCurrency}
            </span>
          </div>
          <div className="text-gray-500">
            {budget.transactionCount} transactions
          </div>
        </div>
      </div>
    </div>
  );

  if (budgetsWithProgress.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Budget Progress
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">No budgets set up yet</p>
          <p className="text-sm text-gray-500">Create budgets to track your spending by category</p>
        </div>
      </div>
    );
  }

  const overBudgetCount = budgetsWithProgress.filter(b => b.isOverBudget).length;
  const nearLimitCount = budgetsWithProgress.filter(b => b.isNearLimit).length;
  const onTrackCount = budgetsWithProgress.length - overBudgetCount - nearLimitCount;

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Budget Progress - {currentMonthName}
        </h3>
        <div className="text-sm text-gray-600">
          {budgetsWithProgress.length} active budgets
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm font-medium text-red-800">Over Budget</p>
          <p className="text-2xl font-bold text-red-900">{overBudgetCount}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-sm font-medium text-orange-800">Near Limit</p>
          <p className="text-2xl font-bold text-orange-900">{nearLimitCount}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm font-medium text-green-800">On Track</p>
          <p className="text-2xl font-bold text-green-900">{onTrackCount}</p>
        </div>
      </div>

      {/* Budget Cards - Sorted by completion percentage */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Budgets by Usage (Highest First)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetsWithProgress.slice(0, 6).map((budget) => (
            <BudgetCard key={budget.id || budget.category} budget={budget} />
          ))}
        </div>
        {budgetsWithProgress.length > 6 && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            And {budgetsWithProgress.length - 6} more budgets
          </p>
        )}
      </div>
    </div>
  );
};

export default BudgetCompletionSection;