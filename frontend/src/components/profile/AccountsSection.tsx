import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, CreditCard, DollarSign, MoreHorizontal, Edit, Trash2, Wallet } from "lucide-react";
import { Account } from "../../interfaces/Account";
import { AccountType } from "../../interfaces/enums";
import CreateDefaultAccountPopup from "../accounts/CreateDefaultAccountPopup";
import EditDefaultAccountPopup from "../accounts/EditDefaultAccountPopup";
import AddFundsPopup from "./AddFundsPopup";
import EmptyState from "../EmptyState";

interface AccountsSectionProps {
  accounts: Account[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteRequest: (accountId: string | number, accountName: string) => void;
}

const AccountsSection: React.FC<AccountsSectionProps> = ({
  accounts,
  loading,
  onRefresh,
  onDeleteRequest,
}) => {
  const [isMobileView, setIsMobileView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | number | null>(null);

  // Enhanced mobile detection
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

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
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeMenu]);

  const defaultAccounts = accounts.filter(
    (account) => account.type === AccountType.DEFAULT
  );

  const handleAddFunds = (accountId: string | number): void => {
    const accountToAddFunds = accounts.find((acc) => acc.id === accountId);
    if (accountToAddFunds) {
      setCurrentAccount(accountToAddFunds);
      setIsAddFundsModalOpen(true);
    }
    setActiveMenu(null);
  };

  const handleEdit = (accountId: string | number): void => {
    const accountToEdit = accounts.find((acc) => acc.id === accountId);
    if (accountToEdit) {
      setCurrentAccount(accountToEdit);
      setIsEditModalOpen(true);
    }
    setActiveMenu(null);
  };

  const handleAccountCreated = (): void => {
    setIsModalOpen(false);
    onRefresh();
  };

  const handleAccountEdited = (): void => {
    setIsEditModalOpen(false);
    onRefresh();
  };

  const handleFundsAdded = (): void => {
    setIsAddFundsModalOpen(false);
    onRefresh();
  };

  const toggleMenu = (accountId: string | number): void => {
    setActiveMenu(activeMenu === accountId ? null : accountId);
  };

  return (
    <>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`flex items-center justify-between ${isMobileView ? "mb-4" : "mb-6"}`}
      >
        <div>
          <h2 className={`font-bold text-gray-900 ${isMobileView ? "text-lg" : "text-2xl"}`}>
            My Accounts
          </h2>
          <p className={`text-gray-600 ${isMobileView ? "text-sm mt-0.5" : "mt-1"}`}>
            Manage your financial accounts
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className={`bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all shadow-md flex items-center gap-1 ${
            isMobileView ? "px-3 py-2 text-sm" : "px-4 py-2 text-sm"
          }`}
        >
          <Plus size={isMobileView ? 14 : 16} />
          {!isMobileView && "Add Account"}
        </motion.button>
      </motion.div>

      {/* Accounts Grid */}
      <div className={`grid ${isMobileView ? "grid-cols-1 gap-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}`}>
        <AnimatePresence>
          {defaultAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all relative"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative overflow-hidden">
                {/* Background decorative elements */}
                <div className={`absolute top-0 right-0 bg-white/20 rounded-full ${isMobileView ? "w-6 h-6 -translate-y-3 translate-x-3" : "w-8 h-8 -translate-y-4 translate-x-4"}`}></div>
                <div className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${isMobileView ? "w-4 h-4 translate-y-2 -translate-x-2" : "w-6 h-6 translate-y-3 -translate-x-3"}`}></div>
                
                <div className={`relative z-10 ${isMobileView ? "p-3" : "p-4"}`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`font-bold truncate ${isMobileView ? "text-base" : "text-lg"}`}>
                      {account.name}
                    </h3>
                    <div className="flex items-center gap-1 text-white/80">
                      <CreditCard size={isMobileView ? 12 : 14} />
                      <span className={`${isMobileView ? "text-xs" : "text-sm"}`}>
                        {account.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className={`${isMobileView ? "p-3" : "p-4"}`}>
                <div className="space-y-3">
                  <p className={`text-gray-600 ${isMobileView ? "text-sm" : "text-sm"}`}>
                    {account.description || "No description available"}
                  </p>

                  {/* Account Amount */}
                  <div className="flex items-center gap-2 text-gray-900">
                    <div className="bg-green-100 rounded-lg p-1.5">
                      <DollarSign size={isMobileView ? 12 : 14} className="text-green-600" />
                    </div>
                    <span className={`font-semibold ${isMobileView ? "text-base" : "text-lg"}`}>
                      {account.amount.toFixed(2)} {account.currency}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-100 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium ${
                        isMobileView ? "py-2 text-sm" : "py-2 text-sm"
                      }`}
                      onClick={() => handleAddFunds(account.id)}
                    >
                      Add Funds
                    </motion.button>
                    
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center justify-center bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors ${
                          isMobileView ? "w-8 h-8" : "w-10 h-10"
                        }`}
                        data-account-id={account.id}
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          toggleMenu(account.id);
                        }}
                      >
                        <MoreHorizontal size={isMobileView ? 14 : 16} />
                      </motion.button>

                      {activeMenu === account.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          id={`menu-${account.id}`}
                          className="fixed w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                          style={{ 
                            zIndex: 9999,
                            transformOrigin: "top right"
                          }}
                          ref={(el: HTMLDivElement | null) => {
                            if (el) {
                              // Position the dropdown relative to the button
                              const button = document.querySelector(`[data-account-id="${account.id}"]`);
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                const scrollY = window.scrollY || window.pageYOffset;
                                const scrollX = window.scrollX || window.pageXOffset;
                                const windowHeight = window.innerHeight;
                                const dropdownHeight = 120; // approximate height
                                
                                // Check if dropdown would go below viewport
                                const spaceBelow = windowHeight - rect.bottom;
                                
                                if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
                                  // Position above the button
                                  el.style.top = `${rect.top + scrollY - dropdownHeight - 8}px`;
                                } else {
                                  // Position below the button
                                  el.style.top = `${rect.bottom + scrollY + 8}px`;
                                }
                                
                                el.style.left = `${rect.right + scrollX - 192}px`; // 192px = w-48
                              }
                            }
                          }}
                          onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                            e.stopPropagation()
                          }
                        >
                          <button
                            className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => handleEdit(account.id)}
                          >
                            <Edit size={14} className="mr-3 text-gray-500" />
                            Edit Account
                          </button>
                          <div className="border-t border-gray-100"></div>
                          <button
                            className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => onDeleteRequest(account.id, account.name)}
                          >
                            <Trash2 size={14} className="mr-3 text-red-500" />
                            Delete Account
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {defaultAccounts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 text-center text-gray-500 flex flex-col items-center gap-3"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-blue-100/80 backdrop-blur-sm p-4 rounded-full border border-blue-200/50 text-4xl"
          >
            <Wallet size={48} className="text-blue-600" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">No Accounts Found</h3>
            <p className="text-gray-600 mb-4">You don't have any accounts yet.</p>
          </div>
          <motion.button
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all shadow-md"
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add Your First Account
          </motion.button>
        </motion.div>
      )}

      {/* Modals */}
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

      {isAddFundsModalOpen && currentAccount && (
        <AddFundsPopup
          account={currentAccount}
          setIsAddFundsModalOpen={setIsAddFundsModalOpen}
          onFundsAdded={handleFundsAdded}
        />
      )}
    </>
  );
};

export default AccountsSection;