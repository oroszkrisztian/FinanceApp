import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import CreateSavingAccountPopup from "../components/accounts/CreateSavingAccountPopup";
import EditSavingAccountPopup from "../components/accounts/EditSavingAccountPopup";
import ErrorState from "../components/ErrorState";
import AddFundsSavingPopup from "../components/savings/AddFundsSavinPopup";
import DeleteSavingAccountModal from "../components/savings/DeletSavingPopup";
import SavingsEmptyState from "../components/savings/SavingsEmptyState";
import TransferFundsModal from "../components/savings/TransferFundsModal";
import ActiveSavingsGrid from "../components/savings/ActiveSavingsGrid";
import CompletedSavingsGrid from "../components/savings/CompletedSavingsGrid";
import { Account } from "../interfaces/Account";
import { fetchDefaultAccounts, fetchSavings } from "../services/accountService";
import LoadingState from "../components/LoadingState";

type SortOrder = "asc" | "desc" | "none";
type FilterOption = "all" | "active" | "completed";

const Savings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [savingsExist, setSavingsExist] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const [, setShowSearchDropdown] = useState<boolean>(false);
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
  const [updatedSavingId, setUpdatedSavingId] = useState<number | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
  const [filterLoading, setFilterLoading] = useState<boolean>(false);
  const [defaultAccounts, setDefaultAccounts] = useState<Account[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const [sortMenuOpen, setSortMenuOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [sortType, setSortType] = useState<"percentage" | "none">("none");

  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);
  const [savingsAccountNames, setSavingsAccountNames] = useState<string[]>([]);

  const [, setAnimationPlayed] = useState<boolean>(false);

  useEffect(() => {
    setAnimationPlayed(true);
    return () => {
      setAnimationPlayed(false);
    };
  }, []);

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

  // Check if any savings exist
  const checkSavingsExist = async (): Promise<void> => {
    setLoading(true);
    try {
      const data: Account[] = await fetchSavings();
      setSavingsExist(data.length > 0);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to check if savings accounts exist"
      );
      setLoading(false);
    }
  };

  const fetchDefaultAccountsFr = async (): Promise<void> => {
    try {
      const data: Account[] = await fetchDefaultAccounts();
      setDefaultAccounts(data);
    } catch (err) {
      console.error("Failed to fetch default accounts:", err);
    }
  };

  const fetchSavingsAccountNames = async (): Promise<void> => {
    try {
      const data: Account[] = await fetchSavings();
      const names = data.map((account) => account.name);
      setSavingsAccountNames(names);
    } catch (err) {
      console.error("Failed to fetch savings account names:", err);
    }
  };

  useEffect(() => {
    checkSavingsExist();
    fetchDefaultAccountsFr();
    fetchSavingsAccountNames();
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);




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

  const handleEdit = async (accountId: number): Promise<void> => {
    setActiveMenu(null);
    setIsCreateModalOpen(false);
    setIsAddFundsModalOpen(false);
    setIsTransferModalOpen(false);
    setIsDeleteModalOpen(false);

    try {
      const allAccounts = await fetchSavings();
      const accountToEdit = allAccounts.find((acc) => acc.id === accountId);

      if (accountToEdit) {
        setSelectedAccount(accountToEdit);
        setIsEditModalOpen(true);
      } else {
        console.error("Account not found");
      }
    } catch (err) {
      console.error("Error fetching account for edit:", err);
    }
  };

  const handleDelete = (accountId: number, accountName: string): void => {
    setSelectedAccount({ id: accountId, name: accountName } as Account);
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  const handleCreateSavings = (): void => {
    setIsCreateModalOpen(true);
  };

  const handleAddFunds = (account: Account): void => {
    setActiveMenu(null);
    setSelectedSavingAccount(account);
    setIsAddFundsModalOpen(true);
  };

  const handleTransfer = (account: Account): void => {
    setActiveMenu(null);
    setSelectedSavingAccount(account);
    setIsTransferModalOpen(true);
  };

  const handleSuccess = (accountId?: number): void => {
    setIsEditModalOpen(false);
    setIsCreateModalOpen(false);
    setIsAddFundsModalOpen(false);
    setIsTransferModalOpen(false);
    setIsDeleteModalOpen(false);

    if (accountId) {
      setUpdatedSavingId(accountId);
      fetchDefaultAccountsFr();
      fetchSavingsAccountNames();
      setTimeout(() => {
        setUpdatedSavingId(null);
      }, 1000);
    } else {
      // When creating a new savings account, directly update the state without triggering loading
      setSavingsExist(true);
      fetchDefaultAccountsFr();
      fetchSavingsAccountNames();
    }

    // Trigger refetch in child components
    setRefetchTrigger((prev) => prev + 1);

    setSelectedSearchResult(null);
  };



  // SearchWithSuggestions component
  const SearchWithSuggestions: React.FC<{
    placeholder: string;
    onSearch: (term: string) => void;
    suggestions: string[];
    value: string;
  }> = ({ placeholder, onSearch, suggestions, value }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>(
      []
    );
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setSearchTerm(value);
    }, [value]);

    useEffect(() => {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }, [searchTerm, suggestions]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      onSearch(value);
      setIsOpen(true);
    };

    const handleSuggestionClick = (suggestion: string) => {
      setSearchTerm(suggestion);
      onSearch(suggestion);
      setIsOpen(false);
    };

    const clearSearch = () => {
      setSearchTerm("");
      onSearch("");
      setIsOpen(false);
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-indigo-400"
          />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            className={`w-full pl-8 ${searchTerm ? "pr-8" : "pr-3"} py-2.5 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors shadow-sm bg-indigo-50/50`}
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
              onClick={clearSearch}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {isOpen && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-indigo-200 rounded-lg shadow-lg z-50 max-h-28 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors text-gray-700"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <LoadingState
        title="Loading Savings"
        message="Loading your savings goals..."
        showDataStatus={true}
        dataStatus={[
          {
            label: "Savings Check",
            isLoaded: !loading && typeof savingsExist === "boolean",
          },
        ]}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Savings Loading Error"
        showHomeButton={true}
        onRetry={() => {
          setError(null);
          checkSavingsExist();
          fetchDefaultAccountsFr();
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50">
      {!loading && savingsExist && (
        <AnimatePresence>
          <motion.div
            className="sticky top-0 z-10 p-3 md:p-6 pb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-indigo-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              {/* Filter/Search Controls Container */}
              <motion.div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {isMobileScreen && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
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

                    <div
                      className={`transition-transform duration-200 ${showFilters ? "transform rotate-180" : ""}`}
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
                    </div>
                  </button>
                )}

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      className="w-full sm:w-64 lg:w-80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SearchWithSuggestions
                        placeholder="Search goals..."
                        onSearch={setSearchInput}
                        suggestions={savingsAccountNames}
                        value={searchInput}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Filter Button */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      className="relative justify-items-stretch w-full sm:w-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div ref={dropdownRef}>
                        <button
                          onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                          className="w-full sm:w-auto px-3 py-2.5 bg-indigo-50 border border-indigo-200 text-gray-700 rounded-lg hover:bg-indigo-100 focus:outline-none transition-colors relative flex items-center justify-between sm:justify-start"
                        >
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-1.5 text-indigo-400"
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
                            className={`h-4 w-4 ml-1 transition-transform duration-200 text-indigo-400 ${filterMenuOpen ? "transform rotate-180" : ""}`}
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
                              {/* ...existing code... */}
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sort Button */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      className="relative w-full sm:w-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div ref={sortDropdownRef}>
                        {/* ...existing code... */}
                        <button
                          onClick={() => setSortMenuOpen(!sortMenuOpen)}
                          className="w-full sm:w-auto px-3 py-2.5 bg-indigo-50 border border-indigo-200 text-gray-700 rounded-lg hover:bg-indigo-100 focus:outline-none transition-colors relative flex items-center justify-between sm:justify-start"
                        >
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-1.5 text-indigo-400"
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
                            className={`h-4 w-4 ml-1 transition-transform duration-200 text-indigo-400 ${sortMenuOpen ? "transform rotate-180" : ""}`}
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div
                onClick={handleCreateSavings}
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
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
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

        {!loading && !savingsExist && (
          <div className="flex justify-center items-center p-4 sm:p-8">
            <SavingsEmptyState onCreateSavings={handleCreateSavings} />
          </div>
        )}

        {!loading && savingsExist && (
          <div className="p-3 md:px-6 pt-2 pb-16 sm:pb-20">
            {(filterOption === "all" || filterOption === "active") && (
              <div className="mb-5 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">
                  Active Goals
                </h2>

                <ActiveSavingsGrid
                  filterOption={filterOption}
                  searchInput={searchInput}
                  selectedSearchResult={selectedSearchResult}
                  sortOrder={sortOrder}
                  sortType={sortType}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onAddFunds={handleAddFunds}
                  onTransfer={handleTransfer}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  updatedAccountId={updatedSavingId}
                  refetchTrigger={refetchTrigger}
                />
              </div>
            )}

            {(filterOption === "all" || filterOption === "completed") && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">
                  Completed Goals
                </h2>

                <CompletedSavingsGrid
                  filterOption={filterOption}
                  searchInput={searchInput}
                  selectedSearchResult={selectedSearchResult}
                  onDelete={handleDelete}
                  refetchTrigger={refetchTrigger}
                />
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
          accounts={[]}
          defaultAccounts={defaultAccounts}
          accountId={selectedAccount.id}
          accountName={selectedAccount.name}
          onSuccess={handleSuccess}
        />
      )}

      {isEditModalOpen && selectedAccount && (
        <EditSavingAccountPopup
          setIsModalOpen={setIsEditModalOpen}
          account={selectedAccount}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default Savings;
