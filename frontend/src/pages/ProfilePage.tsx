import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  deleteDefaultAccount,
  fetchDefaultAccounts,
} from "../services/accountService";
import { AccountType } from "../interfaces/enums";
import { motion, AnimatePresence } from "framer-motion";
import "../globals.css";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { Account } from "../interfaces/Account";
import UserProfileCard from "../components/profile/UserProfileCard";
import AccountsSection from "../components/profile/AccountsSection";
import { AlertCircle, X } from "lucide-react";

interface DeleteConfirmation {
  isOpen: boolean;
  accountId: string | number | null;
  accountName: string;
  confirmText: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation>({
      isOpen: false,
      accountId: null,
      accountName: "",
      confirmText: "",
    });

  // Enhanced mobile detection
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const fetchUserAccounts = async (): Promise<void> => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const startTime: number = Date.now();
    try {
      const defaultAccountsData: Account[] = await fetchDefaultAccounts(user.id);
      const elapsedTime: number = Date.now() - startTime;
      const remainingTime: number = Math.max(0, 300 - elapsedTime);
      setAccounts(defaultAccountsData);
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
    } finally {
      const elapsedTime: number = Date.now() - startTime;
      const remainingTime: number = Math.max(0, 300 - elapsedTime);
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  useEffect(() => {
    fetchUserAccounts();
  }, [user?.id, refreshTrigger]);

  const refreshAccounts = (): void => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteRequest = (
    accountId: string | number,
    accountName: string
  ): void => {
    setDeleteConfirmation({
      isOpen: true,
      accountId,
      accountName,
      confirmText: "",
    });
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!user?.id || !deleteConfirmation.accountId) return;

    setLoading(true);
    setDeleteConfirmation({
      isOpen: false,
      accountId: null,
      accountName: "",
      confirmText: "",
    });

    try {
      await deleteDefaultAccount(user.id, Number(deleteConfirmation.accountId));
      console.log(
        `Account with ID ${deleteConfirmation.accountId} deleted successfully.`
      );
      refreshAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      accountId: null,
      accountName: "",
      confirmText: "",
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <>
      <div className={`min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 ${isMobileView ? "p-4 pb-20" : "p-8 pb-20"}`}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${isMobileView ? "mb-4" : "mb-6"}`}
        >
          <h1 className={`font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-700 ${isMobileView ? "text-2xl" : "text-3xl"}`}>
            My Profile
          </h1>
          <p className={`text-gray-600 ${isMobileView ? "text-sm mt-1" : "mt-2"}`}>
            Manage your personal information and accounts
          </p>
        </motion.div>

        {/* User Profile Card */}
        <UserProfileCard />

        {/* Accounts Section */}
        <AccountsSection
          accounts={accounts}
          loading={loading}
          onRefresh={refreshAccounts}
          onDeleteRequest={handleDeleteRequest}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={handleCancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
                isMobileView
                  ? "max-w-sm w-full max-h-[95vh]"
                  : "max-w-md w-full max-h-[90vh]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Enhanced Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-800 text-white">
                {/* Mobile-optimized background elements */}
                <div
                  className={`absolute top-0 right-0 bg-white/20 rounded-full ${
                    isMobileView
                      ? "w-12 h-12 -translate-y-6 translate-x-6"
                      : "w-16 h-16 -translate-y-8 translate-x-8"
                  }`}
                ></div>
                <div
                  className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${
                    isMobileView
                      ? "w-8 h-8 translate-y-4 -translate-x-4"
                      : "w-12 h-12 translate-y-6 -translate-x-6"
                  }`}
                ></div>
                <div
                  className={`absolute bg-white/15 rounded-full ${
                    isMobileView
                      ? "top-2 left-16 w-6 h-6"
                      : "top-2 left-16 w-8 h-8"
                  }`}
                ></div>
                <div
                  className={`absolute bg-white/10 rounded-full ${
                    isMobileView
                      ? "bottom-2 right-12 w-4 h-4"
                      : "bottom-2 right-12 w-6 h-6"
                  }`}
                ></div>

                <div className={`relative z-10 ${isMobileView ? "p-3" : "p-4"}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`bg-white text-red-600 rounded-full shadow-lg ${
                          isMobileView ? "p-1.5 w-7 h-7" : "p-1.5 w-10 h-10"
                        } flex items-center justify-center`}
                      >
                        <AlertCircle size={isMobileView ? 14 : 18} />
                      </div>
                      <div>
                        <h2 className={`font-semibold ${isMobileView ? "text-base" : "text-lg"}`}>
                          Delete Account
                        </h2>
                        <p className={`opacity-90 ${isMobileView ? "text-xs" : "text-sm"}`}>
                          This action cannot be undone
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={handleCancelDelete}
                      className="text-white/80 hover:text-white transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={isMobileView ? 20 : 20} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className={`${isMobileView ? "p-3" : "p-4"} flex-1`}>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                    <p className="text-red-800 text-sm">
                      Are you sure you want to delete the account{" "}
                      <span className="font-semibold">
                        {deleteConfirmation.accountName}
                      </span>
                      ? This action cannot be undone.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To confirm, please type{" "}
                      <span className="font-semibold text-red-600">Delete</span>{" "}
                      below:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation.confirmText}
                      onChange={(e) =>
                        setDeleteConfirmation({
                          ...deleteConfirmation,
                          confirmText: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                      placeholder="Type 'Delete' to confirm"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 flex gap-2`}>
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmation.confirmText !== "Delete"}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  <AlertCircle size={16} />
                  Delete Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProfilePage;