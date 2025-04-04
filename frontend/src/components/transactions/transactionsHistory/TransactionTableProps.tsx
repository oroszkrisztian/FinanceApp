import React, { useEffect, useState } from "react";
import { ChevronRight, Calendar, Clock, Tag, ArrowRight } from "lucide-react";

import TransactionDetailsPopup from "./TransactionDetailsPopup";
import { useAuth } from "../../../context/AuthContext";
import { Account } from "../../../interfaces/Account";
import { TransactionType } from "../../../interfaces/enums";
import { Transaction } from "../../../interfaces/Transaction";
import { fetchAllAccounts } from "../../../services/accountService";

interface TransactionTableProps {
  transactions: Transaction[];
  formatAmount: (amount: number) => string;
  formatDate: (dateString: Date) => string;
  transactionType: TransactionType;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  formatAmount,
  formatDate,
}) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const accountsData = await fetchAllAccounts(user.id);
        setAccounts(accountsData);
      } catch (err) {
        console.error("Error fetching accounts:", err);
        setError("Failed to load account information");
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [user]);

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
            className="h-5 w-5 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2"
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
            className="h-5 w-5 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2"
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
            className="h-5 w-5 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2"
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
          <Tag className="h-5 w-5 text-white" />
        );
    }
  };

  const getAmountColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return "text-green-600";
      case TransactionType.EXPENSE:
        return "text-red-600";
      case TransactionType.TRANSFER:
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg shadow-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner transform transition-all duration-500 hover:rotate-12 hover:scale-110">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No transactions yet</h3>
        <p className="text-gray-500 max-w-sm">
          Your financial journey starts with your first transaction! 🚀
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-md flex flex-col items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-700 font-medium">Crunching your numbers...</p>
        <p className="text-gray-500 text-sm mt-1">This won't take long</p>
      </div>
    );
  }

  // Function to get theme colors based on transaction type
  const getThemeColors = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return {
          gradient: "bg-gradient-to-r from-green-400 to-emerald-500",
          secondaryBg: "bg-green-50",
          cardBorder: "border-green-200",
          badgeBg: "bg-green-100",
          badgeText: "text-green-800",
          icon: "text-white",
          iconBg: "bg-green-400",
          hoverBg: "hover:bg-green-50",
          emoji: "💰"
        };
      case TransactionType.EXPENSE:
        return {
          gradient: "bg-gradient-to-r from-red-400 to-pink-500",
          secondaryBg: "bg-red-50",
          cardBorder: "border-red-200",
          badgeBg: "bg-red-100",
          badgeText: "text-red-800",
          icon: "text-white",
          iconBg: "bg-red-400",
          hoverBg: "hover:bg-red-50",
          emoji: "💸"
        };
      case TransactionType.TRANSFER:
        return {
          gradient: "bg-gradient-to-r from-blue-400 to-indigo-500",
          secondaryBg: "bg-blue-50",
          cardBorder: "border-blue-200",
          badgeBg: "bg-blue-100",
          badgeText: "text-blue-800",
          icon: "text-white",
          iconBg: "bg-blue-400",
          hoverBg: "hover:bg-blue-50",
          emoji: "🔄"
        };
      default:
        return {
          gradient: "bg-gradient-to-r from-gray-400 to-gray-500",
          secondaryBg: "bg-gray-50",
          cardBorder: "border-gray-200",
          badgeBg: "bg-gray-100",
          badgeText: "text-gray-800",
          icon: "text-white",
          iconBg: "bg-gray-400",
          hoverBg: "hover:bg-gray-50",
          emoji: "📝"
        };
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="divide-y divide-gray-100">
            {transactions.map((transaction, index) => {
              const theme = getThemeColors(transaction.type);
              
              return (
                <div
                  key={transaction.id}
                  className={`group hover:bg-gray-50 transition-all duration-300 cursor-pointer border-l-4 border-transparent ${theme.hoverBg}`}
                  style={{ 
                    borderLeftColor: transaction.type === TransactionType.INCOME ? '#10b981' : 
                                     transaction.type === TransactionType.EXPENSE ? '#f43f5e' : 
                                     transaction.type === TransactionType.TRANSFER ? '#3b82f6' : '#9ca3af'
                  }}
                  onClick={() => handleRowClick(transaction)}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* Transaction icon with themed background */}
                      <div className={`flex-shrink-0 ${theme.iconBg} p-2 rounded-full shadow-sm transform transition-transform group-hover:scale-110 duration-300`}>
                        {getTransactionIcon(transaction.type)}
                      </div>

                      {/* Transaction details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1.5">
                          <h3 className="text-base font-semibold text-gray-900 break-words pr-2 flex items-center" title={
                            transaction.type === TransactionType.TRANSFER 
                              ? `${getAccountName(transaction.fromAccountId)} → ${getAccountName(transaction.toAccountId)}`
                              : transaction.name || "Untitled Transaction"
                          }>
                            <span className="mr-1.5 opacity-70 hidden group-hover:inline">{theme.emoji}</span>
                            {transaction.type === TransactionType.TRANSFER ? (
                              <div className="flex items-center flex-wrap">
                                <span className="break-words">{getAccountName(transaction.fromAccountId)}</span>
                                <ArrowRight className="h-4 w-4 mx-1 flex-shrink-0 text-blue-500 group-hover:animate-pulse" />
                                <span className="break-words">{getAccountName(transaction.toAccountId)}</span>
                              </div>
                            ) : (
                              transaction.name || "Untitled Transaction"
                            )}
                          </h3>
                          <div
                            className={`text-base font-bold ${getAmountColor(transaction.type)} whitespace-nowrap transition-all duration-300 group-hover:scale-105 transform`}
                          >
                            {transaction.type === TransactionType.EXPENSE ? "- " : transaction.type === TransactionType.INCOME ? "+ " : ""}
                            {formatAmount(transaction.amount)} {transaction.currency}
                          </div>
                        </div>

                        <div className="flex items-center text-xs text-gray-500 mt-1 flex-wrap">
                          <div className={`p-1 rounded-full ${theme.secondaryBg} mr-1.5 flex-shrink-0 transition-all duration-300 group-hover:shadow-sm`}>
                            <Calendar className="h-3 w-3" />
                          </div>
                          {formatDate(transaction.date)}
                          <div className={`p-1 rounded-full ${theme.secondaryBg} mx-1.5 flex-shrink-0 transition-all duration-300 group-hover:shadow-sm`}>
                            <Clock className="h-3 w-3" />
                          </div>
                          {new Date(transaction.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div className="mt-2">
                          {transaction.type === TransactionType.INCOME ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${theme.badgeBg} ${theme.badgeText} transition-all duration-300 group-hover:shadow-sm`}>
                              To: <span className="break-words ml-1">{getAccountName(transaction.toAccountId)}</span>
                            </span>
                          ) : transaction.type === TransactionType.EXPENSE ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${theme.badgeBg} ${theme.badgeText} transition-all duration-300 group-hover:shadow-sm`}>
                              From: <span className="break-words ml-1">{getAccountName(transaction.fromAccountId)}</span>
                            </span>
                          ) : null}
                        </div>

                        {transaction.description && (
                          <div className="text-sm text-gray-500 mt-2 line-clamp-2 italic break-words">
                            "{transaction.description}"
                          </div>
                        )}
                      </div>

                      {/* Chevron indicator with animation */}
                      <ChevronRight className="h-5 w-5 text-gray-400 self-center flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTransaction && (
        <TransactionDetailsPopup
          transaction={selectedTransaction}
          accounts={accounts}
          formatAmount={formatAmount}
          formatDate={formatDate}
          onClose={closePopup}
          isOpen={isPopupOpen}
        />
      )}
    </>
  );
};

export default TransactionTable;