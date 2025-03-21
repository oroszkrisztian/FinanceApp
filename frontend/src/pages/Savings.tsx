import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSavings, searchAccount } from "../services/accountService";
import { motion, AnimatePresence } from "framer-motion";
import CreateSavingAccountPopup from "../components/accounts/CreateSavingAccountPopup";
import EditSavingAccountPopup from "../components/accounts/EditSavingAccountPopup";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import AddFundsSavingPopup from "../components/savings/AddFundsSavinPopup";
import SavingsEmptyState from "../components/savings/SavingsEmptyState";
import ActiveSavingCard from "../components/savings/ActiveSavingCard";
import CompletedSavingCard from "../components/savings/CompletedSavingCard";
import { Account } from "../interfaces/Account";

type FilterOption = "all" | "active" | "completed";

const Savings: React.FC = () => {
  const [savingsAccounts, setSavingsAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] =
    useState<boolean>(false);
  const [selectedSavingAccount, setSelectedSavingAccount] =
    useState<Account | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const [filterLoading, setFilterLoading] = useState<boolean>(false);

  const fetchSavingAccounts = async (): Promise<void> => {
    if (!user?.id) return;

    const startTime = Date.now();
    setLoading(true);

    try {
      const data: Account[] = await fetchSavings(user.id);
      setSavingsAccounts(data);
      setFilteredAccounts(data);

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch savings accounts"
      );

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  useEffect(() => {
    fetchSavingAccounts();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        if (searchTerm.trim() === "") {
          setFilteredAccounts(savingsAccounts);
        } else {
          const data: Account[] = await searchAccount(user.id, searchTerm);
          setFilteredAccounts(data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to search savings accounts"
        );
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user?.id, savingsAccounts]);

  const handleEdit = (accountId: number): void => {
    const account = savingsAccounts.find((acc) => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      setIsEditModalOpen(true);
      setActiveMenu(null);
    }
  };

  const getFilteredAccounts = () => {
    if (filterOption === "all") {
      return filteredAccounts;
    } else if (filterOption === "active") {
      return filteredAccounts.filter(
        (account) => !account.savingAccount?.isCompleted
      );
    } else {
      return filteredAccounts.filter(
        (account) => account.savingAccount?.isCompleted
      );
    }
  };

  const handleFilterChange = (option: FilterOption) => {
    setFilterLoading(true);
    setFilterOption(option);
    setFilterMenuOpen(false);

    setTimeout(() => {
      setFilterLoading(false);
    }, 500);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFilterMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setFilterMenuOpen(false);
    };

    if (filterMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { passive: true });

      if (contentAreaRef.current) {
        contentAreaRef.current.addEventListener("scroll", handleScroll, {
          passive: true,
        });
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);

      if (contentAreaRef.current) {
        contentAreaRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [filterMenuOpen]);

  const handleDeleteRequest = (
    accountId: number,
    accountName: string
  ): void => {
    console.log("Delete account:", accountId, accountName);
    setActiveMenu(null);
  };

  const handleCreateSavings = (): void => {
    setIsCreateModalOpen(true);
  };

  const handleAddFunds = (accountId: number): void => {
    const account = savingsAccounts.find((acc) => acc.id === accountId);
    if (account) {
      setSelectedSavingAccount(account);
      setIsAddFundsModalOpen(true);
      setActiveMenu(null);
    }
  };

  const handleSuccess = (): void => {
    fetchSavingAccounts();
  };

  const displayAccounts = getFilteredAccounts();
  const activeAccounts = filteredAccounts.filter(
    (account) => !account.savingAccount?.isCompleted
  );

  const completedAccounts = filteredAccounts.filter(
    (account) => account.savingAccount?.isCompleted
  );

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50">
      {/* Header with Search and Filter */}
      {!loading && savingsAccounts.length > 0 && (
        <div className="sticky top-0 z-10 p-3 md:p-6 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-indigo-100"
          >
            {/* Search and Filter Container */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
              {/* Search Input */}
              <div className="relative w-full sm:w-64 lg:w-80">
                <input
                  type="text"
                  placeholder="Search goals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
                />
                <svg
                  className="absolute left-3 top-3 h-5 w-5 text-indigo-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Filter Dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  className="w-full sm:w-auto px-3 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 focus:outline-none transition-colors relative flex items-center justify-between sm:justify-start"
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    <span className="font-medium">
                      {filterOption === "all"
                        ? "All Goals"
                        : filterOption === "active"
                          ? "Active"
                          : "Completed"}
                    </span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 ml-1 transition-transform duration-200 ${
                      filterMenuOpen ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {filterMenuOpen && (
                  <div
                    className="absolute sm:right-0 left-0 sm:left-auto mt-1 bg-white rounded-lg shadow-lg border border-indigo-100 z-50 w-full sm:w-48"
                    ref={dropdownRef}
                  >
                    <div className="py-1">
                      <button
                        className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                          filterOption === "all"
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-gray-700 hover:bg-indigo-50"
                        } transition-colors`}
                        onClick={() => handleFilterChange("all")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 mr-3 ${
                            filterOption === "all"
                              ? "text-indigo-600"
                              : "text-gray-500"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                        <span>All Goals</span>
                      </button>

                      <button
                        className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                          filterOption === "active"
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-gray-700 hover:bg-indigo-50"
                        } transition-colors`}
                        onClick={() => handleFilterChange("active")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 mr-3 ${
                            filterOption === "active"
                              ? "text-indigo-600"
                              : "text-gray-500"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Active Goals</span>
                      </button>

                      <button
                        className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                          filterOption === "completed"
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-gray-700 hover:bg-indigo-50"
                        } transition-colors`}
                        onClick={() => handleFilterChange("completed")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 mr-3 ${
                            filterOption === "completed"
                              ? "text-indigo-600"
                              : "text-gray-500"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Completed Goals</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Create Button */}
            <motion.button
              onClick={handleCreateSavings}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center whitespace-nowrap"
            >
              <svg
                className="w-5 h-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="hidden xs:inline">Create</span> Goal
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto" ref={contentAreaRef}>
        {/* Filter Loading */}
        {filterLoading && (
          <div className="absolute inset-0 bg-white/80 flex justify-center items-center z-20 ">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-black-200 border-t-black-600 rounded-full animate-spin"></div>
              <p className="mt-2 text-black-600 font-medium">
                Filtering goals...
              </p>
            </div>
          </div>
        )}
        {/* Empty State */}
        {!loading && savingsAccounts.length === 0 && (
          <div className="flex justify-center items-center p-4 sm:p-8">
            <SavingsEmptyState onCreateSavings={handleCreateSavings} />
          </div>
        )}

        {/* No Search Results */}
        {!loading &&
          filteredAccounts.length === 0 &&
          searchTerm &&
          savingsAccounts.length > 0 && (
            <div className="p-3 sm:p-4 md:px-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-md text-center mb-4"
              >
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-400 mx-auto mb-3 sm:mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  No results found
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  We couldn't find any savings accounts matching "{searchTerm}".
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilteredAccounts(savingsAccounts);
                  }}
                  className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                >
                  Clear search
                </button>
              </motion.div>
            </div>
          )}

        {/* Savings Accounts Grid */}
        {!loading && displayAccounts.length > 0 && (
          <div className="p-3  md:px-6 pt-2 pb-16 sm:pb-20">
            {/* Active Goals Section */}
            {filterOption !== "completed" && activeAccounts.length > 0 && (
              <div className="mb-5 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">
                  Active Goals
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`active-${searchTerm}-${filterOption}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="contents"
                    >
                      {activeAccounts.map((account, index) => (
                        <ActiveSavingCard
                          key={account.id}
                          account={account}
                          index={index}
                          activeMenu={activeMenu}
                          setActiveMenu={setActiveMenu}
                          onAddFunds={handleAddFunds}
                          onEdit={handleEdit}
                          onDelete={handleDeleteRequest}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Completed Goals Section */}
            {filterOption !== "active" && completedAccounts.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">
                  Completed Goals
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`completed-${searchTerm}-${filterOption}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="contents"
                    >
                      {completedAccounts.map((account, index) => (
                        <CompletedSavingCard
                          key={account.id}
                          account={account}
                          index={index}
                          onDelete={handleDeleteRequest}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* No Goals Found For Filter */}
            {displayAccounts.length === 0 && (
              <div className="text-center p-4 sm:p-8">
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  No {filterOption !== "all" ? filterOption : ""} goals found
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {filterOption === "active"
                    ? "You don't have any active goals at the moment."
                    : filterOption === "completed"
                      ? "You haven't completed any goals yet."
                      : "No goals match your current search."}
                </p>
                {filterOption !== "all" && (
                  <button
                    onClick={() => setFilterOption("all")}
                    className="mt-3 sm:mt-4 text-indigo-600 hover:text-indigo-800 text-sm sm:text-base"
                  >
                    Show all goals
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateSavingAccountPopup
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {isAddFundsModalOpen && selectedSavingAccount && (
        <AddFundsSavingPopup
          isOpen={isAddFundsModalOpen}
          onClose={() => setIsAddFundsModalOpen(false)}
          account={selectedSavingAccount}
          onSuccess={handleSuccess}
        />
      )}

      <AnimatePresence>
        {isEditModalOpen && selectedAccount && (
          <EditSavingAccountPopup
            setIsModalOpen={setIsEditModalOpen}
            account={selectedAccount}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Savings;
