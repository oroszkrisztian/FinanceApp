import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSavings, searchAccount } from "../services/accountService";
import { motion, AnimatePresence } from "framer-motion";
import CreateSavingAccountPopup from "../components/accounts/CreateSavingAccountPopup";
import EditSavingAccountPopup from "../components/accounts/EditSavingAccountPopup";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import AddFundsSavingPopup from "../components/savings/AddFundsSavinPopup";

const Savings: React.FC = () => {
  const [savingsAccounts, setSavingsAccounts] = useState<any[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [selectedSavingAccount, setSelectedSavingAccount] = useState<any>(null);

  // Fetch savings accounts
  const fetchSavingAccounts = async () => {
    if (!user?.id) return;

    const startTime = Date.now();
    setLoading(true);

    try {
      const data = await fetchSavings(user.id);
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
          const data = await searchAccount(user.id, searchTerm);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeMenu &&
        !(event.target as Element).closest(`#menu-${activeMenu}`) &&
        !(event.target as Element).closest(`#menu-button-${activeMenu}`)
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenu]);

  const handleEdit = (accountId: string) => {
    const account = savingsAccounts.find((acc) => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      setIsEditModalOpen(true);
      setActiveMenu(null);
    }
  };

  const handleDeleteRequest = (accountId: string, accountName: string) => {
    console.log("Delete account:", accountId, accountName);
    // TODO: Implement delete functionality
    setActiveMenu(null);
  };

  const handleCreateSavings = () => {
    setIsCreateModalOpen(true);
  };

  const handleAddFunds = (accountId: any) => {
    const account = savingsAccounts.find((acc) => acc.id === accountId);
    setSelectedSavingAccount(account);
    setIsAddFundsModalOpen(true);
    setActiveMenu(null);
  };

  const handleSuccess = () => {
    fetchSavingAccounts();
  };

  const calculateCompletionPercentage = (account: any) => {
    if (!account.savingAccount || !account.savingAccount.targetAmount) {
      return 0;
    }

    // Calculate percentage based on current amount and target amount
    const currentAmount = account.amount || 0;
    const targetAmount = account.savingAccount.targetAmount || 0;

    if (account.savingAccount.isCompleted) {
      return 100;
    }

    if (targetAmount <= 0) {
      return 0;
    }

    const percentage = (currentAmount / targetAmount) * 100;
    return Math.min(Math.floor(percentage), 99); // Cap at 99% if not completed
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 p-8">
      {/* Search and Add Button */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
      >
        <div className="relative w-full md:w-64 lg:w-80">
          <input
            type="text"
            placeholder="Search savings accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-700 transition-all duration-300"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
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
        <motion.button
          onClick={handleCreateSavings}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center whitespace-nowrap"
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
          Add
        </motion.button>
      </motion.div>

      {/* Savings Accounts Section */}
      <div>
        {filteredAccounts.length === 0 ? (
          <EmptyState
            key="empty-state"
            title="No Savings Accounts Found"
            description="You don't have any savings accounts yet."
            buttonText="Create Savings Account"
            onClick={handleCreateSavings}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={searchTerm}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="contents"
              >
                {filteredAccounts.map((account, index) => {
                  const completionPercentage =
                    calculateCompletionPercentage(account);

                  return (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="relative bg-white p-6 rounded-xl shadow-md border border-gray-200 overflow-hidden"
                    >
                      {/* Full-width wave background at bottom - always visible with consistent waves */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 z-0 overflow-hidden">
                        <div
                          className="absolute bottom-0 left-0 w-full h-full bg-green-300 z-0"
                          style={{
                            opacity: 0.3,
                            clipPath:
                              "path('M0 43.9999C106.667 43.9999 213.333 7.99994 320 7.99994C426.667 7.99994 533.333 43.9999 640 43.9999C746.667 43.9999 853.333 7.99994 960 7.99994C1066.67 7.99994 1173.33 43.9999 1280 43.9999C1386.67 43.9999 1440 19.0266 1440 9.01329V100H0V43.9999Z')",
                          }}
                        ></div>

                        {/* Gradient overlay for smooth transition */}
                        <div
                          className="absolute bottom-0 left-0 h-full z-1"
                          style={{
                            width: `${completionPercentage}%`,
                            background:
                              "linear-gradient(to right, rgba(255,255,255,0) 80%, rgba(255,255,255,1) 100%)",
                            transition: "width 0.5s ease-in-out",
                          }}
                        ></div>

                        {/* Overlay that hides part of the wave based on completion percentage */}
                        <div
                          className="absolute bottom-0 right-0 h-full bg-white z-1"
                          style={{
                            width: `${100 - completionPercentage}%`,
                            transition: "width 0.5s ease-in-out",
                          }}
                        ></div>
                      </div>
                      {/* Card content with higher z-index to appear above the background */}
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">
                          {account.name || "Unnamed Account"}
                        </h3>
                        <div className="space-y-3">
                          <p className="text-gray-700 flex justify-between">
                            <span className="font-medium">Currency:</span>
                            <span className="text-black">
                              {account.currency || "N/A"}
                            </span>
                          </p>

                          {/* Current Amount - New section */}
                          <p className="text-gray-700 flex justify-between">
                            <span className="font-medium">Current Amount:</span>
                            <span className="text-black font-semibold">
                              {(account.amount || 0).toFixed(2)}
                            </span>
                          </p>

                          {account.savingAccount && (
                            <>
                              <p className="text-gray-700 flex justify-between">
                                <span className="font-medium">
                                  Target Amount:
                                </span>
                                <span className="text-black font-semibold">
                                  {account.savingAccount.targetAmount
                                    ? account.savingAccount.targetAmount.toFixed(
                                        2
                                      )
                                    : "Not set"}
                                </span>
                              </p>

                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium">Progress</span>
                                  <span>{completionPercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="bg-black h-2.5 rounded-full"
                                    style={{
                                      width: `${completionPercentage}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              <div className="flex justify-between">
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Start Date
                                  </p>
                                  <p className="text-sm">
                                    {account.savingAccount.startDate
                                      ? new Date(
                                          account.savingAccount.startDate
                                        ).toLocaleDateString()
                                      : "Not set"}
                                  </p>
                                </div>

                                {account.savingAccount.targetDate && (
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500">
                                      Target Date
                                    </p>
                                    <p className="text-sm">
                                      {new Date(
                                        account.savingAccount.targetDate
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Buttons area with three-dot menu */}
                        <div className="mt-6 flex gap-2">
                          <button
                            className="flex-1 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 focus:bg-gray-300 focus:outline-none transition-colors text-sm font-medium border border-gray-200 focus:border-gray-400"
                            onClick={() => handleAddFunds(account.id)}
                          >
                            Add Funds
                          </button>

                          {/* Three-dot menu button */}
                          <div className="relative">
                            <button
                              id={`menu-button-${account.id}`}
                              onClick={() =>
                                setActiveMenu(
                                  activeMenu === account.id ? null : account.id
                                )
                              }
                              className="p-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 focus:bg-gray-300 focus:outline-none transition-colors border border-gray-200 focus:border-gray-400"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>

                            {/* Dropdown menu portal rendered at the root level */}
                            {activeMenu === account.id && (
                              <div
                                id={`menu-${account.id}`}
                                className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-50 opacity-0 w-48"
                                onClick={(
                                  e: React.MouseEvent<HTMLDivElement>
                                ) => e.stopPropagation()}
                                ref={(el: HTMLDivElement | null) => {
                                  if (el) {
                                    // Get button position
                                    const button = document.getElementById(
                                      `menu-button-${account.id}`
                                    );
                                    if (button) {
                                      const buttonRect =
                                        button.getBoundingClientRect();

                                      // Position menu initially
                                      el.style.left = `${buttonRect.right - el.offsetWidth}px`;
                                      el.style.top = `${buttonRect.bottom + 8}px`;

                                      // Calculate available space
                                      const spaceBelow =
                                        window.innerHeight - buttonRect.bottom;

                                      // Adjust position if not enough space below
                                      if (
                                        spaceBelow < el.offsetHeight + 10 &&
                                        buttonRect.top > el.offsetHeight + 10
                                      ) {
                                        el.style.top = `${buttonRect.top - el.offsetHeight - 8}px`;
                                        el.style.transformOrigin =
                                          "bottom right";
                                      } else {
                                        el.style.transformOrigin = "top right";
                                      }

                                      // Show with animation after position is set
                                      requestAnimationFrame(() => {
                                        el.style.opacity = "1";
                                        el.style.transition =
                                          "opacity 0.2s ease-in-out";
                                      });
                                    }
                                  }
                                }}
                              >
                                <div className="py-1">
                                  <button
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    onClick={() => handleEdit(account.id)}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-3 text-gray-500"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    <span>Edit Account</span>
                                  </button>

                                  <div className="border-t border-gray-100"></div>

                                  <button
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    onClick={() =>
                                      handleDeleteRequest(
                                        account.id,
                                        account.name
                                      )
                                    }
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-3 text-red-500"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span>Delete Account</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Savings Account Popup */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateSavingAccountPopup setIsModalOpen={setIsCreateModalOpen} onSuccess={handleSuccess} />
        )}
      </AnimatePresence>

      {/* Add Funds Popup */}
      <AnimatePresence>
        {isAddFundsModalOpen && (
          <AddFundsSavingPopup
            setIsModalOpen={setIsAddFundsModalOpen}
            account={selectedSavingAccount}
            onSuccess={handleSuccess}
          ></AddFundsSavingPopup>
        )}
      </AnimatePresence>

      {/* Edit Savings Account Popup */}
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
