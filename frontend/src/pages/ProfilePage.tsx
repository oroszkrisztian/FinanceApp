import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  deleteDefaultAccount,
  fetchAccounts,
} from "../services/accountService";
import { AccountType } from "../interfaces/enums";
import { AnimatePresence, motion } from "framer-motion";
import "../globals.css";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import CreateDefaultAccountPopup from "../components/accounts/CreateDefaultAccountPopup";
import EditDefaultAccountPopup from "../components/accounts/EditDefaultAccountPopup";
import AddFundsPopup from "../components/profile/AddFundsPopup"; // Import the new component
import { Account } from "../interfaces/Account";
import EmptyState from "../components/EmptyState";

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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] =
    useState<boolean>(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation>({
      isOpen: false,
      accountId: null,
      accountName: "",
      confirmText: "",
    });

  const fetchUserAccounts = async (): Promise<void> => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const startTime: number = Date.now();
    try {
      const defaultAccountsData: Account[] = await fetchAccounts(user.id);
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

  const defaultAccounts: Account[] = accounts.filter(
    (account) => account.type === AccountType.DEFAULT
  );

  const handleAddFunds = (accountId: string | number): void => {
    const accountToAddFunds: Account | undefined = accounts.find(
      (acc) => acc.id === accountId
    );
    if (accountToAddFunds) {
      setCurrentAccount(accountToAddFunds);
      setIsAddFundsModalOpen(true);
    }
  };

  const handleFundsAdded = (): void => {
    setIsAddFundsModalOpen(false);
    refreshAccounts();
  };

  const handleEdit = (accountId: string | number): void => {
    const accountToEdit: Account | undefined = accounts.find(
      (acc) => acc.id === accountId
    );
    if (accountToEdit) {
      setCurrentAccount(accountToEdit);
      setIsEditModalOpen(true);
    }
    setActiveMenu(null);
  };

  const handleAccountEdited = (): void => {
    setIsEditModalOpen(false);
    refreshAccounts();
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
    setActiveMenu(null);
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

  const toggleMenu = (accountId: string | number): void => {
    setActiveMenu(activeMenu === accountId ? null : accountId);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Element;
      if (
        activeMenu !== null &&
        !target.closest(`[data-account-id="${activeMenu}"]`) &&
        !target.closest(`#menu-${activeMenu}`)
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeMenu]);

  const handleAccountCreated = (): void => {
    setIsModalOpen(false);
    refreshAccounts();
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 p-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-700">
          My Profile
        </h1>
      </motion.div>

      {/* User Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-xl shadow-md mb-8 border border-gray-200"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Profile Avatar */}
          <div className="w-20 h-20 bg-gradient-to-r from-blue-700 to-black rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>

          {/* User Information */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {user?.firstName} {user?.lastName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>@{user?.username}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>ID: {user?.id?.toString().substring(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Accounts Section Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-700">
            My Accounts
          </h2>
          <p className="text-gray-600 mt-1">Manage your financial accounts</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-sm text-sm font-medium flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Account
        </button>
      </motion.div>

      {/* Accounts Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {defaultAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-visible hover:shadow-lg"
            >
              {/* Card Header with Gradient */}
              <div className="bg-gradient-to-r from-blue-800 to-black p-4 text-white rounded-t-xl">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-bold truncate">{account.name}</h3>
                  <div className="flex items-center gap-2 text-gray-200 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path
                        fillRule="evenodd"
                        d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{account.currency}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    {account.description || "No description available"}
                  </p>

                  {/* Display Account Amount */}
                  <div className="flex items-center gap-2 text-gray-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold">
                      {account.amount} {account.currency}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex gap-2 mt-4">
                    <button
                      className="flex-1 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      onClick={() => handleAddFunds(account.id)}
                    >
                      Add Funds
                    </button>
                    <div className="relative" style={{ position: "relative" }}>
                      <button
                        className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                        data-account-id={account.id}
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          toggleMenu(account.id);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      </button>

                      {activeMenu === account.id && (
                        <div
                          id={`menu-${account.id}`}
                          className="absolute right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 opacity-0"
                          onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                            e.stopPropagation()
                          }
                          ref={(el: HTMLDivElement | null) => {
                            if (el) {
                              // Calculate position before showing the element
                              const rect = el.getBoundingClientRect();
                              const spaceBelow =
                                window.innerHeight - rect.bottom;

                              // Set initial position before showing
                              if (spaceBelow < 100 && rect.top > 150) {
                                el.style.bottom = "calc(100% + 8px)";
                                el.style.top = "auto";
                                el.style.transformOrigin = "bottom right";
                              } else {
                                el.style.top = "100%";
                                el.style.bottom = "auto";
                                el.style.transformOrigin = "top right";
                              }

                              // Show element after position is set
                              requestAnimationFrame(() => {
                                el.style.opacity = "1";
                                el.style.transition =
                                  "opacity 0.2s ease-in-out";
                              });
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
                                handleDeleteRequest(account.id, account.name)
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
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {defaultAccounts.length === 0 && !loading && (
        <EmptyState
          title="No Accounts Found"
          description="You don't have any accounts yet."
          buttonText="Add Account"
          onClick={() => setIsModalOpen(true)}
        />
      )}

      {isModalOpen && (
        <CreateDefaultAccountPopup
          setIsModalOpen={setIsModalOpen}
          onAccountCreated={handleAccountCreated}
        />
      )}

      {isEditModalOpen && currentAccount && (
        <EditDefaultAccountPopup
          setIsEditModalOpen={setIsEditModalOpen}
          onAccountEdited={handleAccountEdited}
          account={currentAccount}
        />
      )}

      {/* Add Funds Popup */}
      {isAddFundsModalOpen && currentAccount && (
        <AddFundsPopup
          account={currentAccount}
          setIsAddFundsModalOpen={setIsAddFundsModalOpen}
          onFundsAdded={handleFundsAdded}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
          >
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="text-xl font-semibold">Delete Account</h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the account{" "}
                <span className="font-semibold">
                  {deleteConfirmation.accountName}
                </span>
                ? This action cannot be undone.
              </p>
              <p className="text-gray-700 mb-4">
                To confirm, please type{" "}
                <span className="font-semibold text-red-600">Delete</span>{" "}
                below:
              </p>
              <input
                type="text"
                value={deleteConfirmation.confirmText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDeleteConfirmation({
                    ...deleteConfirmation,
                    confirmText: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                placeholder="Type 'Delete' to confirm"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirmation({
                    isOpen: false,
                    accountId: null,
                    accountName: "",
                    confirmText: "",
                  })
                }
                className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={deleteConfirmation.confirmText !== "Delete"}
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
