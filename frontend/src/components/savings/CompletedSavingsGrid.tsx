import React, { useEffect, useState } from "react";
import CompletedSavingCard from "./CompletedSavingCard";
import { Account } from "../../interfaces/Account";
import { fetchSavings } from "../../services/accountService";
import { motion, AnimatePresence } from "framer-motion";

interface CompletedSavingsGridProps {
  userId: number;
  filterOption: string;
  searchInput: string;
  selectedSearchResult: Account | null;
  onDelete: (id: number, accountName: string) => void;
}

const CompletedSavingsGrid: React.FC<CompletedSavingsGridProps> = ({
  userId,
  filterOption,
  searchInput,
  selectedSearchResult,
  onDelete,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletedAccounts = async (): Promise<void> => {
    if (!userId) return;
    setLoading(true);
    try {
      const data: Account[] = await fetchSavings(userId);
      setAccounts(data);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch completed accounts"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedAccounts();
  }, [userId]);

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

    filtered = filtered.filter((account) => account.savingAccount?.isCompleted);

    setFilteredAccounts(filtered);
  }, [accounts, searchInput, selectedSearchResult]);

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

  if (filteredAccounts.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <AnimatePresence>
        {filteredAccounts.map((account, index) => (
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
            <CompletedSavingCard
              key={account.id}
              account={account}
              index={index}
              onDelete={onDelete}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default CompletedSavingsGrid;
