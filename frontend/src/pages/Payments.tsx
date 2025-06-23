import React, { useState, useEffect } from "react";
import IncomingRecurringFunds from "../components/payments/IncomingRecurringFunds";
import OutgoingRecurringBills from "../components/payments/OutgoingRecurringBills";
import { getAllPaymentsUser } from "../services/paymentService";
import { Payments as PaymentsInterface } from "../interfaces/Payments";

import { Wallet, CreditCard, Loader2 } from "lucide-react";
import { Account } from "../interfaces/Account";
import { fetchDefaultAccounts } from "../services/accountService";
import { CustomCategory } from "../interfaces/CustomCategory";
import { getAllCategoriesForUser } from "../services/categoriesService";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

const Payments: React.FC = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<PaymentsInterface[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const checkScreenSize = () => {
    setIsSmallScreen(window.innerWidth < 768);
  };

  useEffect(() => {
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const fetchAccounts = async () => {
    try {
      const accountsData: Account[] = await fetchDefaultAccounts();

      if (!Array.isArray(accountsData)) {
        throw new Error("Invalid accounts data received");
      }

      setAccounts(accountsData);
      return accountsData;
    } catch (err) {
      console.error("Error fetching accounts:", err);
      throw new Error("Failed to fetch accounts");
    }
  };

  const fetchCategories = async () => {
    try {
      const categoryData = await getAllCategoriesForUser();

      if (!Array.isArray(categoryData)) {
        throw new Error("Invalid categories data received");
      }

      setCategories(categoryData);
      return categoryData;
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      throw new Error("Failed to fetch categories");
    }
  };

  const fetchPayments = async () => {
    try {
      const fetchedPayments = await getAllPaymentsUser();

      const paymentsArray = Array.isArray(fetchedPayments)
        ? fetchedPayments
        : [];
      setPayments(paymentsArray);
      return paymentsArray;
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      throw new Error("Failed to fetch payments");
    }
  };

  const refreshPayments = async () => {
    try {
      setError(null);
      await fetchPayments();
    } catch (err) {
      console.error("Error refreshing payments:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh payments"
      );
    }
  };

  const refreshCategories = async () => {
    try {
      setError(null);
    } catch (err) {
      console.error("Error refreshing categories:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh categories"
      );
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setDataLoaded(false);

      try {
        const [paymentsResult, accountsResult, categoriesResult] =
          await Promise.allSettled([
            fetchPayments(),
            fetchAccounts(),
            fetchCategories(),
          ]);

        let hasErrors = false;
        const errors: string[] = [];

        if (paymentsResult.status === "rejected") {
          errors.push("Failed to load payments");
          hasErrors = true;
        }

        if (accountsResult.status === "rejected") {
          errors.push("Failed to load accounts");
          hasErrors = true;
        }

        if (categoriesResult.status === "rejected") {
          errors.push("Failed to load categories");
          hasErrors = true;
        }

        if (hasErrors) {
          setError(errors.join(", "));
        } else {
          setDataLoaded(true);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const isDataReady = () => {
    return (
      dataLoaded &&
      Array.isArray(accounts) &&
      Array.isArray(payments) &&
      Array.isArray(categories) &&
      !loading
    );
  };

  if (loading) {
    return (
      <LoadingState
        title="Loading Payments"
        message="Fetching your payment data..."
        showDataStatus={true}
        dataStatus={[
          {
            label: "Accounts",
            isLoaded: !loading && Array.isArray(accounts),
          },
          {
            label: "Categories",
            isLoaded: !loading && Array.isArray(categories),
          },
          {
            label: "Payments",
            isLoaded: !loading && Array.isArray(payments),
          },
        ]}
      />
    );
  }

  if (error && !isDataReady()) {
    return (
      <ErrorState
        error={error}
        title="Payment Data Error"
        showHomeButton={true}
        onRetry={() => {
          setError(null);
          setLoading(true);
          setDataLoaded(false);
          const loadData = async () => {
            try {
              await Promise.all([
                fetchPayments(),
                fetchAccounts(),
                fetchCategories(),
              ]);
              setDataLoaded(true);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to reload data"
              );
            } finally {
              setLoading(false);
            }
          };
          loadData();
        }}
      />
    );
  }

  if (!isDataReady()) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-700">
            Preparing Data
          </h2>
          <p className="text-gray-500">Almost ready...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-indigo-50">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error} - Some features may not work correctly.
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isSmallScreen ? (
        <div className="flex flex-col flex-1 w-full pt-4">
          <div className="flex w-full mb-3 mt-3 px-4">
            <button
              className={`w-1/2 py-3 font-medium text-center rounded-tl-lg rounded-bl-lg transition-all duration-200 flex items-center justify-center gap-2
                ${
                  activeTab === "income"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              onClick={() => setActiveTab("income")}
            >
              <Wallet size={18} />
              <span>Incoming</span>
            </button>
            <button
              className={`w-1/2 py-3 font-medium text-center rounded-tr-lg rounded-br-lg transition-all duration-200 flex items-center justify-center gap-2
                ${
                  activeTab === "expense"
                    ? "bg-red-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              onClick={() => setActiveTab("expense")}
            >
              <CreditCard size={18} />
              <span>Outgoing</span>
            </button>
          </div>

          <div className="flex-1 px-4 pb-6 overflow-hidden animate-fadeIn">
            {activeTab === "income" ? (
              <IncomingRecurringFunds
                isSmallScreen={isSmallScreen}
                payments={payments}
                accounts={accounts}
                categories={categories}
                onPaymentCreated={refreshPayments}
                onCategoryCreated={refreshCategories}
              />
            ) : (
              <OutgoingRecurringBills
                isSmallScreen={isSmallScreen}
                payments={payments}
                accounts={accounts}
                categories={categories}
                onPaymentCreated={refreshPayments}
                onCategoryCreated={refreshCategories}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 w-full pt-4 px-6 pb-6 gap-6 overflow-hidden mb-16">
          <div className="w-1/2 flex flex-col transform transition-all duration-300 hover:scale-[1.01]">
            <IncomingRecurringFunds
              isSmallScreen={isSmallScreen}
              payments={payments}
              accounts={accounts}
              categories={categories}
              onPaymentCreated={refreshPayments}
              onCategoryCreated={refreshCategories}
            />
          </div>
          <div className="w-1/2 flex flex-col transform transition-all duration-300 hover:scale-[1.01]">
            <OutgoingRecurringBills
              isSmallScreen={isSmallScreen}
              payments={payments}
              accounts={accounts}
              categories={categories}
              onPaymentCreated={refreshPayments}
              onCategoryCreated={refreshCategories}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
