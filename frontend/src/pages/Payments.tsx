import React, { useState, useEffect } from "react";
import IncomingRecurringFunds from "../components/payments/IncomingRecurringFunds";
import OutgoingRecurringBills from "../components/payments/OutgoingRecurringBills";
import { getAllPaymentsUser } from "../services/paymentService";
import { Payments as PaymentsInterface } from "../interfaces/Payments";

import { Wallet, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Account } from "../interfaces/Account";
import { AccountType } from "../interfaces/enums";
import {
  fetchAllAccounts,
  fetchDefaultAccounts,
} from "../services/accountService";
import { CustomCategory } from "../interfaces/CustomCategory";
import { getAllCategoriesForUser } from "../services/categoriesService";

const Payments: React.FC = () => {
  const { user } = useAuth();
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
    if (!user?.id) {
      throw new Error("User ID not available");
    }

    try {
      console.log("Fetching accounts for user:", user.id);
      const accountsData: Account[] = await fetchDefaultAccounts(user.id);
      console.log("Accounts fetched:", accountsData);

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
    if (!user?.id) {
      throw new Error("User ID not available");
    }

    try {
      console.log("Fetching categories for user:", user.id);
      const categoryData = await getAllCategoriesForUser(user.id);
      console.log("Categories fetched:", categoryData);

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
    if (!user?.id) {
      throw new Error("User ID not available");
    }

    try {
      console.log("Fetching payments for user:", user.id);
      const fetchedPayments = await getAllPaymentsUser(user.id);
      console.log("Payments fetched:", fetchedPayments);

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
      const updatedCategories = await fetchCategories();
      console.log("Categories refreshed:", updatedCategories);
    } catch (err) {
      console.error("Error refreshing categories:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh categories"
      );
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        setDataLoaded(false);
        return;
      }

      setLoading(true);
      setError(null);
      setDataLoaded(false);

      try {
        console.log("Starting data load for user:", user.id);

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
          console.log("All data loaded successfully");
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
  }, [user?.id]);

  const isDataReady = () => {
    return (
      dataLoaded &&
      Array.isArray(accounts) &&
      Array.isArray(payments) &&
      Array.isArray(categories) &&
      !loading
    );
  };

  if (!user) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gray-100 p-4 rounded-full">
            <Wallet size={32} className="text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            Authentication Required
          </h2>
          <p className="text-gray-500">Please log in to view your payments.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-700">
            Loading Payments
          </h2>
          <p className="text-gray-500">Fetching your payment data...</p>
          <div className="text-xs text-gray-400 mt-2 space-y-1">
            <div>
              • Accounts:{" "}
              {Array.isArray(accounts) && accounts.length > 0 ? "✓" : "⏳"}
            </div>
            <div>
              • Categories:{" "}
              {Array.isArray(categories) && categories.length >= 0 ? "✓" : "⏳"}
            </div>
            <div>
              • Payments:{" "}
              {Array.isArray(payments) && payments.length >= 0 ? "✓" : "⏳"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isDataReady()) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-red-100 p-4 rounded-full">
            <CreditCard size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            Error Loading Data
          </h2>
          <p className="text-gray-500 max-w-md">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                setDataLoaded(false);
                setTimeout(() => {
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
                        err instanceof Error
                          ? err.message
                          : "Failed to reload data"
                      );
                    } finally {
                      setLoading(false);
                    }
                  };
                  loadData();
                }, 100);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reload Data
            </button>
          </div>
        </div>
      </div>
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

  console.log("Rendering components with data:", {
    accounts: accounts.length,
    categories: categories.length,
    payments: payments.length,
    dataLoaded,
  });

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
