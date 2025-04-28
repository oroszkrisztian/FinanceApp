import React, { useEffect, useState } from "react";
import ActiveSavingCard from "./ActiveSavingCard";
import { Account } from "../../interfaces/Account";
import { fetchSavings } from "../../services/accountService";
import { motion, AnimatePresence } from "framer-motion";

interface ActiveSavingsGridProps {
  userId: number;
  filterOption: string;
  searchInput: string;
  selectedSearchResult: Account | null;
  sortOrder: "asc" | "desc" | "none";
  sortType: "percentage" | "none";
  activeMenu: string | null;
  setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
  onAddFunds: (id: number) => void;
  onTransfer: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, accountName: string) => void;
  updatedAccountId: number | null;
}

const ActiveSavingsGrid: React.FC<ActiveSavingsGridProps> = ({
  userId,
  filterOption,
  searchInput,
  selectedSearchResult,
  sortOrder,
  sortType,
  activeMenu,
  setActiveMenu,
  onAddFunds,
  onTransfer,
  onEdit,
  onDelete,
  updatedAccountId,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedCardId, setUpdatedCardId] = useState<number | null>(null);

  // Calculate completion percentage for each account
  const calculateProgress = (account: Account): number => {
    if (!account.savingAccount || !account.savingAccount.targetAmount) return 0;
    const currentAmount = account.amount || 0;
    const targetAmount = account.savingAccount.targetAmount;
    return (currentAmount / targetAmount) * 100;
  };

  // Fetch accounts data
  const fetchSavingAccounts = async (accountId?: number): Promise<void> => {
    if (!userId) return;
    setLoading(true);
    try {
      const data: Account[] = await fetchSavings(userId);

      // If updating a specific account, only update that one
      if (accountId && accounts.length > 0) {
        const updatedAccounts = accounts.map((acc) =>
          acc.id === accountId
            ? data.find((newAcc) => newAcc.id === accountId) || acc
            : acc
        );
        setAccounts(updatedAccounts);
        setUpdatedCardId(accountId); // Track the updated card
      } else {
        // Full reload only if needed
        setAccounts(data);
        setUpdatedCardId(null); // Reset if full reload
      }

      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch savings accounts"
      );
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSavingAccounts();
  }, [userId]);

  // Fetch specific account when updatedAccountId changes
  useEffect(() => {
    if (updatedAccountId) {
      fetchSavingAccounts(updatedAccountId);
    }
  }, [updatedAccountId]);

  // Filter accounts based on search and filter options
  useEffect(() => {
    if (accounts.length === 0) {
      setFilteredAccounts([]);
      return;
    }

    // Apply search filter first
    let filtered = accounts;
    if (selectedSearchResult) {
      filtered = [selectedSearchResult];
    } else if (searchInput) {
      filtered = accounts.filter((account) =>
        account.name.toLowerCase().includes(searchInput.toLowerCase())
      );
    }

    // Now apply active/completed filter
    if (filterOption === "active") {
      filtered = filtered.filter(
        (account) => !account.savingAccount?.isCompleted
      );
    }

    // Sort results if needed
    if (sortType === "percentage" && sortOrder !== "none") {
      filtered = [...filtered].sort((a, b) => {
        const progressA = calculateProgress(a);
        const progressB = calculateProgress(b);

        return sortOrder === "asc"
          ? progressA - progressB
          : progressB - progressA;
      });
    }

    setFilteredAccounts(filtered);
  }, [
    accounts,
    searchInput,
    selectedSearchResult,
    filterOption,
    sortOrder,
    sortType,
  ]);

  // Display only active accounts
  const activeAccounts = filteredAccounts.filter(
    (account) => !account.savingAccount?.isCompleted
  );

  // Handle success events from modals
  const handleSuccess = (accountId: number): void => {
    setUpdatedCardId(accountId); // Trigger animation for the updated card
    fetchSavingAccounts(accountId); // Refresh the specific account
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl text-red-600">
        Error loading accounts: {error}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <AnimatePresence>
        {activeAccounts.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{
              y: -5,
              transition: { duration: 0.2 },
            }}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
              ease: "easeOut",
            }}
          >
            <ActiveSavingCard
              account={account}
              index={index}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              onAddFunds={(id) => {
                onAddFunds(id);
                handleSuccess(id);
              }}
              onTransfer={(id) => {
                onTransfer(id);
                handleSuccess(id);
              }}
              onEdit={(id) => {
                onEdit(id);
                handleSuccess(id);
              }}
              onDelete={onDelete}
              updatedSavingId={updatedAccountId}
              isUpdated={account.id === updatedCardId} // Pass animation trigger
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActiveSavingsGrid;
