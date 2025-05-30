import React, { useMemo } from 'react';
import { Account } from '../../interfaces/Account';
import { AccountType } from '../../interfaces/enums';


interface SavingsGoalsSectionProps {
  accounts: Account[];
  displayCurrency: string;
}

const SavingsGoalsSection: React.FC<SavingsGoalsSectionProps> = ({
  accounts,
  displayCurrency
}) => {
  
  const savingsAccountsWithGoals = useMemo(() => {
    return accounts
      .filter(account => 
        account.type === AccountType.SAVINGS && 
        account.savingAccount?.targetAmount  && 
        account.savingAccount?.targetAmount  > 0
      )
      .map(account => {
        const currentBalance = account.amount|| 0;
        const goal = account.savingAccount?.targetAmount || 0;
        const progressPercentage = goal > 0 ? Math.min((currentBalance / goal) * 100, 100) : 0;
        const remaining = Math.max(goal - currentBalance, 0);
        
        return {
          ...account,
          progressPercentage,
          remaining,
          isCompleted: currentBalance >= goal
        };
      })
      .sort((a, b) => b.progressPercentage - a.progressPercentage); // Sort by progress (highest first)
  }, [accounts]);

  const getProgressColor = (percentage: number, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressBgColor = (percentage: number, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-50 border-green-200';
    if (percentage >= 80) return 'bg-blue-50 border-blue-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    if (percentage >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusText = (account: any) => {
    if (account.isCompleted) return 'Goal Achieved! 🎉';
    if (account.progressPercentage >= 80) return 'Almost there!';
    if (account.progressPercentage >= 60) return 'Good progress';
    if (account.progressPercentage >= 40) return 'Making progress';
    return 'Just getting started';
  };

  const SavingsAccountCard = ({ account }: { account: any }) => (
    <div className={`rounded-lg p-5 border-2 ${getProgressBgColor(account.progressPercentage, account.isCompleted)}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-lg">
            {account.name}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {getStatusText(account)}
          </p>
        </div>
        {account.isCompleted && (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Complete
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{account.progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(account.progressPercentage, account.isCompleted)}`}
            style={{ width: `${Math.min(account.progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Current Balance</p>
          <p className="font-bold text-gray-900 text-lg">
            {account.currentBalance?.toLocaleString()} {displayCurrency}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Goal</p>
          <p className="font-bold text-gray-900 text-lg">
            {account.savingsGoal?.toLocaleString()} {displayCurrency}
          </p>
        </div>
      </div>

      {!account.isCompleted && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Remaining to goal:</span>
            <span className="font-semibold text-gray-900">
              {account.remaining.toLocaleString()} {displayCurrency}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (savingsAccountsWithGoals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Savings Goals Progress
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">No savings goals set up yet</p>
          <p className="text-sm text-gray-500">Add savings goals to your accounts to track your progress</p>
        </div>
      </div>
    );
  }

  const completedGoals = savingsAccountsWithGoals.filter(account => account.isCompleted);
  const activeGoals = savingsAccountsWithGoals.filter(account => !account.isCompleted);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Savings Goals Progress
        </h3>
        <div className="text-sm text-gray-600">
          {completedGoals.length} of {savingsAccountsWithGoals.length} goals completed
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-medium text-blue-800">Total Saved</p>
          <p className="text-2xl font-bold text-blue-900">
            {savingsAccountsWithGoals.reduce((sum, acc) => sum + (acc.amount || 0), 0).toLocaleString()} {displayCurrency}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm font-medium text-green-800">Total Goals</p>
          <p className="text-2xl font-bold text-green-900">
            {savingsAccountsWithGoals.reduce((sum, acc) => sum + (acc.savingAccount?.targetAmount || 0), 0).toLocaleString()} {displayCurrency}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-medium text-purple-800">Overall Progress</p>
          <p className="text-2xl font-bold text-purple-900">
            {((savingsAccountsWithGoals.reduce((sum, acc) => sum + (acc.amount|| 0), 0) / 
               savingsAccountsWithGoals.reduce((sum, acc) => sum + (acc.savingAccount?.targetAmount || 0), 0)) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Active Goals (Closest to Completion)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.slice(0, 4).map((account) => (
              <SavingsAccountCard key={account.id} account={account} />
            ))}
          </div>
          {activeGoals.length > 4 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              And {activeGoals.length - 4} more active savings goals
            </p>
          )}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">
            🎉 Completed Goals
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.slice(0, 2).map((account) => (
              <SavingsAccountCard key={account.id} account={account} />
            ))}
          </div>
          {completedGoals.length > 2 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              And {completedGoals.length - 2} more completed goals
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SavingsGoalsSection;