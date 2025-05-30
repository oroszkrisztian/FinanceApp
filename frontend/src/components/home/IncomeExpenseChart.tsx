import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import { CurrencyType, AccountType } from "../../interfaces/enums";
import TransactionDetailsModal from "./TransactionDetailsModal";

interface IncomeExpenseChartProps {
  transactions: any[];
  futureOutgoingPayments: any[];
  futureIncomingPayments: any[];
  accounts: any[];
  displayCurrency: string;
  isSmallScreen?: boolean;
}

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  transactions,
  futureOutgoingPayments,
  futureIncomingPayments,
  accounts,
  displayCurrency: initialDisplayCurrency,
  isSmallScreen = false,
}) => {
  // Filter accounts to only show DEFAULT type accounts
  const defaultAccounts = useMemo(() => 
    accounts.filter(account => account.type === AccountType.DEFAULT),
    [accounts]
  );

  const [includeUpcoming, setIncludeUpcoming] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string>(
    initialDisplayCurrency || CurrencyType.RON
  );
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense" | "net">(
    "net"
  );

  // Generate fixed colors for account lines (avoiding used colors)
  const generateAccountColors = (numAccounts: number): string[] => {
    const usedColors = ['#10b981', '#ef4444', '#7c3aed']; // Green, Red, Purple
    const availableColors = [
      '#3b82f6', // Blue
      '#f59e0b', // Amber
      '#8b5cf6', // Violet
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#f97316', // Orange
      '#ec4899', // Pink
      '#6366f1', // Indigo
      '#14b8a6', // Teal
      '#a855f7', // Purple variant
      '#22c55e', // Green variant
      '#fb7185', // Rose
      '#fbbf24', // Yellow
      '#60a5fa', // Blue variant
    ];

    return availableColors.slice(0, numAccounts);
  };

  const accountColors = useMemo(() => {
    return generateAccountColors(defaultAccounts.length);
  }, [defaultAccounts.length]);

  const handleOpenModal = (type: "income" | "expense" | "net") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    const loadExchangeRates = async () => {
      setFetchingRates(true);
      try {
        const ratesData = await fetchExchangeRates();
        setRates(ratesData);
        setAvailableCurrencies(Object.keys(ratesData));
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
      } finally {
        setFetchingRates(false);
      }
    };
    loadExchangeRates();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    if (fromCurrency === toCurrency || Object.keys(rates).length === 0) {
      return amount;
    }
    try {
      const validation = validateCurrencyConversion(
        fromCurrency as CurrencyType,
        toCurrency as CurrencyType,
        rates
      );
      if (!validation.valid) {
        console.error(validation.error);
        return amount;
      }
      return convertAmount(amount, fromCurrency, toCurrency, rates);
    } catch (err) {
      console.error("Conversion error:", err);
      return amount;
    }
  };

  const convertToDisplayCurrency = (
    amount: number,
    currency: string
  ): number => {
    if (currency === displayCurrency || Object.keys(rates).length === 0) {
      return amount;
    }
    return convertCurrency(amount, currency, displayCurrency);
  };

  const handleCurrencyChange = (currency: string) => {
    setDisplayCurrency(currency);
    setIsCurrencyMenuOpen(false);
  };

  // Helper function to check if a payment should be included in the current month
  const shouldIncludePaymentInMonth = (
    paymentDate: Date,
    currentMonth: Date,
    startOfMonth: Date,
    endOfMonth: Date
  ): boolean => {
    // Check if date is valid
    if (isNaN(paymentDate.getTime())) return false;

    // Create date objects without time components for accurate comparison
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

    // Normal case: payment falls within the month
    if (
      paymentDateOnly >= startOfMonthOnly &&
      paymentDateOnly <= endOfMonthOnly
    ) {
      return true;
    }

    // FIXED: Special case for 31st day payments
    const paymentDay = paymentDate.getDate();
    const currentMonthNum = currentMonth.getMonth();
    const currentYear = currentMonth.getFullYear();

    // Case 1: Payment date is exactly 31st and current month has fewer days
    if (
      paymentDay === 31 &&
      paymentDate.getMonth() === currentMonthNum &&
      paymentDate.getFullYear() === currentYear &&
      endOfMonth.getDate() < 31
    ) {
      return true;
    }

    // Case 2: Payment was scheduled for 31st but moved to next available 31st
    // Check if this payment should have occurred in the current month
    if (paymentDay === 31 && endOfMonth.getDate() < 31) {
      // Check if the payment date is in a future month but should belong to current month
      if (
        paymentDate.getFullYear() === currentYear &&
        paymentDate.getMonth() > currentMonthNum
      ) {
        return true;
      }
    }

    return false;
  };

  // Helper function to get the effective day for a payment in the current month
  const getEffectiveDayForPayment = (
    paymentDate: Date,
    currentMonth: Date,
    endOfMonth: Date
  ): number | null => {
    const paymentDay = paymentDate.getDate();
    const currentMonthNum = currentMonth.getMonth();
    const currentYear = currentMonth.getFullYear();

    // Create date-only objects for accurate comparison
    const paymentDateOnly = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      paymentDate.getDate()
    );
    const currentMonthOnly = new Date(currentYear, currentMonthNum, 1);

    // If it's a regular day within the month, return the day
    if (
      paymentDate.getMonth() === currentMonthNum &&
      paymentDate.getFullYear() === currentYear &&
      paymentDay <= endOfMonth.getDate()
    ) {
      return paymentDay;
    }

    // If it's a 31st day payment in a month with fewer than 31 days,
    // map it to the last day of the current month
    if (paymentDay === 31 && endOfMonth.getDate() < 31) {
      // Check if this payment should belong to the current month
      if (
        (paymentDate.getMonth() === currentMonthNum &&
          paymentDate.getFullYear() === currentYear) ||
        (paymentDate.getMonth() > currentMonthNum &&
          paymentDate.getFullYear() === currentYear) ||
        (paymentDate.getMonth() < currentMonthNum &&
          paymentDate.getFullYear() > currentYear)
      ) {
        return endOfMonth.getDate(); // Return last day of current month
      }
    }

    return null;
  };

  const chartData = useMemo(() => {
    const currentMonth = new Date();
    const today = new Date();
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

    // FIXED: Improved filtering for monthly transactions
    const monthlyTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.createdAt || t.date);
      return shouldIncludePaymentInMonth(
        transactionDate,
        currentMonth,
        startOfMonth,
        endOfMonth
      );
    });

    // FIXED: Improved filtering for upcoming payments
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
      return shouldIncludePaymentInMonth(
        nextDate,
        currentMonth,
        startOfMonth,
        endOfMonth
      );
    });

    // Initialize account balances - only for DEFAULT accounts
    const accountBalances = defaultAccounts.reduce((acc, account) => {
      acc[account.id] = convertToDisplayCurrency(account.balance || 0, account.currency || displayCurrency);
      return acc;
    }, {} as Record<string, number>);

    const dataPoints = [];
    
    // MODIFIED: Determine range based on includeUpcoming toggle
    const todayDay = today.getDate();
    const lastDayToShow = includeUpcoming 
      ? endOfMonth.getDate() 
      : Math.min(todayDay, endOfMonth.getDate());

    // Generate data points based on the determined range
    for (let day = 1; day <= lastDayToShow; day++) {
      const currentDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const dayLabel = day.toString();
      const isToday = currentDate.toDateString() === today.toDateString();
      const isFuture = currentDate > today;

      // FIXED: Improved day transaction matching
      const dayTransactions = monthlyTransactions.filter((t) => {
        const transactionDate = new Date(t.createdAt || t.date);
        const effectiveDay = getEffectiveDayForPayment(
          transactionDate,
          currentMonth,
          endOfMonth
        );
        return effectiveDay === day;
      });

      const incomeTransactions = dayTransactions.filter(
        (t) => t.type === "INCOME"
      );
      const expenseTransactions = dayTransactions.filter(
        (t) => t.type === "EXPENSE"
      );

      const actualIncome = incomeTransactions.reduce((sum, t) => {
        const amount = t.amount ?? 0;
        const currency = t.currency || displayCurrency;
        return sum + convertToDisplayCurrency(amount, currency);
      }, 0);

      const actualExpenses = expenseTransactions.reduce((sum, t) => {
        const amount = t.amount ?? 0;
        const currency = t.currency || displayCurrency;
        return sum + convertToDisplayCurrency(amount, currency);
      }, 0);

      // FIXED: Improved day payment matching for upcoming payments
      const dayUpcomingIncomePayments = upcomingIncome.filter((p) => {
        const paymentDate = new Date(p.nextExecution);
        const effectiveDay = getEffectiveDayForPayment(
          paymentDate,
          currentMonth,
          endOfMonth
        );
        return effectiveDay === day;
      });

      const dayUpcomingExpensePayments = upcomingExpenses.filter((p) => {
        const paymentDate = new Date(p.nextExecution);
        const effectiveDay = getEffectiveDayForPayment(
          paymentDate,
          currentMonth,
          endOfMonth
        );
        return effectiveDay === day;
      });

      const dayUpcomingIncome = dayUpcomingIncomePayments.reduce((sum, p) => {
        const amount = p.amount ?? 0;
        const currency = p.currency || displayCurrency;
        return sum + convertToDisplayCurrency(amount, currency);
      }, 0);

      const dayUpcomingExpenses = dayUpcomingExpensePayments.reduce(
        (sum, p) => {
          const amount = p.amount ?? 0;
          const currency = p.currency || displayCurrency;
          return sum + convertToDisplayCurrency(amount, currency);
        },
        0
      );

      // Update account balances based on transactions and payments - only for DEFAULT accounts
      if (!isFuture) {
        // For past/current dates, apply actual transactions
        dayTransactions.forEach((transaction) => {
          const accountId = transaction.accountId;
          if (accountBalances[accountId] !== undefined) {
            const amount = convertToDisplayCurrency(
              transaction.amount || 0,
              transaction.currency || displayCurrency
            );
            if (transaction.type === "INCOME") {
              accountBalances[accountId] += amount;
            } else if (transaction.type === "EXPENSE") {
              accountBalances[accountId] -= amount;
            }
          }
        });
      } else {
        // For future dates, apply upcoming payments
        [...dayUpcomingIncomePayments, ...dayUpcomingExpensePayments].forEach((payment) => {
          const accountId = payment.accountId;
          if (accountBalances[accountId] !== undefined) {
            const amount = convertToDisplayCurrency(
              payment.amount || 0,
              payment.currency || displayCurrency
            );
            if (payment.type === "INCOME") {
              accountBalances[accountId] += amount;
            } else if (payment.type === "EXPENSE") {
              accountBalances[accountId] -= amount;
            }
          }
        });
      }

      const dataPoint: any = {
        day: dayLabel,
        date: currentDate.toISOString().split("T")[0],
        isToday,
        isFuture,
        // Store raw values for summary calculation
        actualIncome: actualIncome,
        actualExpenses: actualExpenses,
        upcomingIncome: dayUpcomingIncome,
        upcomingExpenses: dayUpcomingExpenses,
        incomeTransactions,
        expenseTransactions,
        upcomingIncomePayments: dayUpcomingIncomePayments,
        upcomingExpensePayments: dayUpcomingExpensePayments,
      };

      // MODIFIED: Display logic for the unified chart
      if (!isFuture) {
        // For past/current dates, show actual data
        dataPoint.income = actualIncome || 0;
        dataPoint.expenses = actualExpenses || 0;
      } else {
        // For future dates, show upcoming data (only when includeUpcoming is true)
        dataPoint.income = dayUpcomingIncome || 0;
        dataPoint.expenses = dayUpcomingExpenses || 0;
      }

      // Add account balances to data point - only for DEFAULT accounts
      defaultAccounts.forEach((account, index) => {
        dataPoint[`account_${account.id}`] = accountBalances[account.id] || 0;
      });

      dataPoints.push(dataPoint);
    }

    // Debug logging to help identify issues
    console.log("=== PAYMENT DEBUG INFO ===");
    console.log("Current date:", new Date());
    console.log("Current month:", currentMonth);
    console.log("Start of month:", startOfMonth);
    console.log("End of month:", endOfMonth);
    console.log("Today day:", todayDay);
    console.log("Last day to show:", lastDayToShow);
    console.log("Include upcoming:", includeUpcoming);
    console.log("Monthly transactions count:", monthlyTransactions.length);
    console.log("Upcoming income count:", upcomingIncome.length);
    console.log("Upcoming expenses count:", upcomingExpenses.length);
    console.log("Data points generated:", dataPoints.length);
    console.log("Total accounts:", accounts.length);
    console.log("DEFAULT accounts:", defaultAccounts.length);

    return { dataPoints, todayDay };
  }, [
    transactions,
    futureIncomingPayments,
    futureOutgoingPayments,
    defaultAccounts,
    includeUpcoming,
    displayCurrency,
    rates,
  ]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      const dayNum = parseInt(data.day);
      const currentMonth = new Date();
      const correctDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        dayNum
      );

      const formattedDate = correctDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });

      return (
        <div
          className={`bg-white border border-gray-200 rounded-xl shadow-xl max-w-xs ${
            isMobileView ? "p-3" : "p-4"
          }`}
        >
          <p
            className={`font-medium text-gray-900 mb-2 ${isMobileView ? "text-sm" : ""}`}
          >
            {formattedDate}
          </p>

          {/* Account Balances - only DEFAULT accounts */}
          {defaultAccounts.length > 0 && (
            <div className="mb-2">
              <p
                className={`font-medium text-blue-600 mb-1 ${isMobileView ? "text-xs" : "text-sm"}`}
              >
                💰 Account Balances
              </p>
              <div
                className={`space-y-1 ${isMobileView ? "max-h-16" : "max-h-20"} overflow-y-auto`}
              >
                {defaultAccounts.slice(0, isMobileView ? 2 : 3).map((account, index) => {
                  const balance = data[`account_${account.id}`] || 0;
                  return (
                    <div
                      key={account.id}
                      className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded"
                    >
                      <div className="font-medium truncate">
                        {account.name || `Account ${index + 1}`}
                      </div>
                      <div>
                        {balance.toFixed(2)} {displayCurrency}
                      </div>
                    </div>
                  );
                })}
                {defaultAccounts.length > (isMobileView ? 2 : 3) && (
                  <div className="text-xs text-blue-600 text-center">
                    +{defaultAccounts.length - (isMobileView ? 2 : 3)} more accounts
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actual Income */}
          {data.incomeTransactions && data.incomeTransactions.length > 0 && (
            <div className="mb-2">
              <p
                className={`font-medium text-green-600 mb-1 ${isMobileView ? "text-xs" : "text-sm"}`}
              >
                💰 Income ({data.incomeTransactions.length})
              </p>
              <div
                className={`space-y-1 ${isMobileView ? "max-h-16" : "max-h-20"} overflow-y-auto`}
              >
                {data.incomeTransactions
                  .slice(0, isMobileView ? 2 : 3)
                  .map((transaction: any, index: number) => {
                    const originalAmount = transaction.amount || 0;
                    const originalCurrency =
                      transaction.currency || displayCurrency;
                    const convertedAmount = convertToDisplayCurrency(
                      originalAmount,
                      originalCurrency
                    );
                    const needsConversion =
                      originalCurrency !== displayCurrency;

                    return (
                      <div
                        key={index}
                        className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded"
                      >
                        <div className="font-medium truncate">
                          {transaction.description ||
                            transaction.name ||
                            "Income"}
                        </div>
                        <div>
                          +{originalAmount.toFixed(2)} {originalCurrency}
                          {needsConversion && (
                            <span className="text-green-600 ml-1">
                              ({convertedAmount.toFixed(2)} {displayCurrency})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {data.incomeTransactions.length > (isMobileView ? 2 : 3) && (
                  <div className="text-xs text-green-600 text-center">
                    +{data.incomeTransactions.length - (isMobileView ? 2 : 3)}{" "}
                    more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actual Expenses */}
          {data.expenseTransactions && data.expenseTransactions.length > 0 && (
            <div className="mb-2">
              <p
                className={`font-medium text-red-600 mb-1 ${isMobileView ? "text-xs" : "text-sm"}`}
              >
                💸 Expenses ({data.expenseTransactions.length})
              </p>
              <div
                className={`space-y-1 ${isMobileView ? "max-h-16" : "max-h-20"} overflow-y-auto`}
              >
                {data.expenseTransactions
                  .slice(0, isMobileView ? 2 : 3)
                  .map((transaction: any, index: number) => {
                    const originalAmount = transaction.amount || 0;
                    const originalCurrency =
                      transaction.currency || displayCurrency;
                    const convertedAmount = convertToDisplayCurrency(
                      originalAmount,
                      originalCurrency
                    );
                    const needsConversion =
                      originalCurrency !== displayCurrency;

                    return (
                      <div
                        key={index}
                        className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded"
                      >
                        <div className="font-medium truncate">
                          {transaction.description ||
                            transaction.name ||
                            "Expense"}
                        </div>
                        <div>
                          -{originalAmount.toFixed(2)} {originalCurrency}
                          {needsConversion && (
                            <span className="text-red-600 ml-1">
                              ({convertedAmount.toFixed(2)} {displayCurrency})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {data.expenseTransactions.length > (isMobileView ? 2 : 3) && (
                  <div className="text-xs text-red-600 text-center">
                    +{data.expenseTransactions.length - (isMobileView ? 2 : 3)}{" "}
                    more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Income Payments */}
          {data.upcomingIncomePayments &&
            data.upcomingIncomePayments.length > 0 && (
              <div className="mb-2">
                <p
                  className={`font-medium text-green-600 mb-1 ${isMobileView ? "text-xs" : "text-sm"}`}
                >
                  📅 Upcoming Income ({data.upcomingIncomePayments.length})
                </p>
                <div
                  className={`space-y-1 ${isMobileView ? "max-h-16" : "max-h-20"} overflow-y-auto`}
                >
                  {data.upcomingIncomePayments
                    .slice(0, isMobileView ? 2 : 3)
                    .map((payment: any, index: number) => {
                      const originalAmount = payment.amount || 0;
                      const originalCurrency =
                        payment.currency || displayCurrency;
                      const convertedAmount = convertToDisplayCurrency(
                        originalAmount,
                        originalCurrency
                      );
                      const needsConversion =
                        originalCurrency !== displayCurrency;

                      return (
                        <div
                          key={index}
                          className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded border-l-2 border-green-400"
                        >
                          <div className="font-medium truncate">
                            {payment.description ||
                              payment.name ||
                              "Upcoming Income"}
                          </div>
                          <div>
                            +{originalAmount.toFixed(2)} {originalCurrency}
                            {needsConversion && (
                              <span className="text-green-600 ml-1">
                                ({convertedAmount.toFixed(2)} {displayCurrency})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {data.upcomingIncomePayments.length >
                    (isMobileView ? 2 : 3) && (
                    <div className="text-xs text-green-600 text-center">
                      +
                      {data.upcomingIncomePayments.length -
                        (isMobileView ? 2 : 3)}{" "}
                      more
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Upcoming Expense Payments */}
          {data.upcomingExpensePayments &&
            data.upcomingExpensePayments.length > 0 && (
              <div className="mb-2">
                <p
                  className={`font-medium text-red-600 mb-1 ${isMobileView ? "text-xs" : "text-sm"}`}
                >
                  📅 Upcoming Expenses ({data.upcomingExpensePayments.length})
                </p>
                <div
                  className={`space-y-1 ${isMobileView ? "max-h-16" : "max-h-20"} overflow-y-auto`}
                >
                  {data.upcomingExpensePayments
                    .slice(0, isMobileView ? 2 : 3)
                    .map((payment: any, index: number) => {
                      const originalAmount = payment.amount || 0;
                      const originalCurrency =
                        payment.currency || displayCurrency;
                      const convertedAmount = convertToDisplayCurrency(
                        originalAmount,
                        originalCurrency
                      );
                      const needsConversion =
                        originalCurrency !== displayCurrency;

                      return (
                        <div
                          key={index}
                          className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded border-l-2 border-red-400"
                        >
                          <div className="font-medium truncate">
                            {payment.description ||
                              payment.name ||
                              "Upcoming Expense"}
                          </div>
                          <div>
                            -{originalAmount.toFixed(2)} {originalCurrency}
                            {needsConversion && (
                              <span className="text-red-600 ml-1">
                                ({convertedAmount.toFixed(2)} {displayCurrency})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {data.upcomingExpensePayments.length >
                    (isMobileView ? 2 : 3) && (
                    <div className="text-xs text-red-600 text-center">
                      +
                      {data.upcomingExpensePayments.length -
                        (isMobileView ? 2 : 3)}{" "}
                      more
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Daily Total Summary */}
          {(() => {
            // Calculate daily totals
            const dailyIncome =
              (data.actualIncome || 0) + (data.upcomingIncome || 0);
            const dailyExpenses =
              (data.actualExpenses || 0) + (data.upcomingExpenses || 0);
            const dailyNet = dailyIncome - dailyExpenses;

            // Only show if there's any activity
            if (dailyIncome > 0 || dailyExpenses > 0) {
              return (
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Daily Total:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        dailyNet >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {dailyNet >= 0 ? "+" : ""}
                      {dailyNet.toFixed(2)} {displayCurrency}
                    </span>
                  </div>

                  {/* Breakdown if both income and expenses exist */}
                  {dailyIncome > 0 && dailyExpenses > 0 && (
                    <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Income:</span>
                        <span className="text-green-600">
                          +{dailyIncome.toFixed(2)} {displayCurrency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expenses:</span>
                        <span className="text-red-600">
                          -{dailyExpenses.toFixed(2)} {displayCurrency}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </div>
      );
    }
    return null;
  };

  // FIXED: Summary stats calculation now correctly includes all payments
  const summaryStats = useMemo(() => {
    let totalActualIncome = 0;
    let totalActualExpenses = 0;
    let totalUpcomingIncome = 0;
    let totalUpcomingExpenses = 0;

    chartData.dataPoints.forEach((d, dayIndex) => {
      // Sum actual income and expenses (only positive values)
      if (d.actualIncome && d.actualIncome > 0) {
        totalActualIncome += d.actualIncome;
      }
      if (d.actualExpenses && d.actualExpenses > 0) {
        totalActualExpenses += d.actualExpenses;
      }
      if (d.upcomingIncome && d.upcomingIncome > 0) {
        console.log(
          `Day ${d.day} has upcoming income:`,
          d.upcomingIncome,
          "Payments:",
          d.upcomingIncomePayments
        );
        totalUpcomingIncome += d.upcomingIncome;
      }
      if (d.upcomingExpenses && d.upcomingExpenses > 0) {
        console.log(
          `Day ${d.day} has upcoming expenses:`,
          d.upcomingExpenses,
          "Payments:",
          d.upcomingExpensePayments
        );
        totalUpcomingExpenses += d.upcomingExpenses;
      }
    });

    const actualNet = totalActualIncome - totalActualExpenses;
    const projectedNet =
      totalActualIncome +
      totalUpcomingIncome -
      (totalActualExpenses + totalUpcomingExpenses);

    // Debug logging for summary stats
    console.log("=== SUMMARY STATS DEBUG ===");
    console.log("Summary stats:", {
      actualIncome: totalActualIncome,
      actualExpenses: totalActualExpenses,
      upcomingIncome: totalUpcomingIncome,
      upcomingExpenses: totalUpcomingExpenses,
      actualNet,
      projectedNet,
    });

    return {
      actualIncome: totalActualIncome,
      actualExpenses: totalActualExpenses,
      upcomingIncome: totalUpcomingIncome,
      upcomingExpenses: totalUpcomingExpenses,
      actualNet,
      projectedNet,
    };
  }, [chartData]);

  const currentMonthName = new Date().toLocaleString("default", {
    month: isMobileView ? "short" : "long",
    year: "numeric",
  });

  // Custom dot component that can access individual data point properties
  const AccountBalanceDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || payload.isFuture === undefined) return null;
    
    // You can customize the dot appearance based on isFuture property
    const dotStyle = payload.isFuture 
      ? { fill: props.stroke, fillOpacity: 0.5, strokeDasharray: "2,2" }
      : { fill: props.stroke };
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isMobileView ? 1.5 : 2}
        {...dotStyle}
      />
    );
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden ${
        isMobileView ? "p-3 mb-4 mx-2" : isSmallScreen ? "p-4 mb-4" : "p-6 mb-8"
      }`}
    >
      {/* Background decorative elements - smaller on mobile */}
      <div
        className={`absolute top-0 right-0 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-20 ${
          isMobileView
            ? "w-12 h-12 -translate-y-6 translate-x-6"
            : isSmallScreen
              ? "w-16 h-16 -translate-y-8 translate-x-8"
              : "w-24 h-24 -translate-y-12 translate-x-12"
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 bg-gradient-to-tr from-green-200 to-emerald-200 rounded-full opacity-15 ${
          isMobileView
            ? "w-8 h-8 translate-y-4 -translate-x-4"
            : isSmallScreen
              ? "w-12 h-12 translate-y-6 -translate-x-6"
              : "w-16 h-16 translate-y-8 -translate-x-8"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-10 ${
          isMobileView
            ? "top-3 left-6 w-6 h-6"
            : isSmallScreen
              ? "top-4 left-8 w-8 h-8"
              : "top-6 left-12 w-12 h-12"
        }`}
      ></div>

      <div className="relative z-10">
        {/* Header Section - Mobile Optimized */}
        <div
          className={`flex ${isMobileView ? "flex-col space-y-3" : "justify-between items-center"} ${
            isMobileView ? "mb-3" : isSmallScreen ? "mb-4" : "mb-6"
          }`}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ${
                isMobileView
                  ? "w-8 h-8"
                  : isSmallScreen
                    ? "w-10 h-10"
                    : "w-12 h-12"
              }`}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <TrendingUp
                className={`text-white ${isMobileView ? "w-4 h-4" : isSmallScreen ? "w-5 h-5" : "w-6 h-6"}`}
              />
            </motion.div>
            <div>
              <h3
                className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                  isMobileView
                    ? "text-sm"
                    : isSmallScreen
                      ? "text-base"
                      : "text-lg"
                }`}
              >
                {isMobileView
                  ? "Income vs Expenses"
                  : "Income vs Expenses Trend"}
              </h3>
              <p
                className={`text-gray-500 font-medium ${
                  isMobileView
                    ? "text-xs"
                    : isSmallScreen
                      ? "text-xs"
                      : "text-sm"
                }`}
              >
                {currentMonthName}
              </p>
            </div>
          </div>

          {/* Controls - Mobile Optimized */}
          <div
            className={`flex ${isMobileView ? "justify-between w-full" : "items-center space-x-3"}`}
          >
            {/* Currency Selector */}
            <div className="relative" ref={currencyRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors flex items-center shadow-md ${
                  isMobileView
                    ? "px-3 py-1.5 text-xs"
                    : isSmallScreen
                      ? "px-3 py-1.5 text-xs"
                      : "px-4 py-2 text-sm"
                }`}
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                disabled={fetchingRates}
              >
                {fetchingRates ? (
                  <RefreshCw
                    size={isMobileView ? 10 : 12}
                    className="animate-spin mr-1"
                  />
                ) : (
                  <DollarSign size={isMobileView ? 10 : 12} className="mr-1" />
                )}
                <span>{displayCurrency}</span>
                <ChevronDown size={isMobileView ? 10 : 12} className="ml-1" />
              </motion.button>

              <AnimatePresence>
                {isCurrencyMenuOpen && availableCurrencies.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute ${isMobileView ? "top-full left-0" : "top-full right-0"} mt-2 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 ${
                      isMobileView ? "w-24" : "w-32"
                    }`}
                  >
                    <div className="max-h-32 overflow-y-auto">
                      {availableCurrencies.map((currency) => (
                        <button
                          key={currency}
                          className={`w-full text-left px-3 py-2 transition-colors text-sm ${
                            currency === displayCurrency
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "text-gray-700 hover:bg-blue-50"
                          }`}
                          onClick={() => handleCurrencyChange(currency)}
                        >
                          {currency}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center space-x-2">
              {!isMobileView && (
                <span className="text-xs font-medium text-gray-600">
                  Show upcoming
                </span>
              )}
              <motion.button
                onClick={() => setIncludeUpcoming(!includeUpcoming)}
                className={`relative inline-flex items-center rounded-full transition-all duration-200 ${
                  isMobileView
                    ? "h-4 w-7"
                    : isSmallScreen
                      ? "h-5 w-9"
                      : "h-6 w-10"
                } ${
                  includeUpcoming
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg"
                    : "bg-gray-300"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className={`inline-block rounded-full bg-white shadow-lg ${
                    isMobileView
                      ? "h-2.5 w-2.5"
                      : isSmallScreen
                        ? "h-3 w-3"
                        : "h-4 w-4"
                  }`}
                  animate={{
                    x: includeUpcoming
                      ? isMobileView
                        ? 16 // translate-x-4 = 16px
                        : isSmallScreen
                          ? 20 // translate-x-5 = 20px
                          : 20 // translate-x-5 = 20px
                      : 2, // translate-x-0.5 = 2px
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Info Banner */}
        {isMobileView && (
          <div className="mb-3 bg-purple-50 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs">📅</span>
                <span className="text-xs font-medium text-purple-800">
                  {includeUpcoming
                    ? "Showing with upcoming payments"
                    : "Showing actuals only"}
                </span>
              </div>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  includeUpcoming
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {includeUpcoming ? "PROJECTED" : "ACTUAL"}
              </span>
            </div>
          </div>
        )}

        {/* Chart Section - Mobile Optimized */}
        <div
          className={`relative ${isMobileView ? "h-48" : isSmallScreen ? "h-60" : "h-80"} mb-4`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData.dataPoints}
              margin={{
                top: 10,
                right: isMobileView ? 10 : 20,
                left: isMobileView ? 10 : 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                stroke="#6b7280"
                fontSize={isMobileView ? 8 : 10}
                interval={isMobileView ? 2 : "preserveStartEnd"}
                tick={{ fontSize: isMobileView ? 8 : 10 }}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={isMobileView ? 8 : 10}
                tickFormatter={(value) =>
                  isMobileView ? `${Math.round(value)}` : `${value.toFixed(0)}`
                }
                tick={{ fontSize: isMobileView ? 8 : 10 }}
                width={isMobileView ? 35 : 45}
              />
              <Tooltip content={<CustomTooltip />} />
              {!isMobileView && (
                <Legend
                  wrapperStyle={{ fontSize: isSmallScreen ? "10px" : "12px" }}
                />
              )}

              {/* Vertical separator line at current day when upcoming payments are shown */}
              {includeUpcoming &&
                chartData.todayDay <= chartData.dataPoints.length && (
                  <ReferenceLine
                    x={chartData.todayDay.toString()}
                    stroke="#7c3aed"
                    strokeDasharray="4 4"
                    strokeWidth={isMobileView ? 1.5 : 2}
                  />
                )}

              {/* Background area for upcoming section */}
              {includeUpcoming &&
                chartData.todayDay < chartData.dataPoints.length && (
                  <ReferenceArea
                    x1={(chartData.todayDay + 0.5).toString()}
                    x2={
                      chartData.dataPoints[chartData.dataPoints.length - 1]?.day
                    }
                    fill="#e0e7ff"
                    fillOpacity={0.2}
                  />
                )}

              {/* Main income line */}
              <Line
                dataKey="income"
                stroke="#10b981"
                strokeWidth={isMobileView ? 1.5 : 2}
                name="Income"
                dot={(props: any) => {
                  if (props.payload?.income > 0) {
                    return (
                      <circle
                        key={`income-dot-${props.payload?.day}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={isMobileView ? 2 : 3}
                        fill="#10b981"
                        strokeWidth={1}
                        stroke="#10b981"
                      />
                    );
                  }
                  return <g key={`income-empty-${props.payload?.day}`} />;
                }}
                activeDot={{ r: isMobileView ? 4 : 6, fill: "#10b981" }}
                connectNulls={true}
              />

              {/* Main expense line */}
              <Line
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={isMobileView ? 1.5 : 2}
                name="Expenses"
                dot={(props: any) => {
                  if (props.payload?.expenses > 0) {
                    return (
                      <circle
                        key={`expense-dot-${props.payload?.day}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={isMobileView ? 2 : 3}
                        fill="#ef4444"
                        strokeWidth={1}
                        stroke="#ef4444"
                      />
                    );
                  }
                  return <g key={`expense-empty-${props.payload?.day}`} />;
                }}
                activeDot={{ r: isMobileView ? 4 : 6, fill: "#ef4444" }}
                connectNulls={true}
              />

              {/* Account balance lines - only for DEFAULT accounts */}
              {defaultAccounts.map((account, index) => (
                <Line
                  key={`account_${account.id}`}
                  dataKey={`account_${account.id}`}
                  stroke={accountColors[index] || '#6b7280'}
                  strokeWidth={isMobileView ? 1 : 1.5}
                  name={account.name || `Account ${index + 1}`}
                  dot={<AccountBalanceDot stroke={accountColors[index] || '#6b7280'} />}
                  activeDot={{ r: isMobileView ? 3 : 4, fill: accountColors[index] || '#6b7280' }}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Cards - Mobile Optimized */}
        <div
          className={`grid gap-2 ${
            isMobileView
              ? "grid-cols-1"
              : isSmallScreen
                ? "grid-cols-2"
                : "grid-cols-3"
          }`}
        >
          <motion.div
            className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 cursor-pointer ${
              isMobileView ? "p-2.5" : isSmallScreen ? "p-3" : "p-4"
            }`}
            whileHover={{
              y: -2,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.2 }}
            onClick={() => handleOpenModal("income")}
          >
            <div
              className={`flex items-center justify-center flex-col space-y-1 ${isMobileView ? "" : "mb-2"}`}
            >
              <div
                className={`flex items-center ${isMobileView ? "space-x-2" : "space-x-2"}`}
              >
                <div className="bg-white rounded-lg p-1 shadow-sm">
                  <TrendingUp
                    className={`text-green-600 ${isMobileView ? "w-3 h-3" : "w-4 h-4"}`}
                  />
                </div>
                <p
                  className={`text-green-700 font-medium ${
                    isMobileView
                      ? "text-xs"
                      : isSmallScreen
                        ? "text-xs"
                        : "text-sm"
                  }`}
                >
                  {isMobileView
                    ? "Income"
                    : includeUpcoming
                      ? "Projected Income"
                      : "Actual Income"}
                </p>
              </div>
              <p
                className={`font-bold text-green-800 text-center ${
                  isMobileView
                    ? "text-sm"
                    : isSmallScreen
                      ? "text-lg"
                      : "text-xl"
                }`}
              >
                +
                {(includeUpcoming
                  ? summaryStats.actualIncome + summaryStats.upcomingIncome
                  : summaryStats.actualIncome
                ).toFixed(isMobileView ? 0 : 2)}{" "}
                {displayCurrency}
              </p>
            </div>
          </motion.div>

          <motion.div
            className={`bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 cursor-pointer ${
              isMobileView ? "p-2.5" : isSmallScreen ? "p-3" : "p-4"
            }`}
            whileHover={{
              y: -2,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.2 }}
            onClick={() => handleOpenModal("expense")}
          >
            <div
              className={`flex items-center justify-center flex-col space-y-1 ${isMobileView ? "" : "mb-2"}`}
            >
              <div
                className={`flex items-center ${isMobileView ? "space-x-2" : "space-x-2"}`}
              >
                <div className="bg-white rounded-lg p-1 shadow-sm">
                  <TrendingDown
                    className={`text-red-600 ${isMobileView ? "w-3 h-3" : "w-4 h-4"}`}
                  />
                </div>
                <p
                  className={`text-red-700 font-medium ${
                    isMobileView
                      ? "text-xs"
                      : isSmallScreen
                        ? "text-xs"
                        : "text-sm"
                  }`}
                >
                  {isMobileView
                    ? "Expenses"
                    : includeUpcoming
                      ? "Projected Expenses"
                      : "Actual Expenses"}
                </p>
              </div>
              <p
                className={`font-bold text-red-800 text-center ${
                  isMobileView
                    ? "text-sm"
                    : isSmallScreen
                      ? "text-lg"
                      : "text-xl"
                }`}
              >
                -
                {(includeUpcoming
                  ? summaryStats.actualExpenses + summaryStats.upcomingExpenses
                  : summaryStats.actualExpenses
                ).toFixed(isMobileView ? 0 : 2)}{" "}
                {displayCurrency}
              </p>
            </div>
          </motion.div>

          <motion.div
            className={`rounded-xl border cursor-pointer ${
              summaryStats.actualNet >= 0
                ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
                : "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200"
            } ${
              isMobileView
                ? "p-2.5 col-span-1"
                : isSmallScreen
                  ? "p-3 col-span-2"
                  : "p-4"
            }`}
            whileHover={{
              y: -2,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.2 }}
            onClick={() => handleOpenModal("net")}
          >
            <div
              className={`flex items-center justify-center flex-col space-y-1 ${isMobileView ? "" : "mb-2"}`}
            >
              <div
                className={`flex items-center ${isMobileView ? "space-x-2" : "space-x-2"}`}
              >
                <div className="bg-white rounded-lg p-1 shadow-sm">
                  {(includeUpcoming
                    ? summaryStats.projectedNet
                    : summaryStats.actualNet) >= 0 ? (
                    <TrendingUp
                      className={`text-blue-600 ${isMobileView ? "w-3 h-3" : "w-4 h-4"}`}
                    />
                  ) : (
                    <TrendingDown
                      className={`text-orange-600 ${isMobileView ? "w-3 h-3" : "w-4 h-4"}`}
                    />
                  )}
                </div>
                <p
                  className={`font-medium ${
                    (includeUpcoming
                      ? summaryStats.projectedNet
                      : summaryStats.actualNet) >= 0
                      ? "text-blue-700"
                      : "text-orange-700"
                  } ${isMobileView ? "text-xs" : isSmallScreen ? "text-xs" : "text-sm"}`}
                >
                  {isMobileView
                    ? "Net"
                    : includeUpcoming
                      ? "Projected Net"
                      : "Actual Net"}
                </p>
              </div>
              <p
                className={`font-bold text-center ${
                  (includeUpcoming
                    ? summaryStats.projectedNet
                    : summaryStats.actualNet) >= 0
                    ? "text-blue-800"
                    : "text-orange-800"
                } ${isMobileView ? "text-sm" : isSmallScreen ? "text-lg" : "text-xl"}`}
              >
                {(includeUpcoming
                  ? summaryStats.projectedNet
                  : summaryStats.actualNet) >= 0
                  ? "+"
                  : ""}
                {(includeUpcoming
                  ? summaryStats.projectedNet
                  : summaryStats.actualNet
                ).toFixed(isMobileView ? 0 : 2)}{" "}
                {displayCurrency}
              </p>
            </div>
          </motion.div>

          {/* Mobile-specific additional info cards */}
          {isMobileView &&
            includeUpcoming &&
            (summaryStats.upcomingIncome > 0 ||
              summaryStats.upcomingExpenses > 0) && (
              <>
                {summaryStats.upcomingIncome > 0 && (
                  <motion.div
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 border-dashed p-2.5"
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-white rounded-lg p-1 shadow-sm">
                          <span className="text-green-600 text-xs">📅</span>
                        </div>
                        <p className="text-green-700 font-medium text-xs">
                          Upcoming Income
                        </p>
                      </div>
                      <p className="font-bold text-green-800 text-sm">
                        +{summaryStats.upcomingIncome.toFixed(0)}{" "}
                        {displayCurrency}
                      </p>
                    </div>
                  </motion.div>
                )}

                {summaryStats.upcomingExpenses > 0 && (
                  <motion.div
                    className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 border-dashed p-2.5"
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-white rounded-lg p-1 shadow-sm">
                          <span className="text-red-600 text-xs">📅</span>
                        </div>
                        <p className="text-red-700 font-medium text-xs">
                          Upcoming Expenses
                        </p>
                      </div>
                      <p className="font-bold text-red-800 text-sm">
                        -{summaryStats.upcomingExpenses.toFixed(0)}{" "}
                        {displayCurrency}
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            )}
        </div>

        {/* Mobile Legend */}
        {isMobileView && (
          <div className="mt-3 bg-gray-50 rounded-lg p-2">
            <div className="flex justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-green-500 rounded"></div>
                <span className="text-gray-600">Income</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-red-500 rounded"></div>
                <span className="text-gray-600">Expenses</span>
              </div>
              {defaultAccounts.slice(0, 2).map((account, index) => (
                <div key={account.id} className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-0.5 rounded" 
                    style={{ backgroundColor: accountColors[index] || '#6b7280' }}
                  ></div>
                  <span className="text-gray-600 truncate max-w-16">
                    {account.name || `Acc ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Quick Stats */}
        {isMobileView && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-600">Days with Income</p>
              <p className="font-bold text-gray-800">
                {
                  chartData.dataPoints.filter(
                    (d) => d.actualIncome && d.actualIncome > 0
                  ).length
                }
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-600">Days with Expenses</p>
              <p className="font-bold text-gray-800">
                {
                  chartData.dataPoints.filter(
                    (d) => d.actualExpenses && d.actualExpenses > 0
                  ).length
                }
              </p>
            </div>
          </div>
        )}
      </div>
      <TransactionDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transactions={transactions}
        futureIncomingPayments={futureIncomingPayments}
        futureOutgoingPayments={futureOutgoingPayments}
        displayCurrency={displayCurrency}
        includeUpcoming={includeUpcoming}
        monthName={currentMonthName}
        convertToDisplayCurrency={convertToDisplayCurrency}
        filterType={modalType === "net" ? "all" : modalType}
      />
    </div>
  );
};

export default IncomeExpenseChart;