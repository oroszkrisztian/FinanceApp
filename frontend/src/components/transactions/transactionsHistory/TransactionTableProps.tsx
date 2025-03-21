import React, { useEffect, useState } from "react";
import { ChevronRight, Calendar, Clock } from "lucide-react";

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
  transactionType,
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

  const getTransactionTypeClass = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return "bg-green-50 text-green-800 border-green-200";
      case TransactionType.EXPENSE:
        return "bg-red-50 text-red-800 border-red-200";
      case TransactionType.TRANSFER:
        return "bg-blue-50 text-blue-800 border-blue-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return "Income";
      case TransactionType.EXPENSE:
        return "Expense";
      case TransactionType.TRANSFER:
        return "Transfer";
      default:
        return "Unknown";
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
      <div className="flex flex-col items-center justify-center p-6 text-center bg-white rounded-lg shadow-sm">
        <svg
          className="w-10 h-10 text-gray-300 mb-3"
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
        <p className="text-gray-600 font-medium">No transactions found</p>
        <p className="text-gray-400 text-sm mt-1">
          Try changing your filters or adding a new transaction
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center bg-white rounded-lg shadow-sm">
        <div className="inline-block w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-2"></div>
        <p className="text-gray-600 text-sm">Loading account information...</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-80 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Unified card-based layout for all screen sizes */}
          <div className="divide-y divide-gray-100">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
                onClick={() => handleRowClick(transaction)}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {transaction.type === TransactionType.TRANSFER ? (
                        <span className="font-semibold">
                          {getAccountName(transaction.fromAccountId)} →{" "}
                          {getAccountName(transaction.toAccountId)}
                        </span>
                      ) : (
                        transaction.name || "Untitled Transaction"
                      )}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(transaction.date)}
                      <Clock className="h-4 w-4 ml-3 mr-1" />
                      {new Date(transaction.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div
                    className={`text-base font-semibold ${getAmountColor(transaction.type)}`}
                  >
                    → {formatAmount(transaction.amount)} {transaction.currency} 
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    { transaction.type === TransactionType.INCOME ? (
                      <span>To: {getAccountName(transaction.toAccountId)}</span>
                    ) : (
                      <span>
                        From: {getAccountName(transaction.fromAccountId)}
                      </span>
                    )}
                  </div>
                </div>

                {transaction.description &&
                  transaction.type !== TransactionType.TRANSFER && (
                    <div className="text-sm text-gray-500 mt-2 truncate">
                      {transaction.description}
                    </div>
                  )}
              </div>
            ))}
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
