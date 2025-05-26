import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Calendar, 
  DollarSign, 
  Tag, 
  CreditCard, 
  FileText,
  Clock
} from "lucide-react";
import { Account } from "../../../interfaces/Account";
import { TransactionType } from "../../../interfaces/enums";
import { Transaction } from "../../../interfaces/Transaction";

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
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!transaction || !isOpen) return null;

  const getAccountName = (accountId: number | undefined) => {
    if (!accountId) return "-";
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? account.name : `Account ${accountId}`;
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return "💰";
      case TransactionType.EXPENSE:
        return "💸";
      case TransactionType.TRANSFER:
        return "🔄";
      default:
        return "📋";
    }
  };

  const getThemeColors = () => {
    switch (transaction.type) {
      case TransactionType.INCOME:
        return {
          gradient: "bg-gradient-to-r from-green-600 to-green-800",
          textColor: "text-green-600",
          bgLight: "bg-green-50/50",
          border: "border-green-200",
          buttonBg: "bg-gradient-to-r from-green-600 to-green-700",
        };
      case TransactionType.EXPENSE:
        return {
          gradient: "bg-gradient-to-r from-red-600 to-red-800",
          textColor: "text-red-600",
          bgLight: "bg-red-50/50",
          border: "border-red-200",
          buttonBg: "bg-gradient-to-r from-red-600 to-red-700",
        };
      case TransactionType.TRANSFER:
        return {
          gradient: "bg-gradient-to-r from-blue-600 to-blue-800",
          textColor: "text-blue-600",
          bgLight: "bg-blue-50/50",
          border: "border-blue-200",
          buttonBg: "bg-gradient-to-r from-blue-600 to-blue-700",
        };
      default:
        return {
          gradient: "bg-gradient-to-r from-gray-600 to-gray-800",
          textColor: "text-gray-600",
          bgLight: "bg-gray-50/50",
          border: "border-gray-200",
          buttonBg: "bg-gradient-to-r from-gray-600 to-gray-700",
        };
    }
  };

  const theme = getThemeColors();

  const getTransactionTitle = () => {
    switch (transaction.type) {
      case TransactionType.INCOME:
        return "Income Details";
      case TransactionType.EXPENSE:
        return "Expense Details";
      case TransactionType.TRANSFER:
        return "Transfer Details";
      default:
        return "Transaction Details";
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case TransactionType.INCOME:
        return "+";
      case TransactionType.EXPENSE:
        return "-";
      default:
        return "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-h-[90vh] shadow-2xl flex flex-col"
            style={{
              maxWidth: isMobileScreen ? "100%" : "32rem",
              minWidth: isMobileScreen ? "auto" : "28rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className={`p-4 ${theme.gradient} text-white relative rounded-t-2xl flex-shrink-0`}>
              {/* Decorative circles */}
              <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
              <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
              <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full p-2 shadow-lg">
                    <span className="text-2xl">
                      {getTransactionIcon(transaction.type)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{getTransactionTitle()}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold">
                        {getAmountPrefix()}{formatAmount(transaction.amount)} {transaction.currency}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className={`flex items-center gap-3 p-3 ${theme.bgLight} border ${theme.border} rounded-xl shadow-sm`}>
                  <Calendar className={theme.textColor} size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className={`flex items-center gap-3 p-3 ${theme.bgLight} border ${theme.border} rounded-xl shadow-sm`}>
                  <Clock className="text-indigo-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium">
                      {new Date(transaction.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Transaction Type */}
                <div className={`flex items-center gap-3 p-3 ${theme.bgLight} border ${theme.border} rounded-xl shadow-sm`}>
                  <Tag className="text-purple-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <div className="flex items-center gap-2">
                      <span>{getTransactionIcon(transaction.type)}</span>
                      <span className="font-medium capitalize">
                        {transaction.type.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Currency */}
                <div className={`flex items-center gap-3 p-3 ${theme.bgLight} border ${theme.border} rounded-xl shadow-sm`}>
                  <DollarSign className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Currency</p>
                    <p className="font-medium">{transaction.currency}</p>
                  </div>
                </div>
              </div>

              {/* Name (for Income/Expense) */}
              {(transaction.type === TransactionType.EXPENSE ||
                transaction.type === TransactionType.INCOME) && transaction.name && (
                <div className={`p-3 ${theme.bgLight} border ${theme.border} rounded-xl shadow-sm`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="text-purple-600" size={16} />
                    <p className="text-sm font-medium text-gray-700">Name</p>
                  </div>
                  <p className="font-medium text-gray-800">{transaction.name}</p>
                </div>
              )}

              {/* Account Information Grid */}
              {(transaction.fromAccountId || transaction.toAccountId) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">Account Information</h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {/* From Account */}
                    {transaction.fromAccountId && (
                      <div className={`flex items-center gap-3 p-3 ${theme.bgLight} border ${theme.border} rounded-xl shadow-sm`}>
                        <CreditCard className="text-indigo-600" size={20} />
                        <div>
                          <p className="text-sm text-gray-600">
                            {transaction.type === TransactionType.TRANSFER ? "From Account" : "Account"}
                          </p>
                          <p className="font-medium">{getAccountName(transaction.fromAccountId)}</p>
                        </div>
                      </div>
                    )}

                    {/* To Account */}
                    {transaction.toAccountId && (
                      <div className={`flex items-center gap-3 p-3 ${theme.bgLight} border ${theme.border} rounded-xl shadow-sm`}>
                        <CreditCard className="text-indigo-600" size={20} />
                        <div>
                          <p className="text-sm text-gray-600">
                            {transaction.type === TransactionType.TRANSFER ? "To Account" : "Account"}
                          </p>
                          <p className="font-medium">{getAccountName(transaction.toAccountId)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {transaction.description && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="text-blue-600" size={16} />
                    <p className="text-sm font-medium text-blue-800">Description</p>
                  </div>
                  <p className="text-blue-700">{transaction.description}</p>
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="p-4 border-t bg-gray-50/50 flex-shrink-0 rounded-b-2xl">
              <button
                onClick={onClose}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.buttonBg} text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all shadow-md`}
              >
                <X size={16} />
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionDetailsPopup;