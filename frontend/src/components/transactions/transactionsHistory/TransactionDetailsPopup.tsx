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
            className="h-6 w-6 sm:h-8 sm:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 11l5-5m0 0l5 5m-5-5v12"
            />
          </svg>
        );
      case TransactionType.EXPENSE:
        return (
          <svg
            className="h-6 w-6 sm:h-8 sm:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 13l-5 5m0 0l-5-5m5 5V6"
            />
          </svg>
        );
      case TransactionType.TRANSFER:
        return (
          <svg
            className="h-6 w-6 sm:h-8 sm:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-6 w-6 sm:h-8 sm:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
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
          gradient: "bg-gradient-to-br from-green-400 to-emerald-600",
          patternBg: "bg-green-100",
          headerBg: "bg-green-500",
          cardBg: "bg-white",
          cardBorder: "border-green-200",
          amountText: "text-green-500",
          secondaryBg: "bg-green-50",
          iconBg: "bg-green-400",
          icon: "text-white",
          button:
            "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:ring-green-500",
        };
      case TransactionType.EXPENSE:
        return {
          gradient: "bg-gradient-to-br from-red-400 to-pink-600",
          patternBg: "bg-red-100",
          headerBg: "bg-red-500",
          cardBg: "bg-white",
          cardBorder: "border-red-200",
          amountText: "text-red-500",
          secondaryBg: "bg-red-50",
          iconBg: "bg-red-400",
          icon: "text-white",
          button:
            "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:ring-red-500",
        };
      case TransactionType.TRANSFER:
        return {
          gradient: "bg-gradient-to-br from-blue-400 to-indigo-600",
          patternBg: "bg-blue-100",
          headerBg: "bg-blue-500",
          cardBg: "bg-white",
          cardBorder: "border-blue-200",
          amountText: "text-blue-500",
          secondaryBg: "bg-blue-50",
          iconBg: "bg-blue-400",
          icon: "text-white",
          button:
            "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:ring-blue-500",
        };
      default:
        return {
          gradient: "bg-gradient-to-br from-gray-400 to-gray-600",
          patternBg: "bg-gray-100",
          headerBg: "bg-gray-500",
          cardBg: "bg-white",
          cardBorder: "border-gray-200",
          amountText: "text-gray-500",
          secondaryBg: "bg-gray-50",
          iconBg: "bg-gray-400",
          icon: "text-white",
          button:
            "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 focus:ring-gray-500",
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
      animationDuration={150}
    >
      <div className="bg-white rounded-2xl shadow-lg w-[95%] max-w-[95%] min-w-[300px] md:min-w-[400px] lg:max-w-[800px] mx-auto overflow-hidden max-h-[85vh] lg:max-h-[75vh] overflow-y-auto">
        {/* Header with gradient background */}
        <div
          className={`${theme.gradient} px-3 sm:px-6 pt-4 sm:pt-8 pb-8 sm:pb-12 relative rounded-t-2xl`}
        >
          {/* Fun pattern overlay */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20px 20px, white 3px, transparent 4px)",
                backgroundSize: "25px 25px",
              }}
            ></div>
          </div>

          {/* Header content */}
          <div className="relative flex items-center justify-between mb-3 sm:mb-6">
            <div className="flex items-center">
              <div
                className={`mr-2 sm:mr-3 p-1.5 sm:p-3 rounded-full ${theme.iconBg} shadow-lg`}
              >
                <span className={theme.icon}>
                  {getTransactionIcon(transaction.type)}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white">
                {transaction.type === TransactionType.INCOME
                  ? "Income Detail"
                  : transaction.type === TransactionType.EXPENSE
                    ? "Expense Detail"
                    : "Transfer Detail"}
              </h3>
            </div>
          </div>
        </div>

        {/* Amount "card" that overlaps the header */}
        <div className="relative px-3 sm:px-6 -mt-5 sm:-mt-8 mb-3 sm:mb-6">
          <div className="bg-white rounded-xl shadow-lg px-3 py-2 sm:px-5 sm:py-4 flex items-center justify-center border-b-4 border-l border-r border-t border-gray-100">
            <span
              className={`text-xl sm:text-3xl font-extrabold ${theme.amountText} break-all`}
            >
              {transaction.currency} {formatAmount(transaction.amount)}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-3 sm:px-5 pt-1 pb-4 sm:pb-5">
          <div className="space-y-3 sm:space-y-5">
            {/* Transaction Info Card */}
            <div
              className={`bg-white rounded-xl overflow-hidden shadow-md border ${theme.cardBorder}`}
            >
              <div className="grid grid-cols-1 gap-3 sm:gap-x-4 sm:gap-y-5 p-3 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase mb-1.5 flex items-center">
                    <svg
                      className={`h-4 w-4 sm:h-4 sm:w-4 ${theme.amountText} mr-1.5`}
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
                    Date
                  </p>
                  <div className="flex">
                    <p className="text-base font-medium text-gray-800 ml-5">
                      {formatDate(transaction.date)}
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </p>
                  </div>
                </div>

                {transaction.type === TransactionType.EXPENSE ||
                transaction.type === TransactionType.INCOME ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-1.5 flex items-center">
                      <svg
                        className={`h-4 w-4 sm:h-4 sm:w-4 ${theme.amountText} mr-1.5`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Name
                    </p>
                    <div className="flex">
                      <p
                        className="text-base font-medium text-gray-800 break-words ml-5"
                        title={transaction.name || "-"}
                      >
                        {transaction.name || "-"}
                      </p>
                    </div>
                  </div>
                ) : null}

                {transaction.fromAccountId && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-1.5 flex items-center">
                      <svg
                        className={`h-4 w-4 sm:h-4 sm:w-4 ${theme.amountText} mr-1.5`}
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
                      From Account
                    </p>
                    <div className="flex">
                      <p
                        className="text-base font-medium text-gray-800 break-words ml-5"
                        title={getAccountName(transaction.fromAccountId)}
                      >
                        {getAccountName(transaction.fromAccountId)}
                      </p>
                    </div>
                  </div>
                )}

                {transaction.toAccountId && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-1.5 flex items-center">
                      <svg
                        className={`h-4 w-4 sm:h-4 sm:w-4 ${theme.amountText} mr-1.5`}
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
                      To Account
                    </p>
                    <div className="flex">
                      <p
                        className="text-base font-medium text-gray-800 break-words ml-5"
                        title={getAccountName(transaction.toAccountId)}
                      >
                        {getAccountName(transaction.toAccountId)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description Card (if exists) */}
            {transaction.description && (
              <div
                className={`bg-white rounded-xl shadow-md border ${theme.cardBorder} overflow-hidden`}
              >
                <div
                  className={`${theme.secondaryBg} px-4 sm:px-5 py-2.5 sm:py-3 border-b ${theme.cardBorder}`}
                >
                  <h4
                    className={`text-base font-bold ${theme.amountText} flex items-center`}
                  >
                    <svg
                      className={`h-5 w-5 sm:h-5 sm:w-5 ${theme.amountText} mr-2.5 flex-shrink-0`}
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
                    Description
                  </h4>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-sm sm:text-base text-gray-700 break-words ml-7">
                    {transaction.description}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom action buttons and layout improvements */}
            <div className="pt-2 sm:pt-3 flex justify-center sm:justify-end">
              <button
                onClick={onClose}
                className={`w-full sm:w-auto px-5 py-2.5 ${theme.button} text-white rounded-full text-base font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg transition-all transform hover:scale-105 active:scale-95 duration-300 flex items-center justify-center`}
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
