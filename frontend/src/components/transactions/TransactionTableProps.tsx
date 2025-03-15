import React, { useEffect, useState } from "react";
import { Transaction } from "../../interfaces/Transaction";
import { TransactionType } from "../../interfaces/enums";
import { Account } from "../../interfaces/Account";
import { fetchAllAccounts } from "../../services/accountService";
import { useAuth } from "../../context/AuthContext";

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

  // Add responsive logic to check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
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

    // Use fewer columns on small screens
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

    // Full columns on larger screens
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
        return [...baseColumns, "amount", "fromAccount", "toAccount"];
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

  // Get column display name
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

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 md:p-8 text-center">
        <svg
          className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mb-3 md:mb-4"
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
        <p className="text-gray-500 font-medium text-sm md:text-base">No transactions found</p>
        <p className="text-gray-400 text-xs md:text-sm mt-1">
          Try changing your filters or adding a new transaction
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 text-center">
        <div className="inline-block w-5 h-5 md:w-6 md:h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-2"></div>
        <p className="text-gray-500 text-sm md:text-base">Loading account information...</p>
      </div>
    );
  }

  const columns = getColumns();

  // Card view for small screens
  if (isSmallScreen) {
    return (
      <div className="px-2 divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <div 
            key={transaction.id}
            className="py-3 px-2 bg-white hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex justify-between mb-1">
              <div className="text-sm font-medium text-gray-900">
                {transaction.name || "Unnamed Transaction"}
              </div>
              <div
                className={`text-sm font-medium ${
                  transaction.type === TransactionType.INCOME
                    ? "text-green-600"
                    : transaction.type === TransactionType.EXPENSE
                      ? "text-red-600"
                      : "text-blue-600" 
                }`}
              >
                {transaction.currency} {formatAmount(transaction.amount)}
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <div>
                {formatDate(transaction.date)}
                <span className="ml-1">
                  {new Date(transaction.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              
              {transaction.type === TransactionType.TRANSFER && (
                <div>
                  {getAccountName(transaction.fromAccountId)} → {getAccountName(transaction.toAccountId)}
                </div>
              )}
              
              {transaction.type === TransactionType.EXPENSE && 
                transaction.fromAccountId && (
                <div>{getAccountName(transaction.fromAccountId)}</div>
              )}
              
              {transaction.type === TransactionType.INCOME && 
                transaction.toAccountId && (
                <div>{getAccountName(transaction.toAccountId)}</div>
              )}
            </div>
            
            {transaction.description && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {transaction.description}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Table view for larger screens
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {getColumnTitle(column)}
              </th>
            ))}
            <th className="relative px-3 py-3 md:px-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              {/* Date Column */}
              {columns.includes("date") && (
                <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {formatDate(transaction.date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
              )}

              {/* Type Column */}
              {columns.includes("type") && (
                <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  {getTransactionTypeLabel(transaction.type)}
                </td>
              )}

              {/* Name Column */}
              {columns.includes("name") && (
                <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.name || "-"}
                  </div>
                </td>
              )}

              {/* Amount Column */}
              {columns.includes("amount") && (
                <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <div
                    className={`text-sm font-medium ${
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

              {/* From Account Column */}
              {columns.includes("fromAccount") && (
                <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getAccountName(transaction.fromAccountId)}
                  </div>
                </td>
              )}

              {/* To Account Column */}
              {columns.includes("toAccount") && (
                <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getAccountName(transaction.toAccountId)}
                  </div>
                </td>
              )}
              
              {/* Combined Accounts Column for small screens */}
              {columns.includes("accounts") && (
                <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getAccountName(transaction.fromAccountId)} → {getAccountName(transaction.toAccountId)}
                  </div>
                </td>
              )}

              {/* Category Column */}
              {columns.includes("customCategoryId") && (
                <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {transaction.customCategoryId || "-"}
                  </div>
                </td>
              )}

              {/* Description Column */}
              {columns.includes("description") && (
                <td className="px-3 py-3 md:px-6 md:py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {transaction.description || "-"}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;