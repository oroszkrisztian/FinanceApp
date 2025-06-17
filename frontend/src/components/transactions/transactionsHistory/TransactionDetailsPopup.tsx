import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  FileText,
  Clock,
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
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
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
          bgLight: "bg-green-50/80",
          border: "border-green-200/50",
          buttonBg: "bg-gradient-to-r from-green-600 to-green-700",
        };
      case TransactionType.EXPENSE:
        return {
          gradient: "bg-gradient-to-r from-red-600 to-red-800",
          textColor: "text-red-600",
          bgLight: "bg-red-50/80",
          border: "border-red-200/50",
          buttonBg: "bg-gradient-to-r from-red-600 to-red-700",
        };
      case TransactionType.TRANSFER:
        return {
          gradient: "bg-gradient-to-r from-blue-600 to-blue-800",
          textColor: "text-blue-600",
          bgLight: "bg-blue-50/80",
          border: "border-blue-200/50",
          buttonBg: "bg-gradient-to-r from-blue-600 to-blue-700",
        };
      default:
        return {
          gradient: "bg-gradient-to-r from-gray-600 to-gray-800",
          textColor: "text-gray-600",
          bgLight: "bg-gray-50/80",
          border: "border-gray-200/50",
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
            className="bg-white rounded-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden"
            style={{
              maxWidth: isMobileView ? "100%" : "28rem",
              minWidth: isMobileView ? "auto" : "24rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <div
              className={`${theme.gradient} text-white relative overflow-hidden`}
            >
              {/* Mobile-optimized background elements */}
              <div
                className={`absolute top-0 right-0 bg-white/20 rounded-full ${
                  isMobileView
                    ? "w-12 h-12 -translate-y-6 translate-x-6"
                    : "w-16 h-16 -translate-y-8 translate-x-8"
                }`}
              ></div>
              <div
                className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${
                  isMobileView
                    ? "w-8 h-8 translate-y-4 -translate-x-4"
                    : "w-12 h-12 translate-y-6 -translate-x-6"
                }`}
              ></div>
              <div
                className={`absolute bg-white/15 rounded-full ${
                  isMobileView
                    ? "top-2 left-16 w-6 h-6"
                    : "top-2 left-16 w-8 h-8"
                }`}
              ></div>
              <div
                className={`absolute bg-white/10 rounded-full ${
                  isMobileView
                    ? "bottom-2 right-12 w-4 h-4"
                    : "bottom-2 right-12 w-6 h-6"
                }`}
              ></div>

              <div
                className={`relative z-10 ${isMobileView ? "p-2.5" : "p-3"}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div
                      className="bg-white rounded-full shadow-lg flex items-center justify-center"
                      style={{
                        width: isMobileView ? "2rem" : "2.5rem",
                        height: isMobileView ? "2rem" : "2.5rem",
                      }}
                    >
                      <span className={isMobileView ? "text-base" : "text-lg"}>
                        {getTransactionIcon(transaction.type)}
                      </span>
                    </div>
                    <div>
                      <h2
                        className={`font-bold ${isMobileView ? "text-base" : "text-lg"}`}
                      >
                        {getTransactionTitle()}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`font-bold ${isMobileView ? "text-base" : "text-xl"}`}
                        >
                          {getAmountPrefix()}
                          {formatAmount(transaction.amount)}{" "}
                          {transaction.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={isMobileView ? 20 : 24} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div
              className={`flex-1 overflow-y-auto ${isMobileView ? "p-3" : "p-4"} space-y-3`}
            >
              {/* Basic Info Grid */}
              <div
                className={`grid ${isMobileView ? "grid-cols-1" : "grid-cols-2"} gap-2`}
              >
                {/* Date */}
                <div
                  className={`flex items-center gap-2 p-2 ${theme.bgLight} backdrop-blur-sm border ${theme.border} rounded-xl shadow-sm`}
                >
                  <Calendar
                    className={theme.textColor}
                    size={isMobileView ? 14 : 16}
                  />
                  <div>
                    <p className="text-xs text-gray-600">Date</p>
                    <p className="text-sm font-medium">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div
                  className={`flex items-center gap-2 p-2 ${theme.bgLight} backdrop-blur-sm border ${theme.border} rounded-xl shadow-sm`}
                >
                  <Clock
                    className="text-indigo-600"
                    size={isMobileView ? 14 : 16}
                  />
                  <div>
                    <p className="text-xs text-gray-600">Time</p>
                    <p className="text-sm font-medium">
                      {new Date(transaction.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Transaction Type */}
                <div
                  className={`flex items-center gap-2 p-2 ${theme.bgLight} backdrop-blur-sm border ${theme.border} rounded-xl shadow-sm ${isMobileView ? "" : "col-span-1"}`}
                >
                  <Tag
                    className="text-purple-600"
                    size={isMobileView ? 14 : 16}
                  />
                  <div>
                    <p className="text-xs text-gray-600">Type</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">
                        {getTransactionIcon(transaction.type)}
                      </span>
                      <span className="text-sm font-medium capitalize">
                        {transaction.type.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Currency */}
                <div
                  className={`flex items-center gap-2 p-2 ${theme.bgLight} backdrop-blur-sm border ${theme.border} rounded-xl shadow-sm`}
                >
                  <DollarSign
                    className="text-green-600"
                    size={isMobileView ? 14 : 16}
                  />
                  <div>
                    <p className="text-xs text-gray-600">Currency</p>
                    <p className="text-sm font-medium">
                      {transaction.currency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Name (for Income/Expense) */}
              {(transaction.type === TransactionType.EXPENSE ||
                transaction.type === TransactionType.INCOME) &&
                transaction.name && (
                  <div
                    className={`p-2 ${theme.bgLight} backdrop-blur-sm border ${theme.border} rounded-xl shadow-sm`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Tag className="text-purple-600" size={12} />
                      <p className="text-xs font-medium text-gray-700">Name</p>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {transaction.name}
                    </p>
                  </div>
                )}

              {/* Account Information */}
              {(transaction.fromAccountId || transaction.toAccountId) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Account Information
                  </h3>

                  <div className="grid grid-cols-1 gap-2">
                    {/* From Account */}
                    {transaction.fromAccountId && (
                      <div
                        className={`flex items-center gap-2 p-2 ${theme.bgLight} backdrop-blur-sm border ${theme.border} rounded-xl shadow-sm`}
                      >
                        <CreditCard className="text-indigo-600" size={14} />
                        <div>
                          <p className="text-xs text-gray-600">
                            {transaction.type === TransactionType.TRANSFER
                              ? "From Account"
                              : "Account"}
                          </p>
                          <p className="text-sm font-medium">
                            {getAccountName(transaction.fromAccountId)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* To Account */}
                    {transaction.toAccountId && (
                      <div
                        className={`flex items-center gap-2 p-2 ${theme.bgLight} backdrop-blur-sm border ${theme.border} rounded-xl shadow-sm`}
                      >
                        <CreditCard className="text-indigo-600" size={14} />
                        <div>
                          <p className="text-xs text-gray-600">
                            {transaction.type === TransactionType.TRANSFER
                              ? "To Account"
                              : "Account"}
                          </p>
                          <p className="text-sm font-medium">
                            {getAccountName(transaction.toAccountId)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {transaction.description && (
                <div className="p-2 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="text-blue-600" size={12} />
                    <p className="text-xs font-medium text-blue-800">
                      Description
                    </p>
                  </div>
                  <p className="text-sm text-blue-700">
                    {transaction.description}
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Footer */}
            <div
              className={`${isMobileView ? "p-2.5" : "p-3"} border-t bg-gray-50/50 backdrop-blur-sm flex-shrink-0 rounded-b-2xl`}
            >
              <motion.button
                onClick={onClose}
                className={`w-full flex items-center justify-center gap-2 ${isMobileView ? "px-3 py-2" : "px-4 py-2.5"} ${theme.buttonBg} text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all shadow-md text-sm`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X size={14} />
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionDetailsPopup;
