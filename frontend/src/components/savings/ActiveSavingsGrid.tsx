import React, { useEffect, useState } from "react";
import ActiveSavingCard from "./ActiveSavingCard";
import { Account } from "../../interfaces/Account";
import { fetchSavings } from "../../services/accountService";
import { motion, AnimatePresence } from "framer-motion";

interface ActiveSavingsGridProps {
  filterOption: string;
  searchInput: string;
  selectedSearchResult: Account | null;
  sortOrder: "asc" | "desc" | "none";
  sortType: "percentage" | "none";
  activeMenu: string | null;
  setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
  onAddFunds: (account: Account) => void;
  onTransfer: (account: Account) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, accountName: string) => void;
  updatedAccountId: number | null;
  refetchTrigger: number;
}

const ActiveSavingsGrid: React.FC<ActiveSavingsGridProps> = ({
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
  refetchTrigger,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedCardId, setUpdatedCardId] = useState<number | null>(null);

  const calculateProgress = (account: Account): number => {
    if (!account.savingAccount || !account.savingAccount.targetAmount) return 0;
    const currentAmount = account.amount || 0;
    const targetAmount = account.savingAccount.targetAmount;
    return (currentAmount / targetAmount) * 100;
  };

  const fetchSavingAccounts = async (accountId?: number): Promise<void> => {
    setLoading(true);
    try {
      const data: Account[] = await fetchSavings();

      if (accountId && accounts.length > 0) {
        const updatedAccounts = accounts.map((acc) =>
          acc.id === accountId
            ? data.find((newAcc) => newAcc.id === accountId) || acc
            : acc
        );
        setAccounts(updatedAccounts);
        setUpdatedCardId(accountId);
      } else {
        setAccounts(data);
        setUpdatedCardId(null);
      }

      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch savings accounts"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavingAccounts();
  }, []);

  useEffect(() => {
    if (updatedAccountId) {
      fetchSavingAccounts(updatedAccountId);
    }
  }, [updatedAccountId]);

  useEffect(() => {
    if (refetchTrigger > 0) {
      fetchSavingAccounts();
    }
  }, [refetchTrigger]);

  useEffect(() => {
    if (accounts.length === 0) {
      setFilteredAccounts([]);
      return;
    }

    let filtered = accounts;
    if (selectedSearchResult) {
      filtered = [selectedSearchResult];
    } else if (searchInput) {
      filtered = accounts.filter((account) =>
        account.name.toLowerCase().includes(searchInput.toLowerCase())
      );
    }

    if (filterOption === "active") {
      filtered = filtered.filter(
        (account) => !account.savingAccount?.isCompleted
      );
    }

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

  const activeAccounts = filteredAccounts.filter(
    (account) => !account.savingAccount?.isCompleted
  );

  const handleSuccess = (accountId: number): void => {
    setUpdatedCardId(accountId);
    fetchSavingAccounts(accountId);
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
              onAddFunds={(account) => {
                onAddFunds(account);
                handleSuccess(account.id);
              }}
              onTransfer={(account) => {
                onTransfer(account);
                handleSuccess(account.id);
              }}
              onEdit={(id) => {
                onEdit(id);
                handleSuccess(id);
              }}
              onDelete={onDelete}
              updatedSavingId={updatedAccountId}
              isUpdated={account.id === updatedCardId}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActiveSavingsGrid;
