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
import AIInsightsComponent from "../components/home/AIInsightsComponent";
import UpcomingPaymentsSection from "../components/home/UpcomingPaymentsSection";
import BudgetSavingsTabSection from "../components/home/BudgetSavingsTabSection";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

const HomePage: React.FC = () => {
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
  const [isMobileView, setIsMobileView] = useState(false);

  const handleAccountsUpdate = useCallback((accountsData: Account[]) => {
    setAccounts(accountsData);
  }, []);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1280);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsData, budgetsData, paymentsData, ratesData] =
        await Promise.allSettled([
          getUserAllTransactions(),
          getAllBudgets(),
          getAllPaymentsUser(),
          fetchExchangeRates(),
        ]);

      if (transactionsData.status === "fulfilled") {
        console.log("Transactions loaded:", transactionsData.value);
        setTransactions(
          Array.isArray(transactionsData.value) ? transactionsData.value : []
        );
      } else {
        console.error("Failed to load transactions:", transactionsData.reason);
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

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <LoadingState
        title="Loading Dashboard"
        message="Loading your financial dashboard..."
        showDataStatus={true}
        dataStatus={[
          {
            label: "Transactions",
            isLoaded: !loading && Array.isArray(transactions),
          },
          {
            label: "Budgets",
            isLoaded: !loading && Array.isArray(budgets),
          },
          {
            label: "Payments",
            isLoaded: !loading && Array.isArray(payments),
          },
          {
            label: "Exchange Rates",
            isLoaded: !loading && rates && Object.keys(rates).length >= 0,
          },
        ]}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Dashboard Error"
        showHomeButton={false}
        onRetry={() => {
          setError(null);
          setLoading(true);
          fetchAllData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-[1920px] w-full mx-auto">
        {/* Chart and AI Insights Section */}
        <div className="px-0 sm:px-2 mb-8">
          {isMobileView ? (
            // Mobile: Stack vertically
            <div className="space-y-4">
              <IncomeExpenseChart
                transactions={transactions}
                futureOutgoingPayments={futureOutgoingPayments}
                futureIncomingPayments={futureIncomingPayments}
                displayCurrency={displayCurrency}
                onAccountsUpdate={handleAccountsUpdate}
                isSmallScreen={true}
              />
              <AIInsightsComponent
                accounts={accounts}
                transactions={transactions}
                futureOutgoingPayments={futureOutgoingPayments}
                futureIncomingPayments={futureIncomingPayments}
                budgets={budgets}
                isSmallScreen={true}
              />
            </div>
          ) : (
            // Desktop: Side by side
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Chart takes 1/2 of the width */}
              <div className="xl:col-span-1">
                <IncomeExpenseChart
                  transactions={transactions}
                  futureOutgoingPayments={futureOutgoingPayments}
                  futureIncomingPayments={futureIncomingPayments}
                  displayCurrency={displayCurrency}
                  onAccountsUpdate={handleAccountsUpdate}
                  isSmallScreen={false}
                />
              </div>

              {/* AI Insights takes 1/2 of the width */}
              <div className="xl:col-span-1">
                <AIInsightsComponent
                  accounts={accounts}
                  transactions={transactions}
                  futureOutgoingPayments={futureOutgoingPayments}
                  futureIncomingPayments={futureIncomingPayments}
                  budgets={budgets}
                  isSmallScreen={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Two Column Layout for Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8  ">
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
