import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchDefaultAccounts, fetchSavings } from "../services/accountService";
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
import DeleteSavingAccountModal from "../components/savings/DeletSavingPopup";
import { createPortal } from "react-dom";
import TransferFundsModal from "../components/savings/TransferFundsModal";

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
  const [searchInput, setSearchInput] = useState<string>("");
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [selectedSearchResult, setSelectedSearchResult] =
    useState<Account | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] =
    useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] =
    useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedSavingAccount, setSelectedSavingAccount] =
    useState<Account | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
  const [filterLoading, setFilterLoading] = useState<boolean>(false);
  const [defaultAccounts, setDefaultAccounts] = useState<Account[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const [sortMenuOpen, setSortMenuOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  type SortOrder = "none" | "asc" | "desc";
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [sortType, setSortType] = useState<"percentage" | "none">("none");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setIsMobileScreen(true);
        setShowFilters(false);
      } else {
        setIsMobileScreen(false);
        setShowFilters(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const fetchDefaultAccountsFr = async (): Promise<void> => {
    if (!user?.id) return;
    const startTime = Date.now();
    setLoading(true);
    try {
      const data: Account[] = await fetchDefaultAccounts(user.id);

      setDefaultAccounts(data);
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

  const fetchSavingAccounts = async (): Promise<void> => {
    if (!user?.id) return;
    const startTime = Date.now();
    setLoading(true);
    try {
      const data: Account[] = await fetchSavings(user.id);
      //const emptyData : any[] = [];
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
    fetchDefaultAccountsFr();
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFilterMenuOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setSortMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setShowSearchDropdown(false);
      setFilterMenuOpen(false);
      setSortMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });
    if (contentAreaRef.current) {
      contentAreaRef.current.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      if (contentAreaRef.current) {
        contentAreaRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setSelectedSearchResult(null);
    setShowSearchDropdown(true);
  };

  useEffect(() => {
    if (searchInput.trim() === "" && !selectedSearchResult) {
      setFilteredAccounts(savingsAccounts);
    } else if (selectedSearchResult) {
      setFilteredAccounts([selectedSearchResult]);
    } else {
      const filtered = savingsAccounts.filter((account) =>
        account.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  }, [searchInput, savingsAccounts, selectedSearchResult]);

  const selectSearchResult = (account: Account) => {
    setSelectedSearchResult(account);
    setSearchInput("");
    setShowSearchDropdown(false);
    setFilteredAccounts([account]);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSelectedSearchResult(null);
    setFilteredAccounts(savingsAccounts);
  };

  const calculateProgress = (account: Account): number => {
    if (!account.savingAccount || !account.savingAccount.targetAmount) return 0;
    const currentAmount = account.amount || 0;
    const targetAmount = account.savingAccount.targetAmount;
    return (currentAmount / targetAmount) * 100;
  };

  const handleEdit = (accountId: number): void => {
    const account = savingsAccounts.find((acc) => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      setIsEditModalOpen(true);
      setActiveMenu(null);
    }
  };

  const getFilteredAccounts = () => {
    let accounts = [...filteredAccounts];

    if (filterOption === "active") {
      accounts = accounts.filter(
        (account) => !account.savingAccount?.isCompleted
      );
    } else if (filterOption === "completed") {
      accounts = accounts.filter(
        (account) => account.savingAccount?.isCompleted
      );
    }

    if (sortType === "percentage" && sortOrder !== "none") {
      accounts = accounts
        .filter((account) => !account.savingAccount?.isCompleted)
        .sort((a, b) => {
          const progressA = calculateProgress(a);
          const progressB = calculateProgress(b);

          return sortOrder === "asc"
            ? progressA - progressB
            : progressB - progressA;
        });
    } else if (sortOrder !== "none" && sortType === "none") {
      accounts.sort((a, b) => {
        if (!a.savingAccount || !b.savingAccount) return 0;

        const progressA = calculateProgress(a);
        const progressB = calculateProgress(b);

        return sortOrder === "asc"
          ? progressA - progressB
          : progressB - progressA;
      });
    }

    return accounts;
  };

  const handleSortChange = (order: SortOrder, type: "percentage" | "none") => {
    setFilterLoading(true);
    setSortOrder(order);
    setSortMenuOpen(false);
    setSortType(type);
    setTimeout(() => {
      setFilterLoading(false);
    }, 500);
  };

  const handleFilterChange = (option: FilterOption) => {
    setFilterLoading(true);
    setFilterOption(option);
    setFilterMenuOpen(false);
    // Reset sorting when switching to completed goals
    if (option === "completed") {
      setSortType("none");
      setSortOrder("none");
    }
    setTimeout(() => {
      setFilterLoading(false);
    }, 500);
  };

  const handleDelete = (accountId: number): void => {
    const account = savingsAccounts.find((acc) => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      setIsDeleteModalOpen(true);
      setActiveMenu(null);
    }
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

  const handleTransfer = (accountId: number): void => {
    const account = savingsAccounts.find((acc) => acc.id === accountId);
    if (account) {
      setSelectedSavingAccount(account);
      setIsTransferModalOpen(true);
      setActiveMenu(null);
    }
  };

  const handleSuccess = (): void => {
    fetchSavingAccounts();
    fetchDefaultAccountsFr();
    setSelectedSearchResult(null);
  };

  const displayAccounts = getFilteredAccounts();
  const activeAccounts = displayAccounts.filter(
    (account) => !account.savingAccount?.isCompleted
  );
  const completedAccounts = displayAccounts.filter(
    (account) => account.savingAccount?.isCompleted
  );

  const searchResults = savingsAccounts.filter((account) =>
    account.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50">
      {!loading && savingsAccounts.length > 0 && (
        <div className="sticky top-0 z-10 p-3 md:p-6 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-indigo-100"
          >
            {isMobileScreen && (
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto justify-between px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md flex items-center whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
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
                  <span>Filters</span>
                </div>

                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
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
                </motion.div>
              </motion.button>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
              {showFilters && (
                <div
                  ref={searchRef}
                  className="relative w-full sm:w-64 lg:w-80"
                >
                  <div
                    className="flex items-center bg-indigo-50 border border-indigo-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent"
                    onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                  >
                    <div className="px-3 text-indigo-400">
                      <svg
                        className="h-5 w-5"
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

                    <input
                      ref={searchInputRef}
                      type="text"
                      className="w-full py-2.5 bg-transparent outline-none text-gray-900 font-medium"
                      placeholder="Search goals..."
                      value={
                        selectedSearchResult
                          ? selectedSearchResult.name
                          : searchInput
                      }
                      onChange={handleSearchInputChange}
                      onClick={() => {
                        setShowSearchDropdown(true);
                        setSearchInput("");
                      }}
                    />

                    {(searchInput || selectedSearchResult) && (
                      <button
                        type="button"
                        className="px-3 text-indigo-400 hover:text-indigo-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSearch();
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}

                    <div className="px-2 text-indigo-400">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${showSearchDropdown ? "transform rotate-180" : ""}`}
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
                    </div>
                  </div>

                  {showSearchDropdown && savingsAccounts.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-indigo-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No matching goals found
                        </div>
                      ) : (
                        searchResults.map((account, index) => (
                          <div
                            key={account.id}
                            className={`px-4 py-3 hover:bg-indigo-50 cursor-pointer ${
                              selectedSearchResult?.id === account.id
                                ? "bg-indigo-50"
                                : ""
                            } ${
                              index === searchResults.length - 1
                                ? ""
                                : "border-b border-indigo-100"
                            }`}
                            onClick={() => selectSearchResult(account)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700">
                                {account.name}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  account.savingAccount?.isCompleted
                                    ? "bg-green-100 text-green-700"
                                    : "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                {account.savingAccount?.isCompleted
                                  ? "Completed"
                                  : "Active"}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Filter Button */}
              {showFilters && (
                <div className="relative justify-items-stretch w-full sm:w-auto">
                  <div ref={dropdownRef}>
                    <button
                      onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                      className="w-full sm:w-auto px-3 py-2.5 bg-white-50 border border-black text-black rounded-lg hover:bg-gray-100 focus:outline-none transition-colors relative flex items-center justify-between sm:justify-start"
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
                            ? "All "
                            : filterOption === "active"
                              ? "Active"
                              : "Completed"}
                        </span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ml-1 transition-transform duration-200 ${filterMenuOpen ? "transform rotate-180" : ""}`}
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
                      <div className="absolute sm:right-0 left-0 sm:left-auto mt-1 bg-white rounded-lg shadow-lg border border-indigo-100 z-50 w-full sm:w-48">
                        <div className="py-1">
                          <button
                            className={`flex items-center w-full text-left px-4 py-2 text-sm ${filterOption === "all" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-indigo-50"} transition-colors`}
                            onClick={() => handleFilterChange("all")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 mr-3 ${filterOption === "all" ? "text-indigo-600" : "text-gray-500"}`}
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
                            className={`flex items-center w-full text-left px-4 py-2 text-sm ${filterOption === "active" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-indigo-50"} transition-colors`}
                            onClick={() => handleFilterChange("active")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 mr-3 ${filterOption === "active" ? "text-indigo-600" : "text-gray-500"}`}
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
                            className={`flex items-center w-full text-left px-4 py-2 text-sm ${filterOption === "completed" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-indigo-50"} transition-colors`}
                            onClick={() => handleFilterChange("completed")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 mr-3 ${filterOption === "completed" ? "text-indigo-600" : "text-gray-500"}`}
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
              )}

              {/* Sort Button */}
              {showFilters && (
                <div className="relative w-full sm:w-auto">
                  <div ref={sortDropdownRef}>
                    <button
                      onClick={() => setSortMenuOpen(!sortMenuOpen)}
                      className="w-full sm:w-auto px-3 py-2.5 bg-white-50 border border-black text-black rounded-lg hover:bg-gray-100 focus:outline-none transition-colors relative flex items-center justify-between sm:justify-start"
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
                        <span className="font-medium">Sort</span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ml-1 transition-transform duration-200 ${sortMenuOpen ? "transform rotate-180" : ""}`}
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
                    {sortMenuOpen && (
                      <div className="absolute sm:right-0 left-0 sm:left-auto mt-1 bg-white rounded-lg shadow-lg border border-indigo-100 z-50 w-full sm:w-48">
                        <div className="py-1">
                          <button
                            className={`flex items-center w-full text-left px-4 py-2 text-sm ${sortOrder === "asc" && sortType === "percentage" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-indigo-50"} transition-colors`}
                            onClick={() =>
                              handleSortChange("asc", "percentage")
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 mr-3 ${sortOrder === "asc" && sortType === "percentage" ? "text-indigo-600" : "text-gray-500"}`}
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
                            <span>Lowest %</span>
                          </button>

                          <button
                            className={`flex items-center w-full text-left px-4 py-2 text-sm ${sortOrder === "desc" && sortType === "percentage" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-indigo-50"} transition-colors`}
                            onClick={() =>
                              handleSortChange("desc", "percentage")
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 mr-3 ${sortOrder === "desc" && sortType === "percentage" ? "text-indigo-600" : "text-gray-500"}`}
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
                            <span>Highest % </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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

      <div className="flex-1 overflow-auto" ref={contentAreaRef}>
        {filterLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex justify-center items-center z-20 transition-opacity duration-300 ease-in-out">
            <div className="flex flex-col items-center bg-white/80 p-4 rounded-xl shadow-md">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="mt-3 text-indigo-600 font-medium">
                Filtering goals...
              </p>
            </div>
          </div>
        )}

        {!loading && savingsAccounts.length === 0 && (
          <div className="flex justify-center items-center p-4 sm:p-8">
            <SavingsEmptyState onCreateSavings={handleCreateSavings} />
          </div>
        )}

        {!loading &&
          filteredAccounts.length === 0 &&
          (searchInput || selectedSearchResult) &&
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
                  We couldn't find any savings accounts matching "
                  {selectedSearchResult?.name || searchInput}
                  ".
                </p>
                <button
                  onClick={clearSearch}
                  className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                >
                  Clear search
                </button>
              </motion.div>
            </div>
          )}

        {!loading && displayAccounts.length > 0 && (
          <div className="p-3 md:px-6 pt-2 pb-16 sm:pb-20">
            {filterOption !== "completed" && activeAccounts.length > 0 && (
              <div className="mb-5 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">
                  Active Goals
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`active-${searchInput}-${filterOption}-${sortOrder}`}
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
                          onTransfer={handleTransfer}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}

            {filterOption !== "active" && completedAccounts.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">
                  Completed Goals
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`completed-${searchInput}-${filterOption}`}
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
                          onDelete={handleDelete}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}

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

      {isTransferModalOpen && selectedSavingAccount && (
        <TransferFundsModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          selectedSaving={selectedSavingAccount}
          accountsDefault={defaultAccounts}
          onSuccess={handleSuccess}
        />
      )}

      {isDeleteModalOpen && selectedAccount && (
        <DeleteSavingAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          accounts={savingsAccounts}
          defaultAccounts={defaultAccounts}
          accountId={selectedAccount.id}
          accountName={selectedAccount.name}
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
