import { useEffect, useState } from "react";
import { fetchDefaultAccounts } from "../services/accountService";
import { motion } from "framer-motion";
import "../globals.css";
import ErrorState from "../components/ErrorState";
import { Account } from "../interfaces/Account";
import UserProfileCard from "../components/profile/UserProfileCard";
import AccountsSection from "../components/profile/AccountsSection";
import DeleteDefaultAccountModal from "../components/profile/DeleteDefaultAccountModal";
import LoadingState from "../components/LoadingState";

interface DeleteRequest {
  isOpen: boolean;
  accountId: number | null;
  accountName: string;
}

const ProfilePage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest>({
    isOpen: false,
    accountId: null,
    accountName: "",
  });
  const [forceCloseDropdowns, setForceCloseDropdowns] = useState<number>(0);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const fetchUserAccounts = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const startTime: number = Date.now();
    try {
      const defaultAccountsData: Account[] = await fetchDefaultAccounts();
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
  }, [refreshTrigger]);

  const refreshAccounts = (): void => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const [pendingDeleteRequest, setPendingDeleteRequest] = useState<{
    accountId: number;
    accountName: string;
  } | null>(null);

  useEffect(() => {
    if (pendingDeleteRequest) {
      const timer = setTimeout(() => {
        setDeleteRequest({
          isOpen: true,
          accountId: pendingDeleteRequest.accountId,
          accountName: pendingDeleteRequest.accountName,
        });
        setPendingDeleteRequest(null);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [pendingDeleteRequest]);

  const handleDeleteRequest = (
    accountId: string | number,
    accountName: string
  ): void => {
    setForceCloseDropdowns((prev) => prev + 1);
    setPendingDeleteRequest({
      accountId: Number(accountId),
      accountName,
    });
  };

  const handleEditRequest = (): void => {
    setForceCloseDropdowns((prev) => prev + 1);
  };

  const handleDeleteSuccess = (): void => {
    refreshAccounts();
    setDeleteRequest({
      isOpen: false,
      accountId: null,
      accountName: "",
    });
  };

  const handleCloseDeleteModal = (): void => {
    setDeleteRequest({
      isOpen: false,
      accountId: null,
      accountName: "",
    });
  };

  if (loading) {
    return (
      <LoadingState
        title="Loading Profile"
        message="Loading your profile information..."
        showDataStatus={true}
        dataStatus={[
          {
            label: "Accounts",
            isLoaded: !loading && Array.isArray(accounts),
          },
          {
            label: "User Profile",
            isLoaded: !loading,
          },
        ]}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Profile Loading Error"
        showHomeButton={true}
        onRetry={() => {
          fetchUserAccounts();
        }}
      />
    );
  }

  return (
    <>
      <div
        className={`min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 ${isMobileView ? "p-4 pb-20" : "p-8 pb-20"}`}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${isMobileView ? "mb-4" : "mb-6"}`}
        >
          <h1
            className={`font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-700 ${isMobileView ? "text-2xl" : "text-3xl"}`}
          >
            My Profile
          </h1>
          <p
            className={`text-gray-600 ${isMobileView ? "text-sm mt-1" : "mt-2"}`}
          >
            Manage your personal information and accounts
          </p>
        </motion.div>

        <UserProfileCard />

        <AccountsSection
          accounts={accounts}
          loading={loading}
          onRefresh={refreshAccounts}
          onDeleteRequest={handleDeleteRequest}
          onEditRequest={handleEditRequest}
          forceCloseDropdowns={forceCloseDropdowns}
        />
      </div>

      <DeleteDefaultAccountModal
        isOpen={deleteRequest.isOpen}
        onClose={handleCloseDeleteModal}
        defaultAccounts={accounts}
        accountId={deleteRequest.accountId || 0}
        accountName={deleteRequest.accountName}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default ProfilePage;
