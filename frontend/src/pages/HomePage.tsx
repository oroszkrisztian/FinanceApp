import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Account } from "../interfaces/Account";
import {
  ExchangeRates,
  fetchExchangeRates,
} from "../services/exchangeRateService";
import { getUserAllTransactions } from "../services/transactionService";
import { getAllBudgets } from "../services/budgetService";
import { getAllPaymentsUser } from "../services/paymentService";
import IncomeExpenseChart from "../components/home/IncomeExpenseChart";
import UpcomingPaymentsSection from "../components/home/UpcomingPaymentsSection";
import BudgetSavingsTabSection from "../components/home/BudgetSavingsTabSection";

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

  // Handle accounts update from chart component
  const handleAccountsUpdate = useCallback((accountsData: Account[]) => {
    setAccounts(accountsData);
  }, []);

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

        const [transactionsData, budgetsData, paymentsData, ratesData] =
          await Promise.allSettled([
            getUserAllTransactions(user.id),
            getAllBudgets(user.id),
            getAllPaymentsUser(user.id),
            fetchExchangeRates(),
          ]);

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

        const criticalFailures = [transactionsData].filter(
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-[1920px] w-full mx-auto">
        {/* Welcome Header */}
        <div className="mb-6 px-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || user.email}
          </h1>
          <p className="text-gray-600">Here's your financial overview</p>
        </div>

        {/* Income vs Expense Chart */}
        <div className="px-0 sm:px-2">
          <IncomeExpenseChart
            transactions={transactions}
            futureOutgoingPayments={futureOutgoingPayments}
            futureIncomingPayments={futureIncomingPayments}
            displayCurrency={displayCurrency}
            onAccountsUpdate={handleAccountsUpdate}
          />
        </div>

        {/* Two Column Layout for Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 px-2">
          {/* Left Column - Upcoming Payments */}
          <div className="space-y-8">
            <UpcomingPaymentsSection
              futureOutgoingPayments={futureOutgoingPayments}
              futureIncomingPayments={futureIncomingPayments}
              displayCurrency={displayCurrency}
            />
          </div>

          {/* Right Column - Budget & Savings Tabs */}
          <div className="space-y-8">
            <BudgetSavingsTabSection
              accounts={accounts}
              budgets={budgets}
              transactions={transactions}
              displayCurrency={displayCurrency}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
