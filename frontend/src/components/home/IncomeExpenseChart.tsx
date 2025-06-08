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
  Calendar,
  ArrowRightLeft,
} from "lucide-react";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import { CurrencyType, AccountType } from "../../interfaces/enums";
import { fetchAllAccounts } from "../../services/accountService";
import { useAuth } from "../../context/AuthContext";
import TransactionDetailsModal from "./TransactionDetailsModal";

interface BalanceHistoryEntry {
  id: number;
  createdAt: string;
  newBalance: number;
  amountChanged: number;
  changeType: string;
  currency?: string;
  previousBalance?: number;
}

interface ExtendedBalanceHistoryEntry extends BalanceHistoryEntry {
  dayOfRange: number;
  entryDate: Date;
  index: number;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ChartDataPoint {
  day: string;
  date: string;
  fullDate: Date;
  isToday: boolean;
  isFuture: boolean;
  actualIncome: number;
  actualExpenses: number;
  actualTransfers: number;
  upcomingIncome: number;
  upcomingExpenses: number;
  upcomingTransfers: number;
  incomeTransactions: any[];
  expenseTransactions: any[];
  transferTransactions: any[];
  upcomingIncomePayments: any[];
  upcomingExpensePayments: any[];
  upcomingTransferPayments: any[];
  dayIndex: number;
  income?: number | null;
  expenses?: number | null;
  transfers?: number | null;
  incomeFuture?: number | null;
  expensesFuture?: number | null;
  transfersFuture?: number | null;
  [key: string]: any;
}

interface IncomeExpenseChartProps {
  transactions: any[];
  futureOutgoingPayments: any[];
  futureIncomingPayments: any[];
  displayCurrency: string;
  isSmallScreen?: boolean;
  onAccountsUpdate?: (accounts: any[]) => void;
}

type DateRangeOption =
  | "current_month"
  | "last_3_months"
  | "last_6_months"
  | "last_year";

const AccountsTrendChart: React.FC<IncomeExpenseChartProps> = ({
  transactions,
  futureOutgoingPayments,
  futureIncomingPayments,
  displayCurrency: initialDisplayCurrency,
  isSmallScreen = false,
  onAccountsUpdate,
}) => {
  const { user } = useAuth();

  const [selectedRange, setSelectedRange] =
    useState<DateRangeOption>("current_month");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  const defaultAccounts = useMemo(
    () => accounts.filter((account) => account.type === AccountType.DEFAULT),
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
  const [modalType, setModalType] = useState<
    "income" | "expense" | "transfer" | "net"
  >("net");

  const dateRangeOptions = [
    { key: "current_month", label: "Current Month" },
    { key: "last_3_months", label: "Last 3 Months" },
    { key: "last_6_months", label: "Last 6 Months" },
    { key: "last_year", label: "Last Year" },
  ];

  const getDateRange = (option: DateRangeOption): DateRange => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (option) {
      case "current_month":
        return {
          startDate: new Date(currentYear, currentMonth, 1, 0, 0, 0, 0),
          endDate: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
        };
      case "last_3_months":
        return {
          startDate: new Date(currentYear, currentMonth - 2, 1, 0, 0, 0, 0),
          endDate: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
        };
      case "last_6_months":
        return {
          startDate: new Date(currentYear, currentMonth - 5, 1, 0, 0, 0, 0),
          endDate: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
        };
      case "last_year":
        return {
          startDate: new Date(currentYear - 1, currentMonth, 1, 0, 0, 0, 0),
          endDate: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
        };
      default:
        return {
          startDate: new Date(currentYear, currentMonth, 1, 0, 0, 0, 0),
          endDate: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
        };
    }
  };

  const currentDateRange = useMemo(
    () => getDateRange(selectedRange),
    [selectedRange]
  );

  const handleDateRangeChange = (option: DateRangeOption) => {
    setSelectedRange(option);
    setIsDateDropdownOpen(false);
  };

  {
    /* Account fetching */
  }
  useEffect(() => {
    const fetchAccountsData = async () => {
      if (!user?.id) {
        console.log("No user ID available for account fetching");
        return;
      }

      try {
        setAccountsLoading(true);
        console.log("Fetching accounts for chart component");

        const { startDate, endDate } = currentDateRange;
        const accountsData = await fetchAllAccounts(
          user.id,
          startDate,
          endDate
        );

        console.log("Accounts loaded in chart:", accountsData);
        setAccounts(accountsData || []);

        if (onAccountsUpdate) {
          onAccountsUpdate(accountsData || []);
        }
      } catch (error) {
        console.error("Failed to fetch accounts in chart:", error);
        setAccounts([]);
      } finally {
        setAccountsLoading(false);
      }
    };

    fetchAccountsData();
  }, [user?.id, onAccountsUpdate, currentDateRange]);

  const getDateRangeText = () => {
    const { startDate, endDate } = currentDateRange;
    if (selectedRange === "current_month") {
      return startDate.toLocaleString("default", {
        month: isMobileView ? "short" : "long",
        year: "numeric",
      });
    }
    return `${startDate.toLocaleString("default", {
      month: "short",
      year: "numeric",
    })} - ${endDate.toLocaleString("default", {
      month: "short",
      year: "numeric",
    })}`;
  };

  const generateAccountColors = (numAccounts: number): string[] => {
    const availableColors = [
      "#3b82f6",
      "#8b5cf6",
      "#06b6d4",
      "#84cc16",
      "#f97316",
      "#ec4899",
      "#6366f1",
      "#14b8a6",
      "#a855f7",
      "#22c55e",
      "#fb7185",
      "#fbbf24",
      "#60a5fa",
    ];

    return availableColors.slice(0, numAccounts);
  };

  const accountColors = useMemo(() => {
    return generateAccountColors(defaultAccounts.length);
  }, [defaultAccounts.length]);

  const handleOpenModal = (type: "income" | "expense" | "transfer" | "net") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  {
    /* Enhanced mobile view detection */
  }
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  {
    /* Exchange rates loading */
  }
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

  {
    /* Click outside handlers */
  }
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyMenuOpen(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDateDropdownOpen(false);
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

  const shouldIncludePaymentInRange = (
    paymentDate: Date,
    rangeStart: Date,
    rangeEnd: Date
  ): boolean => {
    if (isNaN(paymentDate.getTime())) return false;

    const paymentDateOnly = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      paymentDate.getDate()
    );
    const rangeStartOnly = new Date(
      rangeStart.getFullYear(),
      rangeStart.getMonth(),
      rangeStart.getDate()
    );
    const rangeEndOnly = new Date(
      rangeEnd.getFullYear(),
      rangeEnd.getMonth(),
      rangeEnd.getDate()
    );

    return paymentDateOnly >= rangeStartOnly && paymentDateOnly <= rangeEndOnly;
  };

  {
    /* Chart data generation */
  }
  const chartData = useMemo(() => {
    if (accountsLoading) {
      return { dataPoints: [], todayDay: 1 };
    }

    const { startDate, endDate } = currentDateRange;
    const today = new Date();

    const totalDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    const todayLocal = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startDateLocal = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const todayInRange = shouldIncludePaymentInRange(today, startDate, endDate)
      ? Math.floor(
          (todayLocal.getTime() - startDateLocal.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : totalDays + 1;

    {
      /* Account balance calculation */
    }
    const accountBalancesByDay: Record<
      number,
      Record<
        number,
        {
          balance: number;
          date: Date;
          changeType: string | null;
          amountChanged: number;
          uniqueId: string;
          transactionCount?: number;
          hasFuturePayment?: boolean;
        }
      >
    > = defaultAccounts.reduce(
      (acc, account) => {
        acc[account.id] = {};

        let startBalance = 0;

        if (account.balanceHistory && Array.isArray(account.balanceHistory)) {
          const sortedHistory = [...account.balanceHistory].sort(
            (a: BalanceHistoryEntry, b: BalanceHistoryEntry) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const transactionsByDay: Record<
            number,
            ExtendedBalanceHistoryEntry[]
          > = {};

          sortedHistory.forEach(
            (historyEntry: BalanceHistoryEntry, index: number) => {
              const entryDate = new Date(historyEntry.createdAt);

              if (shouldIncludePaymentInRange(entryDate, startDate, endDate)) {
                const dayOfRange =
                  Math.floor(
                    (entryDate.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1;

                if (!transactionsByDay[dayOfRange]) {
                  transactionsByDay[dayOfRange] = [];
                }

                transactionsByDay[dayOfRange].push({
                  ...historyEntry,
                  dayOfRange,
                  entryDate,
                  index,
                });
              }
            }
          );

          Object.keys(transactionsByDay).forEach((day) => {
            const dayTransactions = transactionsByDay[parseInt(day)];
            const lastTransaction: ExtendedBalanceHistoryEntry =
              dayTransactions.reduce(
                (
                  latest: ExtendedBalanceHistoryEntry,
                  current: ExtendedBalanceHistoryEntry
                ) =>
                  new Date(current.createdAt).getTime() >
                  new Date(latest.createdAt).getTime()
                    ? current
                    : latest
              );

            const convertedBalance = convertToDisplayCurrency(
              lastTransaction.newBalance,
              lastTransaction.currency || account.currency || displayCurrency
            );

            acc[account.id][parseInt(day)] = {
              balance: convertedBalance,
              date: lastTransaction.entryDate,
              changeType: lastTransaction.changeType,
              amountChanged: convertToDisplayCurrency(
                lastTransaction.amountChanged,
                lastTransaction.currency || account.currency || displayCurrency
              ),
              uniqueId: `${account.id}-${day}-${lastTransaction.index}`,
              transactionCount: dayTransactions.length,
            };
          });
        }

        if (account.balanceHistory && account.balanceHistory.length > 0) {
          const firstHistoryEntry = account.balanceHistory.find(
            (entry: BalanceHistoryEntry) => {
              const entryDate = new Date(entry.createdAt);
              return shouldIncludePaymentInRange(entryDate, startDate, endDate);
            }
          );

          if (firstHistoryEntry) {
            startBalance = convertToDisplayCurrency(
              firstHistoryEntry.previousBalance || 0,
              firstHistoryEntry.currency || account.currency || displayCurrency
            );
          } else {
            startBalance = 0;
          }
        } else {
          startBalance = 0;
        }

        let lastKnownBalance = startBalance;
        for (let day = 1; day <= totalDays; day++) {
          if (acc[account.id][day]) {
            lastKnownBalance = acc[account.id][day].balance;
          } else {
            const dayDate = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              day
            );
            acc[account.id][day] = {
              balance: lastKnownBalance,
              date: dayDate,
              changeType: null,
              amountChanged: 0,
              uniqueId: `${account.id}-${day}-filled`,
              transactionCount: 0,
            };
          }
        }

        return acc;
      },
      {} as Record<
        number,
        Record<
          number,
          {
            balance: number;
            date: Date;
            changeType: string | null;
            amountChanged: number;
            uniqueId: string;
            transactionCount?: number;
            hasFuturePayment?: boolean;
          }
        >
      >
    );

    {
      /* Future payments processing */
    }
    if (includeUpcoming) {
      const allFuturePayments = [
        ...futureIncomingPayments.map((p: any) => ({ ...p, type: "INCOME" })),
        ...futureOutgoingPayments.map((p: any) => ({
          ...p,
          type: p.type === "TRANSFER" ? "TRANSFER" : "EXPENSE",
        })),
      ].filter((p: any) => {
        if (!p.nextExecution) return false;
        const paymentDate = new Date(p.nextExecution);
        return (
          shouldIncludePaymentInRange(paymentDate, startDate, endDate) &&
          paymentDate > today
        );
      });

      allFuturePayments.sort(
        (a: any, b: any) =>
          new Date(a.nextExecution).getTime() -
          new Date(b.nextExecution).getTime()
      );

      allFuturePayments.forEach((payment: any) => {
        const paymentDate = new Date(payment.nextExecution);
        const paymentDateLocal = new Date(
          paymentDate.getFullYear(),
          paymentDate.getMonth(),
          paymentDate.getDate()
        );
        const startDateLocal = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        );
        const dayOfRange =
          Math.floor(
            (paymentDateLocal.getTime() - startDateLocal.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;

        if (dayOfRange >= todayInRange) {
          const targetAccountId =
            payment.accountId ||
            payment.fromAccountId ||
            defaultAccounts[0]?.id;

          if (targetAccountId && accountBalancesByDay[targetAccountId]) {
            const convertedAmount = convertToDisplayCurrency(
              payment.amount || 0,
              payment.currency || displayCurrency
            );

            for (let day = dayOfRange; day <= totalDays; day++) {
              if (accountBalancesByDay[targetAccountId][day]) {
                if (payment.type === "INCOME") {
                  accountBalancesByDay[targetAccountId][day].balance +=
                    convertedAmount;
                } else if (
                  payment.type === "EXPENSE" ||
                  payment.type === "TRANSFER"
                ) {
                  accountBalancesByDay[targetAccountId][day].balance -=
                    convertedAmount;
                }

                accountBalancesByDay[targetAccountId][day].hasFuturePayment =
                  true;
              }
            }
          }
        }
      });
    }

    const rangeTransactions = transactions.filter((t: any) => {
      const transactionDate = new Date(t.createdAt || t.date);
      return shouldIncludePaymentInRange(transactionDate, startDate, endDate);
    });

    const upcomingIncome = futureIncomingPayments.filter((p: any) => {
      if (!p.nextExecution) return false;
      const nextDate = new Date(p.nextExecution);
      return shouldIncludePaymentInRange(nextDate, startDate, endDate);
    });

    const upcomingExpenses = futureOutgoingPayments.filter((p: any) => {
      if (!p.nextExecution) return false;
      const nextDate = new Date(p.nextExecution);
      return (
        shouldIncludePaymentInRange(nextDate, startDate, endDate) &&
        p.type !== "TRANSFER"
      );
    });

    const upcomingTransfers = futureOutgoingPayments.filter((p: any) => {
      if (!p.nextExecution) return false;
      const nextDate = new Date(p.nextExecution);
      return (
        shouldIncludePaymentInRange(nextDate, startDate, endDate) &&
        p.type === "TRANSFER"
      );
    });

    const dataPoints = [];

    const lastDayToShow = includeUpcoming
      ? totalDays
      : Math.min(todayInRange, totalDays);

    {
      /* Data points generation */
    }
    for (let day = 1; day <= lastDayToShow; day++) {
      const currentDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        day
      );

      const dayLabel = currentDate.getDate().toString();
      const isToday = currentDate.toDateString() === today.toDateString();
      const isFuture = currentDate > today;

      const dayTransactions = rangeTransactions.filter((t: any) => {
        const transactionDate = new Date(t.createdAt || t.date);
        return transactionDate.toDateString() === currentDate.toDateString();
      });

      const incomeTransactions = dayTransactions.filter(
        (t: any) => t.type === "INCOME"
      );
      const expenseTransactions = dayTransactions.filter(
        (t: any) => t.type === "EXPENSE"
      );
      const transferTransactions = dayTransactions.filter(
        (t: any) => t.type === "TRANSFER"
      );

      const actualIncome = incomeTransactions.reduce((sum: number, t: any) => {
        const amount = t.amount ?? 0;
        const currency = t.currency || displayCurrency;
        return sum + convertToDisplayCurrency(amount, currency);
      }, 0);

      const actualExpenses = expenseTransactions.reduce(
        (sum: number, t: any) => {
          const amount = t.amount ?? 0;
          const currency = t.currency || displayCurrency;
          return sum + convertToDisplayCurrency(amount, currency);
        },
        0
      );

      const actualTransfers = transferTransactions.reduce(
        (sum: number, t: any) => {
          const amount = t.amount ?? 0;
          const currency = t.currency || displayCurrency;
          return sum + convertToDisplayCurrency(amount, currency);
        },
        0
      );

      const dayUpcomingIncomePayments = upcomingIncome.filter((p: any) => {
        const paymentDate = new Date(p.nextExecution);
        return paymentDate.toDateString() === currentDate.toDateString();
      });

      const dayUpcomingExpensePayments = upcomingExpenses.filter((p: any) => {
        const paymentDate = new Date(p.nextExecution);
        return paymentDate.toDateString() === currentDate.toDateString();
      });

      const dayUpcomingTransferPayments = upcomingTransfers.filter((p: any) => {
        const paymentDate = new Date(p.nextExecution);
        return paymentDate.toDateString() === currentDate.toDateString();
      });

      const dayUpcomingIncome = dayUpcomingIncomePayments.reduce(
        (sum: number, p: any) => {
          const amount = p.amount ?? 0;
          const currency = p.currency || displayCurrency;
          return sum + convertToDisplayCurrency(amount, currency);
        },
        0
      );

      const dayUpcomingExpenses = dayUpcomingExpensePayments.reduce(
        (sum: number, p: any) => {
          const amount = p.amount ?? 0;
          const currency = p.currency || displayCurrency;
          return sum + convertToDisplayCurrency(amount, currency);
        },
        0
      );

      const dayUpcomingTransfers = dayUpcomingTransferPayments.reduce(
        (sum: number, p: any) => {
          const amount = p.amount ?? 0;
          const currency = p.currency || displayCurrency;
          return sum + convertToDisplayCurrency(amount, currency);
        },
        0
      );

      const adjustedCurrentDate = new Date(
        currentDate.getTime() - currentDate.getTimezoneOffset() * 60000
      );

      const dataPoint: ChartDataPoint = {
        day: dayLabel,
        date: adjustedCurrentDate.toISOString().split("T")[0],
        fullDate: currentDate,
        isToday,
        isFuture,
        actualIncome: actualIncome,
        actualExpenses: actualExpenses,
        actualTransfers: actualTransfers,
        upcomingIncome: dayUpcomingIncome,
        upcomingExpenses: dayUpcomingExpenses,
        upcomingTransfers: dayUpcomingTransfers,
        incomeTransactions,
        expenseTransactions,
        transferTransactions,
        upcomingIncomePayments: dayUpcomingIncomePayments,
        upcomingExpensePayments: dayUpcomingExpensePayments,
        upcomingTransferPayments: dayUpcomingTransferPayments,
        dayIndex: day,
      };

      {
        /* Set line data for past/present vs future */
      }
      if (!isFuture) {
        dataPoint.income = actualIncome || 0;
        dataPoint.expenses = actualExpenses || 0;
        dataPoint.transfers = actualTransfers || 0;
        if (includeUpcoming) {
          dataPoint.incomeFuture = null;
          dataPoint.expensesFuture = null;
          dataPoint.transfersFuture = null;
        }
      } else {
        dataPoint.income = null;
        dataPoint.expenses = null;
        dataPoint.transfers = null;
        dataPoint.incomeFuture = dayUpcomingIncome || 0;
        dataPoint.expensesFuture = dayUpcomingExpenses || 0;
        dataPoint.transfersFuture = dayUpcomingTransfers || 0;
      }

      {
        /* Handle today transition point */
      }
      if (includeUpcoming && day === todayInRange) {
        dataPoint.incomeFuture = actualIncome || 0;
        dataPoint.expensesFuture = actualExpenses || 0;
        dataPoint.transfersFuture = actualTransfers || 0;
      }

      {
        /* Account balance data */
      }
      defaultAccounts.forEach((account: any) => {
        const balanceData = accountBalancesByDay[account.id]?.[day];
        const balance =
          balanceData?.balance ||
          (day > 1
            ? accountBalancesByDay[account.id]?.[day - 1]?.balance || 0
            : 0);

        dataPoint[`account_${account.id}`] = balance;

        if (includeUpcoming) {
          if (day <= todayInRange) {
            dataPoint[`account_${account.id}_future`] = null;
          } else {
            dataPoint[`account_${account.id}`] = null;
            dataPoint[`account_${account.id}_future`] = balance;
          }

          if (day === todayInRange) {
            dataPoint[`account_${account.id}_future`] = balance;
          }
        }

        if (balanceData) {
          dataPoint[`account_${account.id}_change`] = balanceData.amountChanged;
          dataPoint[`account_${account.id}_changeType`] =
            balanceData.changeType;
          dataPoint[`account_${account.id}_projected`] =
            balanceData.hasFuturePayment || false;
        } else {
          dataPoint[`account_${account.id}_projected`] = false;
        }
      });

      dataPoints.push(dataPoint);
    }

    return { dataPoints, todayDay: todayInRange };
  }, [
    defaultAccounts,
    transactions,
    futureIncomingPayments,
    futureOutgoingPayments,
    includeUpcoming,
    displayCurrency,
    currentDateRange,
    rates,
    accountsLoading,
  ]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const currentDate = data.fullDate;

    const formattedDate = currentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div className="bg-white/95 backdrop-blur border border-gray-100 rounded-lg shadow-lg p-4 max-w-[300px]">
        <p className="text-sm font-medium text-gray-600 mb-3 text-center">
          {formattedDate}
        </p>

        <div className="space-y-2">
          {(data.income > 0 || data.incomeFuture > 0) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-700">
                +{(data.income || data.incomeFuture || 0).toFixed(1)}{" "}
                {displayCurrency}
              </span>
            </div>
          )}

          {(data.expenses > 0 || data.expensesFuture > 0) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs font-medium text-red-700">
                -{(data.expenses || data.expensesFuture || 0).toFixed(1)}{" "}
                {displayCurrency}
              </span>
            </div>
          )}

          <div className="mt-1.5 pt-1.5 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <DollarSign className="w-3 h-3 text-gray-600" />
              <span
                className={`text-xs font-medium ${
                  (data.income || data.incomeFuture || 0) -
                    (data.expenses || data.expensesFuture || 0) >=
                  0
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {(
                  (data.income || data.incomeFuture || 0) -
                  (data.expenses || data.expensesFuture || 0)
                ).toFixed(1)}{" "}
                {displayCurrency}
              </span>
            </div>
          </div>

          {defaultAccounts.length > 0 && (
            <>
              <div className="my-1.5 h-px bg-gray-100" />
              <div className="space-y-1">
                {defaultAccounts.map((account: any, index: number) => {
                  const balance =
                    data[`account_${account.id}`] ||
                    data[`account_${account.id}_future`] ||
                    0;
                  const isProjected = includeUpcoming && data.isFuture;
                  return (
                    <div
                      key={`tooltip-account-${account.id}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: accountColors[index] }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {balance.toFixed(1)} {displayCurrency}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {(data.transfers > 0 || data.transfersFuture > 0) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-700">
                {(data.transfers || data.transfersFuture || 0).toFixed(1)}{" "}
                {displayCurrency}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  {
    /* Summary statistics */
  }
  const summaryStats = useMemo(() => {
    let totalActualIncome = 0;
    let totalActualExpenses = 0;
    let totalActualTransfers = 0;
    let totalUpcomingIncome = 0;
    let totalUpcomingExpenses = 0;
    let totalUpcomingTransfers = 0;

    chartData.dataPoints.forEach((d: any) => {
      if (d.actualIncome && d.actualIncome > 0) {
        totalActualIncome += d.actualIncome;
      }
      if (d.actualExpenses && d.actualExpenses > 0) {
        totalActualExpenses += d.actualExpenses;
      }
      if (d.actualTransfers && d.actualTransfers > 0) {
        totalActualTransfers += d.actualTransfers;
      }
      if (d.upcomingIncome && d.upcomingIncome > 0) {
        totalUpcomingIncome += d.upcomingIncome;
      }
      if (d.upcomingExpenses && d.upcomingExpenses > 0) {
        totalUpcomingExpenses += d.upcomingExpenses;
      }
      if (d.upcomingTransfers && d.upcomingTransfers > 0) {
        totalUpcomingTransfers += d.upcomingTransfers;
      }
    });

    const actualNet =
      totalActualIncome - totalActualExpenses - totalActualTransfers;
    const projectedNet =
      totalActualIncome +
      totalUpcomingIncome -
      (totalActualExpenses +
        totalUpcomingExpenses +
        totalActualTransfers +
        totalUpcomingTransfers);

    return {
      actualIncome: totalActualIncome,
      actualExpenses: totalActualExpenses,
      actualTransfers: totalActualTransfers,
      upcomingIncome: totalUpcomingIncome,
      upcomingExpenses: totalUpcomingExpenses,
      upcomingTransfers: totalUpcomingTransfers,
      actualNet,
      projectedNet,
    };
  }, [chartData]);

  if (accountsLoading) {
    return (
      <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
          isMobileView ? "p-3 mb-4 mx-2" : "p-6 mb-8"
        }`}
        style={{
          height: isMobileView ? "350px" : "400px",
          overflowX: "hidden",
        }}
      >
        {/* Mobile-optimized background elements */}
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-blue-300 to-indigo-500 rounded-full opacity-20 ${
            isMobileView
              ? "w-12 h-12 -translate-y-6 translate-x-6"
              : "w-28 h-28 -translate-y-14 translate-x-14"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 bg-gradient-to-tr from-purple-300 to-pink-500 rounded-full opacity-15 ${
            isMobileView
              ? "w-8 h-8 translate-y-4 -translate-x-4"
              : "w-20 h-20 translate-y-10 -translate-x-10"
          }`}
        ></div>

        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
        isMobileView ? "p-3 mb-4 mx-2" : "p-6 mb-8"
      }`}
      style={{
        height: isMobileView ? "auto" : "500px",
        minHeight: isMobileView ? "500px" : "500px",
        overflowX: "hidden",
      }}
    >
      {/* Mobile-optimized background elements */}
      <div
        className={`absolute top-0 right-0 bg-gradient-to-br from-blue-300 to-indigo-500 rounded-full opacity-20 ${
          isMobileView
            ? "w-12 h-12 -translate-y-6 translate-x-6"
            : "w-28 h-28 -translate-y-14 translate-x-14"
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 bg-gradient-to-tr from-purple-300 to-pink-500 rounded-full opacity-15 ${
          isMobileView
            ? "w-8 h-8 translate-y-4 -translate-x-4"
            : "w-20 h-20 translate-y-10 -translate-x-10"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-emerald-300 to-teal-500 rounded-full opacity-10 ${
          isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-amber-300 to-orange-400 rounded-full opacity-10 ${
          isMobileView
            ? "bottom-3 right-12 w-6 h-6"
            : "bottom-12 right-20 w-12 h-12"
        }`}
      ></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Enhanced Header */}
        <div className={`flex-shrink-0 ${isMobileView ? "mb-2" : "mb-4"}`}>
          <div
            className={`flex ${isMobileView ? "flex-col space-y-3" : "justify-between items-center"}`}
          >
            {/* Title Section */}
            <div className="flex items-center space-x-3">
              <motion.div
                className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md ${
                  isMobileView ? "w-8 h-8" : "w-12 h-12"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp
                  className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`}
                />
              </motion.div>
              <div>
                <h3
                  className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                    isMobileView ? "text-lg" : "text-xl"
                  }`}
                >
                  {isMobileView ? "Accounts Trend" : "Accounts Balance Trend"}
                </h3>
                <p
                  className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                >
                  {getDateRangeText()}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div
              className={`flex ${isMobileView ? "justify-between w-full" : "items-center space-x-3"}`}
            >
              {/* Date Range Selector */}
              <div className="relative" ref={dateDropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors flex items-center shadow-md ${
                    isMobileView ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
                  }`}
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                >
                  <Calendar size={isMobileView ? 12 : 14} className="mr-1" />
                  <span>
                    {isMobileView
                      ? selectedRange === "current_month"
                        ? "Month"
                        : selectedRange === "last_3_months"
                          ? "3M"
                          : selectedRange === "last_6_months"
                            ? "6M"
                            : "Year"
                      : dateRangeOptions.find(
                          (option) => option.key === selectedRange
                        )?.label}
                  </span>
                  <ChevronDown size={isMobileView ? 12 : 14} className="ml-1" />
                </motion.button>

                <AnimatePresence>
                  {isDateDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute ${isMobileView ? "top-full left-0" : "top-full right-0"} mt-2 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 ${
                        isMobileView ? "w-32" : "w-48"
                      }`}
                    >
                      <div className="max-h-48 overflow-y-auto">
                        {dateRangeOptions.map((option: any) => (
                          <motion.button
                            key={`date-option-${option.key}`}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full text-left px-3 py-2 transition-colors ${isMobileView ? "text-xs" : "text-sm"} ${
                              option.key === selectedRange
                                ? "bg-blue-100 text-blue-700 font-medium"
                                : "text-gray-700 hover:bg-blue-50 active:bg-blue-100"
                            }`}
                            onClick={() =>
                              handleDateRangeChange(
                                option.key as DateRangeOption
                              )
                            }
                          >
                            {option.label}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Currency Selector */}
              <div className="relative" ref={currencyRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors flex items-center shadow-md ${
                    isMobileView ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
                  }`}
                  onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                  disabled={fetchingRates}
                >
                  {fetchingRates ? (
                    <RefreshCw
                      size={isMobileView ? 12 : 14}
                      className="animate-spin mr-1"
                    />
                  ) : (
                    <DollarSign
                      size={isMobileView ? 12 : 14}
                      className="mr-1"
                    />
                  )}
                  <span>{displayCurrency}</span>
                  <ChevronDown size={isMobileView ? 12 : 14} className="ml-1" />
                </motion.button>

                <AnimatePresence>
                  {isCurrencyMenuOpen && availableCurrencies.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute ${isMobileView ? "top-full left-0" : "top-full right-0"} mt-2 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 ${
                        isMobileView ? "w-20" : "w-32"
                      }`}
                    >
                      <div className="max-h-32 overflow-y-auto">
                        {availableCurrencies.map((currency: string) => (
                          <motion.button
                            key={`currency-option-${currency}`}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full text-left px-3 py-2 transition-colors ${isMobileView ? "text-xs" : "text-sm"} ${
                              currency === displayCurrency
                                ? "bg-blue-100 text-blue-700 font-medium"
                                : "text-gray-700 hover:bg-blue-50 active:bg-blue-100"
                            }`}
                            onClick={() => handleCurrencyChange(currency)}
                          >
                            {currency}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Toggle Switch */}
              <motion.button
                onClick={() => setIncludeUpcoming(!includeUpcoming)}
                className={`relative inline-flex items-center justify-center ${
                  isMobileView ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
                } rounded-full transition-all duration-200 ${
                  includeUpcoming
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700"
                } shadow-md`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {!isMobileView && <Calendar size={12} className="mr-1" />}
                <span className="flex items-center">
                  {isMobileView ? "Upcoming" : "Show Upcoming"}
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div
          className={`${isMobileView ? "h-64 mb-3" : "flex-1 h-64 mb-4 min-h-0"}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              key={`chart-${selectedRange}-${includeUpcoming}`}
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
                interval={
                  selectedRange === "current_month"
                    ? isMobileView
                      ? 2
                      : "preserveStartEnd"
                    : 5
                }
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
              {!isMobileView && <Legend wrapperStyle={{ fontSize: "12px" }} />}

              {includeUpcoming &&
                chartData.todayDay <= chartData.dataPoints.length && (
                  <ReferenceLine
                    x={chartData.todayDay.toString()}
                    stroke="#7c3aed"
                    strokeDasharray="4 4"
                    strokeWidth={isMobileView ? 1.5 : 2}
                  />
                )}

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

              {/* Account lines */}
              {defaultAccounts.map((account: any, index: number) => (
                <React.Fragment key={`account-lines-${account.id}`}>
                  <Line
                    key={`account-line-${account.id}`}
                    dataKey={`account_${account.id}`}
                    stroke={accountColors[index] || "#6b7280"}
                    strokeWidth={isMobileView ? 1.5 : 2}
                    name={account.name || `Account ${index + 1}`}
                    dot={false}
                    activeDot={{
                      r: isMobileView ? 3 : 4,
                      fill: accountColors[index] || "#6b7280",
                    }}
                    connectNulls={false}
                  />

                  {includeUpcoming && (
                    <Line
                      key={`account-line-future-${account.id}`}
                      dataKey={`account_${account.id}_future`}
                      stroke={accountColors[index] || "#6b7280"}
                      strokeWidth={isMobileView ? 1.5 : 2}
                      strokeDasharray="4 4"
                      name={`${account.name || `Account ${index + 1}`} (Projected)`}
                      dot={false}
                      activeDot={{
                        r: isMobileView ? 3 : 4,
                        fill: accountColors[index] || "#6b7280",
                      }}
                      connectNulls={false}
                    />
                  )}
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Enhanced Summary Cards */}
        <div
          className={`flex-shrink-0 grid gap-2 ${isMobileView ? "grid-cols-3" : "grid-cols-3"}`}
        >
          <motion.div
            className={`bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-xl shadow-lg cursor-pointer relative overflow-hidden ${
              isMobileView ? "p-2" : "p-4"
            }`}
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: "0 15px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleOpenModal("income")}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-white/20 rounded-full -translate-y-3 translate-x-3"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-white/10 rounded-full translate-y-2 -translate-x-2"></div>

            <div className="relative z-10">
              <div
                className={`flex ${isMobileView ? "flex-col items-center space-y-1" : "items-center space-x-2"}`}
              >
                <div className="bg-white/20 rounded-lg p-1 shadow-sm backdrop-blur-sm">
                  <TrendingUp
                    className={`text-white ${isMobileView ? "w-3 h-3" : "w-4 h-4"}`}
                  />
                </div>
                {!isMobileView && (
                  <p className="text-white font-medium text-sm">
                    {includeUpcoming ? "Projected Income" : "Actual Income"}
                  </p>
                )}
              </div>
              <div className={`${isMobileView ? "mt-1" : "mt-2"}`}>
                {isMobileView && (
                  <p className="text-white/90 font-medium text-xs text-center mb-1">
                    Income
                  </p>
                )}
                <p
                  className={`font-bold text-white text-center ${isMobileView ? "text-sm" : "text-xl"}`}
                >
                  +
                  {(includeUpcoming
                    ? summaryStats.actualIncome + summaryStats.upcomingIncome
                    : summaryStats.actualIncome
                  ).toFixed(isMobileView ? 0 : 2)}
                  {isMobileView && (
                    <span className="text-xs block">{displayCurrency}</span>
                  )}
                  {!isMobileView && (
                    <span className="ml-1">{displayCurrency}</span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={`bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-xl shadow-lg cursor-pointer relative overflow-hidden ${
              isMobileView ? "p-2" : "p-4"
            }`}
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: "0 15px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleOpenModal("expense")}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-white/20 rounded-full -translate-y-3 translate-x-3"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-white/10 rounded-full translate-y-2 -translate-x-2"></div>

            <div className="relative z-10">
              <div
                className={`flex ${isMobileView ? "flex-col items-center space-y-1" : "items-center space-x-2"}`}
              >
                <div className="bg-white/20 rounded-lg p-1 shadow-sm backdrop-blur-sm">
                  <TrendingDown
                    className={`text-white ${isMobileView ? "w-3 h-3" : "w-4 h-4"}`}
                  />
                </div>
                {!isMobileView && (
                  <p className="text-white font-medium text-sm">
                    {includeUpcoming ? "Projected Expenses" : "Actual Expenses"}
                  </p>
                )}
              </div>
              <div className={`${isMobileView ? "mt-1" : "mt-2"}`}>
                {isMobileView && (
                  <p className="text-white/90 font-medium text-xs text-center mb-1">
                    Expenses
                  </p>
                )}
                <p
                  className={`font-bold text-white text-center ${isMobileView ? "text-sm" : "text-xl"}`}
                >
                  -
                  {(includeUpcoming
                    ? summaryStats.actualExpenses +
                      summaryStats.upcomingExpenses
                    : summaryStats.actualExpenses
                  ).toFixed(isMobileView ? 0 : 2)}
                  {isMobileView && (
                    <span className="text-xs block">{displayCurrency}</span>
                  )}
                  {!isMobileView && (
                    <span className="ml-1">{displayCurrency}</span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={`bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl shadow-lg cursor-pointer relative overflow-hidden ${
              isMobileView ? "p-2" : "p-4"
            }`}
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: "0 15px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleOpenModal("transfer")}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-white/20 rounded-full -translate-y-3 translate-x-3"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-white/10 rounded-full translate-y-2 -translate-x-2"></div>

            <div className="relative z-10">
              <div
                className={`flex ${isMobileView ? "flex-col items-center space-y-1" : "items-center space-x-2"}`}
              >
                <div className="bg-white/20 rounded-lg p-1 shadow-sm backdrop-blur-sm">
                  <ArrowRightLeft
                    className={`text-white ${isMobileView ? "w-3 h-3" : "w-4 h-4"}`}
                  />
                </div>
                {!isMobileView && (
                  <p className="text-white font-medium text-sm">
                    {includeUpcoming
                      ? "Projected Transfers"
                      : "Total Transfers"}
                  </p>
                )}
              </div>
              <div className={`${isMobileView ? "mt-1" : "mt-2"}`}>
                {isMobileView && (
                  <p className="text-white/90 font-medium text-xs text-center mb-1">
                    Transfers
                  </p>
                )}
                <p
                  className={`font-bold text-white text-center ${isMobileView ? "text-sm" : "text-xl"}`}
                >
                  {(includeUpcoming
                    ? summaryStats.actualTransfers +
                      summaryStats.upcomingTransfers
                    : summaryStats.actualTransfers
                  ).toFixed(isMobileView ? 0 : 2)}
                  {isMobileView && (
                    <span className="text-xs block">{displayCurrency}</span>
                  )}
                  {!isMobileView && (
                    <span className="ml-1">{displayCurrency}</span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Mobile Legend */}
        {isMobileView && (
          <div className="flex-shrink-0 mt-2 bg-gray-50 rounded-lg p-1.5">
            <div className="flex justify-center space-x-2 text-xs flex-wrap gap-1">
              {defaultAccounts
                .slice(0, 2)
                .map((account: any, index: number) => (
                  <div
                    key={`legend-account-${account.id}`}
                    className="flex items-center space-x-1"
                  >
                    <div className="flex space-x-0.5">
                      <div
                        className="w-1.5 h-0.5 rounded"
                        style={{
                          backgroundColor: accountColors[index] || "#6b7280",
                        }}
                      ></div>
                      {includeUpcoming && (
                        <div
                          className="w-1.5 h-0.5 rounded border-t border-dashed"
                          style={{
                            backgroundColor: "transparent",
                            borderColor: accountColors[index] || "#6b7280",
                          }}
                        ></div>
                      )}
                    </div>
                    <span className="text-gray-600 truncate max-w-10">
                      {account.name || `Acc ${index + 1}`}
                    </span>
                  </div>
                ))}
            </div>
            {includeUpcoming && (
              <div className="text-center text-xs text-gray-500 mt-0.5">
                Solid: historical • Dashed: projected
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            {isMobileView ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4"
              >
                <TransactionDetailsModal
                  isOpen={isModalOpen}
                  onClose={handleCloseModal}
                  transactions={transactions}
                  futureIncomingPayments={futureIncomingPayments}
                  futureOutgoingPayments={futureOutgoingPayments}
                  displayCurrency={displayCurrency}
                  includeUpcoming={includeUpcoming}
                  monthName={getDateRangeText()}
                  convertToDisplayCurrency={convertToDisplayCurrency}
                  filterType={modalType === "net" ? "all" : modalType}
                  accounts={accounts}
                />
              </motion.div>
            ) : (
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4"
              >
                <TransactionDetailsModal
                  isOpen={isModalOpen}
                  onClose={handleCloseModal}
                  transactions={transactions}
                  futureIncomingPayments={futureIncomingPayments}
                  futureOutgoingPayments={futureOutgoingPayments}
                  displayCurrency={displayCurrency}
                  includeUpcoming={includeUpcoming}
                  monthName={getDateRangeText()}
                  convertToDisplayCurrency={convertToDisplayCurrency}
                  filterType={modalType === "net" ? "all" : modalType}
                  accounts={accounts}
                />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountsTrendChart;
