import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Account } from "../interfaces/Account";
import {
  ExchangeRates,
  fetchExchangeRates,
} from "../services/exchangeRateService";
import { fetchAllAccounts } from "../services/accountService";
import { getUserAllTransactions } from "../services/transactionService";
import { getAllBudgets } from "../services/budgetService";
import { getAllPaymentsUser } from "../services/paymentService";
import { AccountType } from "../interfaces/enums";
import IncomeExpenseChart from "../components/home/IncomeExpenseChart";
import UpcomingPaymentsSection from "../components/home/UpcomingPaymentsSection";
import SavingsGoalsSection from "../components/home/SavingsGoalsSection";
import BudgetCompletionSection from "../components/home/BudgetCompletionSection";

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [futureOutgoingPayments, setFutureOutgoingPayments] = useState<any[]>(
    []
  );
  const [futureIncomingPayments, setFutureIncomingPayments] = useState<any[]>(
    []
  );
  const [rates, setRates] = useState<ExchangeRates>({});
  const [displayCurrency, setDisplayCurrency] = useState("RON");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.id) {
        console.log("No user ID available");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching data for user:", user.id);

        const abortController = new AbortController();

        const [
          accountsData,
          transactionsData,
          budgetsData,
          paymentsData,
          ratesData,
        ] = await Promise.allSettled([
          fetchAllAccounts(user.id, abortController.signal),
          getUserAllTransactions(user.id),
          getAllBudgets(user.id),
          getAllPaymentsUser(user.id),
          fetchExchangeRates(),
        ]);

        if (accountsData.status === "fulfilled") {
          console.log("Accounts loaded:", accountsData.value);
          setAccounts(accountsData.value || []);
        } else {
          console.error("Failed to load accounts:", accountsData.reason);
        }

        if (transactionsData.status === "fulfilled") {
          console.log("Transactions loaded:", transactionsData.value);
          setTransactions(
            Array.isArray(transactionsData.value) ? transactionsData.value : []
          );
        } else {
          console.error(
            "Failed to load transactions:",
            transactionsData.reason
          );
        }

        if (budgetsData.status === "fulfilled") {
          console.log("Budgets loaded:", budgetsData.value);
          setBudgets(Array.isArray(budgetsData.value) ? budgetsData.value : []);
        } else {
          console.error("Failed to load budgets:", budgetsData.reason);
        }

        if (paymentsData.status === "fulfilled") {
          console.log("Payments loaded:", paymentsData.value);
          setPayments(
            Array.isArray(paymentsData.value) ? paymentsData.value : []
          );

          const outgoingPayments = (paymentsData.value || []).filter(
            (payment: any) => payment.type === "EXPENSE"
          );
          const incomingPayments = (paymentsData.value || []).filter(
            (payment: any) => payment.type === "INCOME"
          );

          setFutureOutgoingPayments(outgoingPayments);
          setFutureIncomingPayments(incomingPayments);
        } else {
          console.error("Failed to load payments:", paymentsData.reason);
        }

        if (ratesData.status === "fulfilled") {
          console.log("Exchange rates loaded:", ratesData.value);
          setRates(ratesData.value || {});
        } else {
          console.error("Failed to load exchange rates:", ratesData.reason);
        }

        const criticalFailures = [accountsData, transactionsData].filter(
          (result) => result.status === "rejected"
        );

        if (criticalFailures.length > 0) {
          setError("Some data failed to load. Please refresh the page.");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user?.id]);

  const { monthlyIncome, monthlyExpenses } = useMemo(() => {
    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const monthlyTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startOfMonth;
    });

    const income = monthlyTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { monthlyIncome: income, monthlyExpenses: expenses };
  }, [transactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || user.email}
          </h1>
          <p className="text-gray-600">
            Here's your financial overview for{" "}
            {new Date().toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Income vs Expense Chart */}
        <IncomeExpenseChart
          transactions={transactions}
          futureOutgoingPayments={futureOutgoingPayments}
          futureIncomingPayments={futureIncomingPayments}
          accounts={accounts}
          displayCurrency={displayCurrency}
        />

        {/* Two Column Layout for Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Upcoming Payments Section */}
            <UpcomingPaymentsSection
              futureOutgoingPayments={futureOutgoingPayments}
              futureIncomingPayments={futureIncomingPayments}
              displayCurrency={displayCurrency}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Savings Goals Section */}
            <SavingsGoalsSection
              accounts={accounts}
              displayCurrency={displayCurrency}
            />
          </div>
        </div>

        {/* Budget Completion Section - Full Width */}
        <BudgetCompletionSection
          budgets={budgets}
          transactions={transactions}
          displayCurrency={displayCurrency}
        />

        {/* Debug Info - Keep at bottom, hidden in production */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 rounded-lg p-4 text-sm">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>Accounts: {accounts.length}</li>
              <li>
                Savings Accounts:{" "}
                {
                  accounts.filter((acc) => acc.type === AccountType.SAVINGS)
                    .length
                }
              </li>
              <li>Transactions: {transactions.length}</li>
              <li>Budgets: {budgets.length}</li>
              <li>Payments: {payments.length}</li>
              <li>Future Outgoing Payments: {futureOutgoingPayments.length}</li>
              <li>Future Incoming Payments: {futureIncomingPayments.length}</li>
              <li>Exchange Rates: {Object.keys(rates).length}</li>
              <li>Monthly Income: {monthlyIncome}</li>
              <li>Monthly Expenses: {monthlyExpenses}</li>
            </ul>
            {accounts.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Account Types:</p>
                {accounts.map((acc) => (
                  <div key={acc.id} className="ml-2">
                    {acc.name}: {acc.type}{" "}
                    {acc.type === "SAVINGS" ? "(Savings Account)" : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
