import React from "react";
import { Account } from "../../../interfaces/Account";
import { TransactionType } from "../../../interfaces/enums";
import { Transaction } from "../../../interfaces/Transaction";
import AnimatedModal from "../../animations/BlurPopup";

interface TransactionDetailsPopupProps {
  transaction: Transaction;
  accounts: Account[];
  formatAmount: (amount: number) => string;
  formatDate: (dateString: Date) => string;
  onClose: () => void;
  isOpen: boolean;
}

const TransactionDetailsPopup: React.FC<TransactionDetailsPopupProps> = ({
  transaction,
  accounts,
  formatAmount,
  formatDate,
  onClose,
  isOpen,
}) => {
  if (!transaction) return null;

  const getAccountName = (accountId: number | undefined) => {
    if (!accountId) return "-";
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? account.name : `Account ${accountId}`;
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 11l5-5m0 0l5 5m-5-5v12"
            />
          </svg>
        );
      case TransactionType.EXPENSE:
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 13l-5 5m0 0l-5-5m5 5V6"
            />
          </svg>
        );
      case TransactionType.TRANSFER:
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        );
    }
  };

  const getThemeColors = () => {
    switch (transaction.type) {
      case TransactionType.INCOME:
        return {
          gradient: "bg-gradient-to-r from-green-600 to-green-800",
          textColor: "text-green-500",
          bgLight: "bg-green-50/50",
          border: "border-green-200",
          buttonBg: "bg-gradient-to-r from-green-600 to-green-700",
          buttonHover: "hover:from-green-600 hover:to-green-700",
          buttonRing: "focus:ring-green-500",
          iconBg: "bg-white",
          detailsBg: "bg-gradient-to-r from-green-50 to-emerald-50",
        };
      case TransactionType.EXPENSE:
        return {
          gradient: "bg-gradient-to-r from-red-600 to-red-800",
          textColor: "text-red-500",
          bgLight: "bg-red-50/50",
          border: "border-red-200",
          buttonBg: "bg-gradient-to-r from-red-600 to-red-700",
          buttonHover: "hover:from-red-600 hover:to-red-700",
          buttonRing: "focus:ring-red-500",
          iconBg: "bg-white",
          detailsBg: "bg-gradient-to-r from-red-50 to-pink-50",
        };
      case TransactionType.TRANSFER:
        return {
          gradient: "bg-gradient-to-r from-blue-600 to-blue-800",
          textColor: "text-blue-500",
          bgLight: "bg-blue-50/50",
          border: "border-blue-200",
          buttonBg: "bg-gradient-to-r from-blue-600 to-blue-700",
          buttonHover: "hover:from-blue-600 hover:to-blue-700",
          buttonRing: "focus:ring-blue-500",
          iconBg: "bg-white",
          detailsBg: "bg-gradient-to-r from-blue-50 to-indigo-50",
        };
      default:
        return {
          gradient: "bg-gradient-to-r from-gray-600 to-gray-800",
          textColor: "text-gray-500",
          bgLight: "bg-gray-50/50",
          border: "border-gray-200",
          buttonBg: "bg-gradient-to-r from-gray-600 to-gray-700",
          buttonHover: "hover:from-gray-600 hover:to-gray-700",
          buttonRing: "focus:ring-gray-500",
          iconBg: "bg-white",
          detailsBg: "bg-gradient-to-r from-gray-50 to-gray-100",
        };
    }
  };

  const theme = getThemeColors();

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdropClick={true}
      backdropBlur="md"
      animationDuration={300}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: window.innerWidth <= 768 ? "100%" : "36rem",
          minWidth: window.innerWidth <= 768 ? "auto" : "28rem",
          maxHeight: "90vh",
        }}
      >
        {/* Fixed Header */}
        <div className={`${theme.gradient} py-4 relative z-10`}>
          {/* Decorative circles */}
          <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
          <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
          <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>

          {/* Title in header */}
          <div className="px-6 flex items-center justify-between relative">
            <div className="flex items-center">
              <div className={`${theme.iconBg} w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-lg`}>
                <div className={theme.textColor}>
                  {getTransactionIcon(transaction.type)}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {transaction.type === TransactionType.INCOME
                    ? "Income Details 💹"
                    : transaction.type === TransactionType.EXPENSE
                      ? "Expense Details 💸"
                      : "Transfer Details 🔄"}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg
                className="h-6 w-6"
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
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Amount Display */}
            <div className={`mb-6 p-5 ${theme.detailsBg} border ${theme.border} rounded-xl shadow-sm`}>
              <h3 className={`font-bold ${theme.textColor} mb-3 flex items-center`}>
                <span className="mr-1">💰</span>
                Transaction Amount
              </h3>
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-3 flex justify-center items-center">
                  <span className={`text-2xl font-extrabold ${theme.textColor}`}>
                    {transaction.currency} {formatAmount(transaction.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Info Card */}
            <div className={`space-y-5 mb-6`}>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 flex items-center`}>
                  <span className={`${theme.textColor} mr-1`}>📅</span>
                  Date
                </label>
                <div className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.bgLight}`}>
                  <div className="font-medium text-gray-800">
                    {formatDate(transaction.date)}
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {transaction.type === TransactionType.EXPENSE ||
              transaction.type === TransactionType.INCOME ? (
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 flex items-center`}>
                    <span className={`${theme.textColor} mr-1`}>🏷️</span>
                    Name
                  </label>
                  <div className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.bgLight}`}>
                    <div className="font-medium text-gray-800">
                      {transaction.name || "-"}
                    </div>
                  </div>
                </div>
              ) : null}

              {transaction.fromAccountId && (
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 flex items-center`}>
                    <span className={`${theme.textColor} mr-1`}>💳</span>
                    From Account
                  </label>
                  <div className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.bgLight}`}>
                    <div className="font-medium text-gray-800">
                      {getAccountName(transaction.fromAccountId)}
                    </div>
                  </div>
                </div>
              )}

              {transaction.toAccountId && (
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 flex items-center`}>
                    <span className={`${theme.textColor} mr-1`}>💳</span>
                    To Account
                  </label>
                  <div className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.bgLight}`}>
                    <div className="font-medium text-gray-800">
                      {getAccountName(transaction.toAccountId)}
                    </div>
                  </div>
                </div>
              )}

              {/* Description Field */}
              {transaction.description && (
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 flex items-center`}>
                    <span className={`${theme.textColor} mr-1`}>📝</span>
                    Description
                  </label>
                  <div className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.bgLight}`}>
                    <div className="text-gray-800">
                      {transaction.description}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-4 pb-2">
              <button
                onClick={onClose}
                className={`w-full py-3 px-4 ${theme.buttonBg} text-white font-medium rounded-xl focus:outline-none focus:ring-2 ${theme.buttonRing} focus:ring-opacity-50 transition-all shadow-lg flex items-center justify-center`}
              >
                <svg
                  className="h-5 w-5 mr-2"
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
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default TransactionDetailsPopup;