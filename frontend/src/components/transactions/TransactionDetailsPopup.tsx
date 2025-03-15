import React from "react";
import { Transaction } from "../../interfaces/Transaction";
import { TransactionType } from "../../interfaces/enums";
import { Account } from "../../interfaces/Account";
import AnimatedModal from "../animations/BlurPopup";

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
  // If transaction is not defined, don't render anything
  if (!transaction) return null;

  const getAccountName = (accountId: number | undefined) => {
    if (!accountId) return "-";
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? account.name : `Account ${accountId}`;
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Income
          </span>
        );
      case TransactionType.EXPENSE:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Expense
          </span>
        );
      case TransactionType.TRANSFER:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Transfer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getThemeColors = () => {
    switch (transaction.type) {
      case TransactionType.INCOME:
        return {
          headerBg: "bg-green-50",
          headerText: "text-green-800",
          headerBorder: "border-green-200",
          icon: "text-green-600",
          button: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
        };
      case TransactionType.EXPENSE:
        return {
          headerBg: "bg-red-50",
          headerText: "text-red-800",
          headerBorder: "border-red-200",
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        };
      case TransactionType.TRANSFER:
        return {
          headerBg: "bg-blue-50",
          headerText: "text-blue-800",
          headerBorder: "border-blue-200",
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        };
      default:
        return {
          headerBg: "bg-gray-50",
          headerText: "text-gray-800",
          headerBorder: "border-gray-200",
          icon: "text-gray-600",
          button: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
        };
    }
  };

  const theme = getThemeColors();

  return (
    <AnimatedModal 
      isOpen={isOpen} 
      onClose={onClose}
      closeOnBackdropClick={true}
      backdropBlur="sm"
      animationDuration={300}
    >
      <div className="relative">
        <div
          className={`px-6 py-4 border-b ${theme.headerBorder} ${theme.headerBg}`}
        >
          <div className="flex items-center">
            <div className={`mr-3 ${theme.icon}`}>
              {transaction.type === TransactionType.INCOME && (
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
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
              )}
              {transaction.type === TransactionType.EXPENSE && (
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
                    d="M17 13l-5 5m0 0l-5-5m5 5V6"
                  />
                </svg>
              )}
              {transaction.type === TransactionType.TRANSFER && (
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
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              )}
            </div>
            <h3 className={`text-lg font-medium ${theme.headerText}`}>
              Transaction Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors"
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

        <div className="px-6 py-6 space-y-6">
          <div
            className={`flex items-center justify-center p-4 rounded-lg ${theme.headerBg} mb-4`}
          >
            <span
              className={`text-2xl font-bold ${
                transaction.type === TransactionType.INCOME
                  ? "text-green-600"
                  : transaction.type === TransactionType.EXPENSE
                    ? "text-red-600"
                    : "text-blue-600"
              }`}
            >
              {transaction.currency} {formatAmount(transaction.amount)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </p>
                <div className="mt-1 flex items-center">
                  <svg
                    className="h-4 w-4 text-gray-400 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(transaction.date)}
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(transaction.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </p>
                <div className="mt-1">
                  {getTransactionTypeLabel(transaction.type)}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {transaction.name || "-"}
                </p>
              </div>

              {transaction.fromAccountId && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Account
                  </p>
                  <div className="mt-1 flex items-center">
                    <svg
                      className="h-4 w-4 text-gray-400 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-800">
                      {getAccountName(transaction.fromAccountId)}
                    </p>
                  </div>
                </div>
              )}

              {transaction.toAccountId && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To Account
                  </p>
                  <div className="mt-1 flex items-center">
                    <svg
                      className="h-4 w-4 text-gray-400 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-800">
                      {getAccountName(transaction.toAccountId)}
                    </p>
                  </div>
                </div>
              )}

              {transaction.customCategoryId && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </p>
                  <div className="mt-1 flex items-center">
                    <svg
                      className="h-4 w-4 text-gray-400 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-800">
                      {transaction.customCategoryId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {transaction.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Description
              </p>
              <div className="flex">
                <svg
                  className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
                <p className="text-sm text-gray-800 whitespace-pre-line">
                  {transaction.description}
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 ${theme.button} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default TransactionDetailsPopup;