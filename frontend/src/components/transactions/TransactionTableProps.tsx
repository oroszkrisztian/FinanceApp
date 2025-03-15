import React, { useEffect, useState } from "react";
import { Transaction } from "../../interfaces/Transaction";
import { TransactionType } from "../../interfaces/enums";
import { Account } from "../../interfaces/Account";
import { fetchAllAccounts } from "../../services/accountService";
import { useAuth } from "../../context/AuthContext";
import TransactionDetailsPopup from "./TransactionDetailsPopup";

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
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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

  const getColumns = () => {
    const baseColumns = ["date"];

    if (isSmallScreen) {
      switch (transactionType) {
        case TransactionType.INCOME:
          return [...baseColumns, "name", "amount"];
        case TransactionType.EXPENSE:
          return [...baseColumns, "name", "amount"];
        case TransactionType.TRANSFER:
          return [...baseColumns, "amount", "accounts"];
        default:
          return [...baseColumns, "type", "name", "amount"];
      }
    }

    switch (transactionType) {
      case TransactionType.INCOME:
        return [...baseColumns, "name", "amount", "toAccount", "description"];
      case TransactionType.EXPENSE:
        return [
          ...baseColumns,
          "name",
          "amount",
          "fromAccount",
          "customCategoryId",
          "description",
        ];
      case TransactionType.TRANSFER:
        return [...baseColumns, "amount", "fromAccount"];
      default:
        return [
          ...baseColumns,
          "type",
          "name",
          "amount",
          "fromAccount",
          "toAccount",
          "description",
        ];
    }
  };

  const getColumnTitle = (column: string) => {
    switch (column) {
      case "id":
        return "ID";
      case "date":
        return "Date";
      case "name":
        return "Name";
      case "amount":
        return "Amount";
      case "type":
        return "Type";
      case "description":
        return "Description";
      case "fromAccount":
        return "From Account";
      case "toAccount":
        return "To Saving";
      case "customCategoryId":
        return "Category";
      case "accounts":
        return "Accounts";
      default:
        return column.charAt(0).toUpperCase() + column.slice(1);
    }
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

  const getBorderColor = (transactionType: TransactionType) => {
    switch (transactionType) {
      case TransactionType.INCOME:
        return "border-green-600";
      case TransactionType.EXPENSE:
        return "border-red-600";
      case TransactionType.TRANSFER:
        return "border-blue-600";
      default:
        return "border-gray-500";
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
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg shadow-sm">
        <svg
          className="w-12 h-12 text-gray-300 mb-4"
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
        <p className="text-gray-600 font-medium text-lg">
          No transactions found
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Try changing your filters or adding a new transaction
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-sm">
        <div className="inline-block w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-3"></div>
        <p className="text-gray-600 text-sm">Loading account information...</p>
      </div>
    );
  }

  const columns = getColumns();

  return (
    <>
      <div className="h-80 relative bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 ${getBorderColor(transactionType)}`}
                  >
                    {getColumnTitle(column)}
                  </th>
                ))}
                <th
                  className={`relative px-4 py-3 border-b-2 ${getBorderColor(transactionType)}`}
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="h-[calc(100%-48px)] overflow-y-auto">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <tbody className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => handleRowClick(transaction)}
                >
                  {columns.includes("date") && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(transaction.date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {isSmallScreen &&
                        transaction.type === TransactionType.TRANSFER &&
                        transaction.name && (
                          <div className="text-xs text-gray-500 mt-1">
                            {transaction.name}
                          </div>
                        )}
                    </td>
                  )}

                  {columns.includes("type") && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getTransactionTypeLabel(transaction.type)}
                    </td>
                  )}

                  {columns.includes("name") && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.name || "-"}
                      </div>
                    </td>
                  )}

                  {columns.includes("amount") && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div
                        className={`text-sm font-semibold ${
                          transaction.type === TransactionType.INCOME
                            ? "text-green-600"
                            : transaction.type === TransactionType.EXPENSE
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {transaction.currency} {formatAmount(transaction.amount)}
                      </div>
                    </td>
                  )}

                  {columns.includes("fromAccount") && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getAccountName(transaction.fromAccountId)}
                        {transaction.type === TransactionType.TRANSFER &&
                          transaction.toAccountId && (
                            <span className="text-gray-500">
                              {" "}
                              → {getAccountName(transaction.toAccountId)}
                            </span>
                          )}
                      </div>
                    </td>
                  )}

                  {columns.includes("toAccount") &&
                    transaction.type !== TransactionType.TRANSFER && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getAccountName(transaction.toAccountId)}
                        </div>
                      </td>
                    )}

                  {columns.includes("accounts") && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getAccountName(transaction.fromAccountId)} →{" "}
                        {getAccountName(transaction.toAccountId)}
                      </div>
                    </td>
                  )}

                  {columns.includes("customCategoryId") && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.customCategoryId || "-"}
                      </div>
                    </td>
                  )}

                  {columns.includes("description") && (
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {transaction.description || "-"}
                      </div>
                    </td>
                  )}

                  <td className="relative px-4 py-3">
                    <span className="sr-only">View Details</span>
                    <button className="text-gray-400 hover:text-gray-500">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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