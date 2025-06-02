import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Tag,
  CreditCard,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowRightLeft,
} from "lucide-react";

interface Transaction {
  id?: number;
  amount: number;
  currency: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  description?: string;
  name?: string;
  category?: string;
  categories?: any[]; // For upcoming payments
  transactionCategories?: any[]; // For regular transactions
  account?: string;
  fromAccount?: string; // For transfer transactions
  toAccount?: string; // For transfer transactions
  createdAt?: string;
  date?: string;
}

interface UpcomingPayment {
  id: number;
  name: string;
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  categories?: string[];
  account?: string;
  nextExecution: string;
  frequency?: string;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
}

interface CombinedTransaction extends Transaction {
  isUpcoming: boolean;
  sortDate: Date;
  nextExecution?: string;
  frequency?: string;
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  futureIncomingPayments: UpcomingPayment[];
  futureOutgoingPayments: UpcomingPayment[];
  displayCurrency: string;
  includeUpcoming: boolean;
  monthName: string;
  convertToDisplayCurrency: (amount: number, currency: string) => number;
  filterType?: "income" | "expense" | "transfer" | "all";
  accounts: any[];
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  futureIncomingPayments,
  futureOutgoingPayments,
  displayCurrency,
  includeUpcoming,
  monthName,
  convertToDisplayCurrency,
  filterType = "all",
  accounts,
}) => {
  const [isMobileView, setIsMobileView] = React.useState(false);

  // Check for mobile view on mount and resize
  React.useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const processedData = useMemo(() => {
    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    // Helper function to check if a payment should be included in the current month
    const shouldIncludePaymentInMonth = (
      paymentDate: Date,
      currentMonth: Date,
      startOfMonth: Date,
      endOfMonth: Date
    ): boolean => {
      if (isNaN(paymentDate.getTime())) return false;

      const paymentDateOnly = new Date(
        paymentDate.getFullYear(),
        paymentDate.getMonth(),
        paymentDate.getDate()
      );
      const startOfMonthOnly = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth(),
        startOfMonth.getDate()
      );
      const endOfMonthOnly = new Date(
        endOfMonth.getFullYear(),
        endOfMonth.getMonth(),
        endOfMonth.getDate()
      );

      if (
        paymentDateOnly >= startOfMonthOnly &&
        paymentDateOnly <= endOfMonthOnly
      ) {
        return true;
      }

      const paymentDay = paymentDate.getDate();
      const currentMonthNum = currentMonth.getMonth();
      const currentYear = currentMonth.getFullYear();

      if (
        paymentDay === 31 &&
        paymentDate.getMonth() === currentMonthNum &&
        paymentDate.getFullYear() === currentYear &&
        endOfMonth.getDate() < 31
      ) {
        return true;
      }

      if (paymentDay === 31 && endOfMonth.getDate() < 31) {
        if (
          paymentDate.getFullYear() === currentYear &&
          paymentDate.getMonth() > currentMonthNum
        ) {
          return true;
        }
      }

      return false;
    };

    // Filter current month transactions
    const monthlyTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.createdAt || t.date || "");
      return shouldIncludePaymentInMonth(
        transactionDate,
        currentMonth,
        startOfMonth,
        endOfMonth
      );
    });

    // Separate income, expense, and transfer transactions
    const incomeTransactions = monthlyTransactions.filter(
      (t) => t.type === "INCOME"
    );
    const expenseTransactions = monthlyTransactions.filter(
      (t) => t.type === "EXPENSE"
    );
    const transferTransactions = monthlyTransactions.filter(
      (t) => t.type === "TRANSFER"
    );

    // Filter upcoming payments for current month using the same logic as the chart
    const upcomingIncome = futureIncomingPayments.filter((p) => {
      if (!p.nextExecution) return false;
      const nextDate = new Date(p.nextExecution);
      return shouldIncludePaymentInMonth(
        nextDate,
        currentMonth,
        startOfMonth,
        endOfMonth
      );
    });

    const upcomingExpenses = futureOutgoingPayments.filter((p) => {
      if (!p.nextExecution) return false;
      const nextDate = new Date(p.nextExecution);
      return (
        shouldIncludePaymentInMonth(
          nextDate,
          currentMonth,
          startOfMonth,
          endOfMonth
        ) &&
        (!p.type || p.type === "EXPENSE")
      );
    });

    // Calculate totals
    const totalActualIncome = incomeTransactions.reduce(
      (sum, t) =>
        sum +
        convertToDisplayCurrency(t.amount || 0, t.currency || displayCurrency),
      0
    );

    const totalActualExpenses = expenseTransactions.reduce(
      (sum, t) =>
        sum +
        convertToDisplayCurrency(t.amount || 0, t.currency || displayCurrency),
      0
    );

    const totalActualTransfers = transferTransactions.reduce(
      (sum, t) =>
        sum +
        convertToDisplayCurrency(t.amount || 0, t.currency || displayCurrency),
      0
    );

    const totalUpcomingIncome = upcomingIncome.reduce(
      (sum, p) =>
        sum +
        convertToDisplayCurrency(p.amount || 0, p.currency || displayCurrency),
      0
    );

    const totalUpcomingExpenses = upcomingExpenses.reduce(
      (sum, p) =>
        sum +
        convertToDisplayCurrency(p.amount || 0, p.currency || displayCurrency),
      0
    );

    // Create combined list of all transactions for "all" filter type
    const allTransactionsWithUpcoming: CombinedTransaction[] = [];

    // Add actual transactions
    monthlyTransactions.forEach((t) => {
      allTransactionsWithUpcoming.push({
        ...t,
        isUpcoming: false,
        sortDate: new Date(t.createdAt || t.date || ""),
      });
    });

    // Add upcoming payments if included
    if (includeUpcoming) {
      upcomingIncome.forEach((p) => {
        allTransactionsWithUpcoming.push({
          ...p,
          type: "INCOME" as const,
          isUpcoming: true,
          sortDate: new Date(p.nextExecution),
        });
      });

      upcomingExpenses.forEach((p) => {
        allTransactionsWithUpcoming.push({
          ...p,
          type: "EXPENSE" as const,
          isUpcoming: true,
          sortDate: new Date(p.nextExecution),
        });
      });
    }

    // Sort by date (most recent first) - for "all" filter type
    allTransactionsWithUpcoming.sort(
      (a, b) => b.sortDate.getTime() - a.sortDate.getTime()
    );

    return {
      incomeTransactions,
      expenseTransactions,
      transferTransactions,
      upcomingIncome,
      upcomingExpenses,
      allTransactionsWithUpcoming,
      totalActualIncome,
      totalActualExpenses,
      totalActualTransfers,
      totalUpcomingIncome,
      totalUpcomingExpenses,
      totalIncome:
        totalActualIncome + (includeUpcoming ? totalUpcomingIncome : 0),
      totalExpenses:
        totalActualExpenses + (includeUpcoming ? totalUpcomingExpenses : 0),
      totalTransfers: totalActualTransfers,
      // For simplified view calculations
      actualNet: totalActualIncome - totalActualExpenses - totalActualTransfers,
      projectedNet: totalUpcomingIncome - totalUpcomingExpenses,
    };
  }, [
    transactions,
    futureIncomingPayments,
    futureOutgoingPayments,
    displayCurrency,
    includeUpcoming,
    convertToDisplayCurrency,
  ]);

  const netAmount =
    filterType === "income"
      ? processedData.totalIncome
      : filterType === "expense"
        ? -processedData.totalExpenses
        : filterType === "transfer"
          ? -processedData.totalTransfers
          : processedData.totalIncome -
            processedData.totalExpenses -
            processedData.totalTransfers;

  const isPositive =
    filterType === "expense" || filterType === "transfer"
      ? false
      : filterType === "income"
        ? true
        : netAmount >= 0;

  const getHeaderGradient = () => {
    if (filterType === "income")
      return "bg-gradient-to-r from-green-600 to-green-800";
    if (filterType === "expense")
      return "bg-gradient-to-r from-red-600 to-red-800";
    if (filterType === "transfer")
      return "bg-gradient-to-r from-blue-600 to-blue-800";
    // For 'all' type, use blue theme
    return "bg-gradient-to-r from-blue-600 to-blue-800";
  };

  const getHeaderIcon = () => {
    if (filterType === "income")
      return <TrendingUp size={isMobileView ? 20 : 24} />;
    if (filterType === "expense")
      return <TrendingDown size={isMobileView ? 20 : 24} />;
    if (filterType === "transfer")
      return <ArrowRightLeft size={isMobileView ? 20 : 24} />;
    // For 'all' type, show DollarSign icon
    return <DollarSign size={isMobileView ? 20 : 24} />;
  };

  const getIconColor = () => {
    if (filterType === "income") return "text-green-600";
    if (filterType === "expense") return "text-red-600";
    if (filterType === "transfer") return "text-blue-600";
    // For 'all' type, use blue
    return "text-blue-600";
  };

  const getTextColor = () => {
    if (filterType === "income") return "text-green-700";
    if (filterType === "expense") return "text-red-700";
    if (filterType === "transfer") return "text-blue-700";
    return "text-gray-700";
  };

  const getModalTitle = () => {
    if (filterType === "income") return `${monthName} Income`;
    if (filterType === "expense") return `${monthName} Expenses`;
    if (filterType === "transfer") return `${monthName} Account Movements`;
    return `${monthName} Transactions`;
  };

  const getAmountDisplay = () => {
    if (filterType === "income")
      return `${processedData.totalIncome.toFixed(2)} ${displayCurrency}`;
    if (filterType === "expense")
      return `${processedData.totalExpenses.toFixed(2)} ${displayCurrency}`;
    if (filterType === "transfer")
      return `${processedData.totalTransfers.toFixed(2)} ${displayCurrency}`;
    return `${Math.abs(netAmount).toFixed(2)} ${displayCurrency}`;
  };

  const getSubtitle = () => {
    if (filterType === "income") return "Total Income";
    if (filterType === "expense") return "Total Expenses";
    if (filterType === "transfer") return "Total Transfers";
    return `Net ${isPositive ? "Surplus" : "Deficit"}`;
  };

  const getAccountName = (accountId: number | string | any) => {
    // Handle case where accountId is an object
    if (
      typeof accountId === "object" &&
      accountId !== null &&
      "name" in accountId
    ) {
      return accountId.name || `Account ${accountId.id || "Unknown"}`;
    }
    // Handle regular account id lookup
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || `Account ${accountId}`;
  };

  const TransactionItem: React.FC<{
    transaction: Transaction | CombinedTransaction;
    isUpcoming?: boolean;
  }> = ({ transaction, isUpcoming = false }) => {
    // Use the isUpcoming prop first, then check if it's a CombinedTransaction with isUpcoming property
    const actualIsUpcoming =
      isUpcoming ||
      ("isUpcoming" in transaction ? transaction.isUpcoming : false);
    const isIncome = transaction.type === "INCOME";
    const isExpense = transaction.type === "EXPENSE";
    const isTransfer = transaction.type === "TRANSFER";
    const originalAmount = transaction.amount || 0;
    const originalCurrency = transaction.currency || displayCurrency;
    const convertedAmount = convertToDisplayCurrency(
      originalAmount,
      originalCurrency
    );
    const needsConversion = originalCurrency !== displayCurrency;

    const categoryList: string[] = [];

    // Handle upcoming payment categories (categories array)
    if (transaction.categories && transaction.categories.length > 0) {
      transaction.categories.forEach((cat: any) => {
        if (cat.customCategory?.name) {
          categoryList.push(cat.customCategory.name);
        } else if (cat.name) {
          categoryList.push(cat.name);
        } else if (typeof cat === "string") {
          categoryList.push(cat);
        }
      });
    }

    // Handle regular transaction categories (transactionCategories array)
    if (
      transaction.transactionCategories &&
      transaction.transactionCategories.length > 0
    ) {
      transaction.transactionCategories.forEach((cat: any) => {
        if (cat.customCategory?.name) {
          categoryList.push(cat.customCategory.name);
        } else if (cat.name) {
          categoryList.push(cat.name);
        }
      });
    }

    // Fallback to single category field
    if (categoryList.length === 0 && transaction.category) {
      categoryList.push(transaction.category);
    }

    const getBorderColor = () => {
      if (isIncome) return "border-green-200";
      if (isExpense) return "border-red-200";
      if (isTransfer) return "border-blue-200";
      return "border-gray-200";
    };

    const getBackgroundColor = () => {
      if (isIncome) return "bg-green-50/50";
      if (isExpense) return "bg-red-50/50";
      if (isTransfer) return "bg-blue-50/50";
      return "bg-gray-50/50";
    };

    const getIconColor = () => {
      if (isIncome) return "bg-green-100 text-green-600";
      if (isExpense) return "bg-red-100 text-red-600";
      if (isTransfer) return "bg-blue-100 text-blue-600";
      return "bg-gray-100 text-gray-600";
    };

    const getTextColor = () => {
      if (isIncome) return "text-green-700";
      if (isExpense) return "text-red-700";
      if (isTransfer) return "text-blue-700";
      return "text-gray-700";
    };

    const getCategoryColor = () => {
      if (isIncome) return "bg-green-100 text-green-700";
      if (isExpense) return "bg-red-100 text-red-700";
      if (isTransfer) return "bg-blue-100 text-blue-700";
      return "bg-gray-100 text-gray-700";
    };

    const getIcon = () => {
      if (isIncome) return <ArrowUp size={isMobileView ? 12 : 16} />;
      if (isExpense) return <ArrowDown size={isMobileView ? 12 : 16} />;
      if (isTransfer)
        return (
          <ArrowRightLeft
            className="text-blue-600"
            size={isMobileView ? 12 : 16}
          />
        );
      return <ArrowDown size={isMobileView ? 12 : 16} />;
    };

    // Add account name resolution for transfers
    const fromAccountName = transaction.fromAccount
      ? getAccountName(transaction.fromAccount)
      : "";
    const toAccountName = transaction.toAccount
      ? getAccountName(transaction.toAccount)
      : "";

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isMobileView ? "p-2" : "p-3"} rounded-xl border shadow-sm ${getBackgroundColor()} ${getBorderColor()} ${actualIsUpcoming ? "border-dashed" : ""}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <div
              className={`${isMobileView ? "p-1" : "p-2"} rounded-lg ${getIconColor()}`}
            >
              {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={`font-medium text-gray-900 truncate ${isMobileView ? "text-sm" : ""}`}
                  >
                    {isTransfer &&
                    transaction.fromAccount &&
                    transaction.toAccount ? (
                      <span className="font-bold text-gray-900">
                        {fromAccountName} → {toAccountName}
                      </span>
                    ) : (
                      transaction.description ||
                      transaction.name ||
                      (isIncome ? "Income" : "Expense")
                    )}
                  </p>

                  {/* Date and time display */}
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={10} />
                    {actualIsUpcoming && "nextExecution" in transaction ? (
                      // For upcoming payments (CombinedTransaction with nextExecution)
                      <>
                        <span className="text-orange-600 font-medium mr-1">
                          Upcoming:
                        </span>
                        {new Date(
                          transaction.nextExecution!
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {!isMobileView && (
                          <span className="ml-1">
                            {new Date(
                              transaction.nextExecution!
                            ).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {"frequency" in transaction &&
                          transaction.frequency &&
                          !isMobileView && (
                            <span className="ml-2">
                              • {transaction.frequency.toLowerCase()}
                            </span>
                          )}
                      </>
                    ) : (
                      // For regular transactions
                      <>
                        {new Date(
                          transaction.createdAt || transaction.date || ""
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {!isMobileView && (
                          <span className="ml-1">
                            {new Date(
                              transaction.createdAt || transaction.date || ""
                            ).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </>
                    )}
                  </p>

                  {actualIsUpcoming && !("nextExecution" in transaction) && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock size={10} />
                      Upcoming
                    </p>
                  )}
                </div>

                <div className="text-right ml-2">
                  <p
                    className={`font-bold text-black ${isMobileView ? "text-sm" : ""}`}
                  >
                    {isTransfer
                      ? `${originalAmount.toFixed(2)} ${originalCurrency}`
                      : `${originalAmount.toFixed(2)} ${originalCurrency}`}
                  </p>
                  {needsConversion && (
                    <p className="text-xs text-gray-600">
                      ({convertedAmount.toFixed(2)} {displayCurrency})
                    </p>
                  )}
                </div>
              </div>

              {/* Categories - more compact on mobile */}
              {categoryList.length > 0 && (
                <div
                  className={`flex flex-wrap gap-1 ${isMobileView ? "mt-1" : "mt-2"}`}
                >
                  {categoryList
                    .slice(0, isMobileView ? 2 : 3)
                    .map((category: string, index: number) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                          isMobileView ? "text-xs" : "text-xs"
                        } ${getCategoryColor()}`}
                      >
                        <Tag size={isMobileView ? 6 : 8} />
                        {category}
                      </span>
                    ))}
                  {categoryList.length > (isMobileView ? 2 : 3) && (
                    <span className="text-xs text-gray-500">
                      +{categoryList.length - (isMobileView ? 2 : 3)} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const UpcomingPaymentItem: React.FC<{ payment: UpcomingPayment }> = ({
    payment,
  }) => {
    const isIncome = futureIncomingPayments.includes(payment);
    const isTransfer = payment.type === "TRANSFER";
    const isExpense = !isIncome && !isTransfer;
    const originalAmount = payment.amount || 0;
    const originalCurrency = payment.currency || displayCurrency;
    const convertedAmount = convertToDisplayCurrency(
      originalAmount,
      originalCurrency
    );
    const needsConversion = originalCurrency !== displayCurrency;

    const categoryList: string[] = [];

    // Handle upcoming payment categories (categories array)
    if (payment.categories && payment.categories.length > 0) {
      payment.categories.forEach((cat: any) => {
        if (cat.customCategory?.name) {
          categoryList.push(cat.customCategory.name);
        } else if (cat.name) {
          categoryList.push(cat.name);
        } else if (typeof cat === "string") {
          categoryList.push(cat);
        }
      });
    }

    // Fallback to single category field
    if (categoryList.length === 0 && payment.category) {
      categoryList.push(payment.category);
    }

    const getBorderColor = () => {
      if (isIncome) return "border-green-300";
      if (isExpense) return "border-red-300";
      if (isTransfer) return "border-blue-300";
      return "border-gray-300";
    };

    const getBackgroundColor = () => {
      if (isIncome) return "bg-green-50/30";
      if (isExpense) return "bg-red-50/30";
      if (isTransfer) return "bg-blue-50/30";
      return "bg-gray-50/30";
    };

    const getIconColor = () => {
      if (isIncome) return "bg-green-100 text-green-600";
      if (isExpense) return "bg-red-100 text-red-600";
      if (isTransfer) return "bg-blue-100 text-blue-600";
      return "bg-gray-100 text-gray-600";
    };

    const getTextColor = () => {
      if (isIncome) return "text-green-700";
      if (isExpense) return "text-red-700";
      if (isTransfer) return "text-blue-700";
      return "text-gray-700";
    };

    const getCategoryColor = () => {
      if (isIncome) return "bg-green-100 text-green-700";
      if (isExpense) return "bg-red-100 text-red-700";
      if (isTransfer) return "bg-blue-100 text-blue-700";
      return "bg-gray-100 text-gray-700";
    };

    const getIcon = () => {
      if (isIncome) return <ArrowUp size={isMobileView ? 12 : 16} />;
      if (isExpense) return <ArrowDown size={isMobileView ? 12 : 16} />;
      if (isTransfer) return <ArrowRightLeft size={isMobileView ? 12 : 16} />;
      return <ArrowDown size={isMobileView ? 12 : 16} />;
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isMobileView ? "p-2" : "p-3"} rounded-xl border-2 border-dashed shadow-sm ${getBackgroundColor()} ${getBorderColor()}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <div
              className={`${isMobileView ? "p-1" : "p-2"} rounded-lg ${getIconColor()}`}
            >
              {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={`font-medium text-gray-900 truncate ${isMobileView ? "text-sm" : ""}`}
                  >
                    {payment.description ||
                      payment.name ||
                      (isIncome
                        ? "Upcoming Income"
                        : isTransfer
                          ? "Upcoming Transfer"
                          : "Upcoming Expense")}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={10} />
                    <span className="text-orange-600 font-medium mr-1">
                      Upcoming:
                    </span>
                    {new Date(payment.nextExecution).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                    {!isMobileView && (
                      <span className="ml-1">
                        {new Date(payment.nextExecution).toLocaleTimeString(
                          "en-GB",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    )}
                    {payment.frequency && !isMobileView && (
                      <span className="ml-2">
                        • {payment.frequency.toLowerCase()}
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right ml-2">
                  <p
                    className={`font-bold text-black ${isMobileView ? "text-sm" : ""}`}
                  >
                    {originalAmount.toFixed(2)} {originalCurrency}
                  </p>
                  {needsConversion && (
                    <p className="text-xs text-gray-600">
                      ({convertedAmount.toFixed(2)} {displayCurrency})
                    </p>
                  )}
                </div>
              </div>

              {/* Categories - more compact on mobile */}
              {categoryList.length > 0 && (
                <div
                  className={`flex flex-wrap gap-1 ${isMobileView ? "mt-1" : "mt-2"}`}
                >
                  {categoryList
                    .slice(0, isMobileView ? 2 : 3)
                    .map((category: string, index: number) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                          isMobileView ? "text-xs" : "text-xs"
                        } ${getCategoryColor()}`}
                      >
                        <Tag size={isMobileView ? 6 : 8} />
                        {category}
                      </span>
                    ))}
                  {categoryList.length > (isMobileView ? 2 : 3) && (
                    <span className="text-xs text-gray-500">
                      +{categoryList.length - (isMobileView ? 2 : 3)} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Check if we should show simplified view (all + includeUpcoming)
  const showSimplifiedView = filterType === "all" && includeUpcoming;

  // Check if we should show single column for all transactions (any "all" filter)
  const showSingleColumn = filterType === "all";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-2 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white rounded-2xl w-full shadow-2xl flex flex-col ${
              isMobileView ? "max-w-sm max-h-[95vh]" : "max-w-md max-h-[90vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div
              className={`${isMobileView ? "p-3" : "p-4"} ${getHeaderGradient()} text-white relative flex-shrink-0 rounded-t-2xl`}
            >
              {/* Decorative circles - smaller on mobile */}
              {!isMobileView && (
                <>
                  <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
                  <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
                  <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>
                </>
              )}

              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className={`bg-white rounded-full ${isMobileView ? "p-1.5" : "p-2"} shadow-lg ${getIconColor()}`}
                  >
                    {getHeaderIcon()}
                  </div>
                  <div>
                    <h2
                      className={`font-bold ${isMobileView ? "text-lg" : "text-xl"}`}
                    >
                      {getModalTitle()}
                    </h2>
                    <div
                      className={`flex items-center ${isMobileView ? "gap-2" : "gap-4"} mt-1`}
                    >
                      <span
                        className={`font-bold ${isMobileView ? "text-xl" : "text-2xl"}`}
                      >
                        {getAmountDisplay()}
                      </span>
                      <span
                        className={`bg-white/20 px-2 py-1 rounded-full ${isMobileView ? "text-xs" : "text-sm"}`}
                      >
                        {getSubtitle()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={isMobileView ? 20 : 24} />
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div
              className={`${isMobileView ? "p-3" : "p-4"} bg-gray-50 border-b`}
            >
              {showSimplifiedView ? (
                // Simplified view with just 2 cards for actual and projected
                <div
                  className={`grid gap-${isMobileView ? "2" : "4"} grid-cols-2`}
                >
                  <div
                    className={`${
                      processedData.actualNet >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    } border rounded-xl ${isMobileView ? "p-2" : "p-3"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign
                        className={`${
                          processedData.actualNet >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                        size={isMobileView ? 14 : 16}
                      />
                      <span
                        className={`${
                          processedData.actualNet >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        } font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                      >
                        {isMobileView ? "Actual" : "Actual Net"}
                      </span>
                    </div>
                    <p
                      className={`font-bold text-black ${isMobileView ? "text-base" : "text-lg"}`}
                    >
                      {processedData.actualNet.toFixed(2)} {displayCurrency}
                    </p>
                    <p
                      className={`text-xs ${parseFloat(getAmountDisplay()) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {processedData.incomeTransactions.length +
                        processedData.expenseTransactions.length +
                        processedData.transferTransactions.length}{" "}
                      transactions
                    </p>
                  </div>

                  <div
                    className={`${
                      parseFloat(getAmountDisplay()) >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    } border border-dashed rounded-xl ${isMobileView ? "p-2" : "p-3"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar
                        className={`${
                          parseFloat(getAmountDisplay()) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                        size={isMobileView ? 14 : 16}
                      />
                      <span
                        className={`${
                          parseFloat(getAmountDisplay()) >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        } font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                      >
                        {isMobileView ? "Projected" : "Projected Net"}
                      </span>
                    </div>
                    <p
                      className={`font-bold text-black ${isMobileView ? "text-base" : "text-lg"}`}
                    >
                      {Math.abs(processedData.totalUpcomingExpenses).toFixed(2)} {displayCurrency}
                    </p>
                    <p
                      className={`text-xs ${parseFloat(getAmountDisplay()) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {processedData.upcomingIncome.length +
                        processedData.upcomingExpenses.length}{" "}
                      payments
                    </p>
                  </div>
                </div>
              ) : (
                // Original detailed view
                <div
                  className={`grid gap-${isMobileView ? "2" : "4"} ${
                    filterType === "all"
                      ? isMobileView
                        ? "grid-cols-2"
                        : includeUpcoming
                          ? "grid-cols-6"
                          : "grid-cols-3"
                      : includeUpcoming
                        ? "grid-cols-2"
                        : "grid-cols-1"
                  }`}
                >
                  {(filterType === "income" || filterType === "all") && (
                    <div
                      className={`bg-green-50 border border-green-200 rounded-xl ${isMobileView ? "p-2" : "p-3"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp
                          className="text-green-600"
                          size={isMobileView ? 14 : 16}
                        />
                        <span
                          className={`text-green-700 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                        >
                          {isMobileView ? "Income" : "Actual Income"}
                        </span>
                      </div>
                      <p
                        className={`font-bold text-black ${isMobileView ? "text-base" : "text-lg"}`}
                      >
                        {processedData.totalActualIncome.toFixed(2)} {displayCurrency}
                      </p>
                      <p className="text-xs text-green-600">
                        {processedData.incomeTransactions.length} transactions
                      </p>
                    </div>
                  )}

                  {(filterType === "expense" || filterType === "all") && (
                    <div
                      className={`bg-red-50 border border-red-200 rounded-xl ${isMobileView ? "p-2" : "p-3"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown
                          className="text-red-600"
                          size={isMobileView ? 14 : 16}
                        />
                        <span
                          className={`text-red-700 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                        >
                          {isMobileView ? "Expenses" : "Actual Expenses"}
                        </span>
                      </div>
                      <p
                        className={`font-bold text-black ${isMobileView ? "text-base" : "text-lg"}`}
                      >
                        {processedData.totalActualExpenses.toFixed(2)} {displayCurrency}
                      </p>
                      <p className="text-xs text-red-600">
                        {processedData.expenseTransactions.length} transactions
                      </p>
                    </div>
                  )}

                  {(filterType === "transfer" || filterType === "all") && (
                    <div
                      className={`bg-blue-50 border border-blue-200 rounded-xl ${isMobileView ? "p-2" : "p-3"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowRightLeft
                          className="text-blue-600"
                          size={isMobileView ? 14 : 16}
                        />
                        <span
                          className={`text-blue-700 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                        >
                          {isMobileView ? "Movements" : "Account Movements"}
                        </span>
                      </div>
                      <p
                        className={`font-bold text-black ${isMobileView ? "text-base" : "text-lg"}`}
                      >
                        {processedData.totalActualTransfers.toFixed(2)} {displayCurrency}
                      </p>
                      <p className="text-xs text-blue-600">
                        {processedData.transferTransactions.length} transactions
                      </p>
                    </div>
                  )}

                  {includeUpcoming &&
                    (filterType === "income" || filterType === "all") && (
                      <div
                        className={`bg-green-50 border border-green-200 border-dashed rounded-xl ${isMobileView ? "p-2" : "p-3"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar
                            className="text-green-600"
                            size={isMobileView ? 14 : 16}
                          />
                          <span
                            className={`text-green-700 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                          >
                            {isMobileView ? "Future+" : "Upcoming Income"}
                          </span>
                        </div>
                        <p
                          className={`font-bold text-black ${isMobileView ? "text-base" : "text-lg"}`}
                        >
                          {processedData.totalUpcomingIncome.toFixed(2)} {displayCurrency}
                        </p>
                        <p className="text-xs text-green-600">
                          {processedData.upcomingIncome.length} payments
                        </p>
                      </div>
                    )}

                  {includeUpcoming &&
                    (filterType === "expense" || filterType === "all") && (
                      <div
                        className={`bg-red-50 border border-red-200 border-dashed rounded-xl ${isMobileView ? "p-2" : "p-3"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar
                            className="text-red-600"
                            size={isMobileView ? 14 : 16}
                          />
                          <span
                            className={`text-red-700 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                          >
                            {isMobileView ? "Future-" : "Upcoming Expenses"}
                          </span>
                        </div>
                        <p
                          className={`font-bold text-black ${isMobileView ? "text-base" : "text-lg"}`}
                        >
                          {Math.abs(processedData.totalUpcomingExpenses).toFixed(2)} {displayCurrency}
                        </p>
                        <p className="text-xs text-red-600">
                          {processedData.upcomingExpenses.length} payments
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div
              className={`flex-1 overflow-y-auto ${isMobileView ? "p-3" : "p-4"}`}
            >
              {showSingleColumn ? (
                // Single column for all transactions (with or without upcoming)
                <div
                  className={`space-y-${isMobileView ? "2" : "3"} ${isMobileView ? "max-h-80" : "max-h-96"} overflow-y-auto`}
                >
                  {processedData.allTransactionsWithUpcoming.map(
                    (transaction, index) => (
                      <TransactionItem
                        key={`all-${index}`}
                        transaction={transaction}
                      />
                    )
                  )}
                  {processedData.allTransactionsWithUpcoming.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign
                        className="mx-auto mb-2 opacity-50"
                        size={isMobileView ? 24 : 32}
                      />
                      <p className={isMobileView ? "text-sm" : ""}>
                        No transactions this month
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Original separate columns view for income/expense/transfer only filters
                <div>
                  {/* Income Section */}
                  {filterType === "income" && (
                    <div>
                      <div
                        className={`space-y-${isMobileView ? "2" : "3"} ${isMobileView ? "max-h-80" : "max-h-96"} overflow-y-auto`}
                      >
                        {processedData.incomeTransactions.map(
                          (transaction, index) => (
                            <TransactionItem
                              key={`income-${index}`}
                              transaction={transaction}
                            />
                          )
                        )}
                        {includeUpcoming &&
                          processedData.upcomingIncome.map((payment, index) => (
                            <UpcomingPaymentItem
                              key={`upcoming-income-${index}`}
                              payment={payment}
                            />
                          ))}
                        {processedData.incomeTransactions.length === 0 &&
                          (!includeUpcoming ||
                            processedData.upcomingIncome.length === 0) && (
                            <div className="text-center py-8 text-gray-500">
                              <TrendingUp
                                className="mx-auto mb-2 opacity-50"
                                size={isMobileView ? 24 : 32}
                              />
                              <p className={isMobileView ? "text-sm" : ""}>
                                No income transactions this month
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Expenses Section */}
                  {filterType === "expense" && (
                    <div
                      className={`space-y-${isMobileView ? "2" : "3"} ${isMobileView ? "max-h-80" : "max-h-96"} overflow-y-auto`}
                    >
                      {processedData.expenseTransactions.map(
                        (transaction, index) => (
                          <TransactionItem
                            key={`expense-${index}`}
                            transaction={transaction}
                          />
                        )
                      )}
                      {includeUpcoming &&
                        processedData.upcomingExpenses.map((payment, index) => (
                          <UpcomingPaymentItem
                            key={`upcoming-expense-${index}`}
                            payment={payment}
                          />
                        ))}
                      {processedData.expenseTransactions.length === 0 &&
                        (!includeUpcoming ||
                          processedData.upcomingExpenses.length === 0) && (
                          <div className="text-center py-8 text-gray-500">
                            <TrendingDown
                              className="mx-auto mb-2 opacity-50"
                              size={isMobileView ? 24 : 32}
                            />
                            <p className={isMobileView ? "text-sm" : ""}>
                              No expense transactions this month
                            </p>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Transfers Section */}
                  {filterType === "transfer" && (
                    <div
                      className={`space-y-${isMobileView ? "2" : "3"} ${isMobileView ? "max-h-80" : "max-h-96"} overflow-y-auto`}
                    >
                      {processedData.transferTransactions.map(
                        (transaction, index) => (
                          <TransactionItem
                            key={`transfer-${index}`}
                            transaction={transaction}
                          />
                        )
                      )}
                      {processedData.transferTransactions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <ArrowRightLeft
                            className="mx-auto mb-2 text-gray-400 opacity-50"
                            size={isMobileView ? 24 : 32}
                          />
                          <p
                            className={`${isMobileView ? "text-sm" : ""} text-gray-600`}
                          >
                            No movements between accounts this month
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionDetailsModal;
