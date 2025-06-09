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
import { getAllCategoriesForUser} from "../services/categoriesService";

const Payments: React.FC = () => {
  const { user } = useAuth();
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<PaymentsInterface[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      return;
    }

    try {
      const accountsData: Account[] = await fetchDefaultAccounts(user.id);

      setAccounts(accountsData);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Failed to fetch accounts");
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const categoryData = await getAllCategoriesForUser(user!.id);
      setCategories(categoryData);
      console;
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const fetchedPayments = await getAllPaymentsUser(user.id);
      console.log("Fetched payments:", fetchedPayments);
      setPayments(fetchedPayments || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setError("Failed to fetch payments");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchPayments(),
          fetchAccounts(),
          fetchCategories(),
        ]);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Loading screen
  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-700">
            Loading Payments
          </h2>
          <p className="text-gray-500">Fetching your payment data...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
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
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-indigo-50">
      {isSmallScreen ? (
        <div className="flex flex-col flex-1 w-full pt-4">
          {/* Mobile Tabs */}
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

          {/* Mobile Content */}
          <div className="flex-1 px-4 pb-6 overflow-hidden animate-fadeIn">
            {activeTab === "income" ? (
              <IncomingRecurringFunds
                isSmallScreen={isSmallScreen}
                payments={payments}
                accounts={accounts}
                categories={categories}
                onPaymentCreated={() => fetchPayments()}
              />
            ) : (
              <OutgoingRecurringBills
                isSmallScreen={isSmallScreen}
                payments={payments}
                accounts={accounts}
                categories={categories}
                onPaymentCreated={() => fetchPayments()}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 w-full pt-4 px-6 pb-6 gap-6 overflow-hidden mb-16">
          {/* Desktop View */}
          <div className="w-1/2 flex flex-col transform transition-all duration-300 hover:scale-[1.01]">
            <IncomingRecurringFunds
              isSmallScreen={isSmallScreen}
              payments={payments}
              accounts={accounts}
              categories={categories}
              onPaymentCreated={() => fetchPayments()}
            />
          </div>
          <div className="w-1/2 flex flex-col transform transition-all duration-300 hover:scale-[1.01]">
            <OutgoingRecurringBills
              isSmallScreen={isSmallScreen}
              payments={payments}
              accounts={accounts}
              categories={categories}
              onPaymentCreated={() => fetchPayments()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
