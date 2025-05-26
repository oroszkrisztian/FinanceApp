import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { deleteSavingAccount } from "../../services/accountService";
import { useAuth } from "../../context/AuthContext";
import { Account } from "../../interfaces/Account";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  getExchangeRate,
} from "../../services/exchangeRateService";
import { addFundsDefault } from "../../services/transactionService";
import { CurrencyType, TransactionType } from "../../interfaces/enums";
import ErrorState from "../ErrorState";

interface DeleteSavingAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultAccounts: Account[];
  accountId: number;
  accountName: string;
  onSuccess: (accountId?: number) => void;
}

const DeleteSavingAccountModal: React.FC<DeleteSavingAccountModalProps> = ({
  isOpen,
  onClose,
  accounts,
  defaultAccounts,
  accountId,
  accountName,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | "">("");
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [accountInput, setAccountInput] = useState("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountInputRef = useRef<HTMLInputElement>(null);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  const account = accounts.find((acc) => acc.id === accountId);
  const selectedAccount = defaultAccounts.find(
    (acc) => acc.id === selectedAccountId
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setIsMobileScreen(true);
      } else {
        setIsMobileScreen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const loadExchangeRates = async () => {
      if (!account?.savingAccount?.isCompleted) {
        setFetchingRates(true);
        try {
          const ratesData = await fetchExchangeRates();
          setRates(ratesData);
        } catch (err) {
          console.error("Error fetching exchange rates:", err);
          setError("Could not fetch exchange rates. Please try again later.");
        } finally {
          setFetchingRates(false);
        }
      }
    };

    loadExchangeRates();
  }, [account]);

  useEffect(() => {
    if (
      !account ||
      account.savingAccount?.isCompleted ||
      !selectedAccount ||
      !account.amount ||
      account.currency === selectedAccount.currency
    ) {
      setConvertedAmount(null);
      return;
    }

    try {
      const convertedValue = convertAmount(
        account.amount,
        account.currency,
        selectedAccount.currency,
        rates
      );
      setConvertedAmount(convertedValue);
    } catch (err) {
      console.error("Error converting amount:", err);
    }
  }, [selectedAccountId, account, rates]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node) &&
        showAccountDropdown
      ) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAccountDropdown]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setConfirmText("");
      setError(null);
      setSelectedAccountId("");
      setConvertedAmount(null);
      onClose();
    }, 150);
  };

  const handleConfirmDelete = async () => {
    if (confirmText !== "Delete" || !accountId || !user?.id) return;

    setLoading(true);

    if (
      account?.savingAccount?.isCompleted ||
      !account?.amount ||
      account.amount <= 0
    ) {
      try {
        await deleteSavingAccount(user.id, accountId, undefined);
        setLoading(false);
        onSuccess(accountId); // Pass account ID for targeted animation
        handleClose();
      } catch (err) {
        setLoading(false);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error deleting savings goal:", err);
      }
      return;
    }

    if (typeof selectedAccountId === "string" || !selectedAccountId) {
      setLoading(false);
      setError("Please select an account to transfer the funds to.");
      return;
    }

    if (!selectedAccount) {
      setLoading(false);
      setError("Selected account not found.");
      return;
    }

    const transferAmount =
      account.currency !== selectedAccount.currency
        ? convertedAmount || 0
        : account.amount || 0;

    if (transferAmount <= 0) {
      setLoading(false);
      setError("Transfer amount must be greater than zero.");
      return;
    }

    const selectedAccountIdNumber = selectedAccountId as number;

    if (!selectedAccount.currency) {
      setLoading(false);
      setError("Selected account has no currency specified.");
      return;
    }

    const currency = selectedAccount.currency;

    try {
      await addFundsDefault(
        user.id,
        transferAmount,
        accountId,
        selectedAccountIdNumber,
        TransactionType.TRANSFER,
        currency
      );

      await deleteSavingAccount(user.id, accountId, undefined);

      setLoading(false);
      onSuccess(accountId); // Pass account ID for targeted animation
      handleClose();
    } catch (err) {
      setLoading(false);
      console.error("Error in addFundsDefault:", err);
    }
  };

  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountInput(value);
    setSelectedAccountId("");
    setShowAccountDropdown(true);
  };

  const selectAccount = (account: Account) => {
    setSelectedAccountId(account.id);
    setAccountInput("");
    setShowAccountDropdown(false);
  };

  const clearAccountSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAccountId("");
    setAccountInput("");
  };

  const filteredAccounts = defaultAccounts.filter((account) =>
    account.name.toLowerCase().includes(accountInput.toLowerCase())
  );

  if (error && !isClosing) return <ErrorState error={error} />;

  return (
    <>
      {isOpen && !isClosing && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full pointer-events-auto"
              style={{
                maxWidth: "28rem",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div className="bg-red-500 h-20 relative">
                {/* Decorative circles */}
                <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
                <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
                <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>

                {/* Title */}
                <div className="absolute bottom-0 left-0 w-full px-6 pb-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-lg">
                      <motion.svg
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.3 }}
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </motion.svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Delete Savings Goal
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg
                      className="h-6 w-6"
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
                </div>
              </div>

              <div className="p-6">
                {/* Account Name Display */}
                <div className="mb-5 px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-red-800">
                      {accountName || "Savings Goal"}
                    </p>
                    {account && !account?.savingAccount?.isCompleted && (
                      <div className="bg-white px-3 py-1 rounded-lg shadow-sm border border-red-100">
                        <p className="text-red-700 font-medium">
                          {account?.amount?.toFixed(2) || "0.00"}{" "}
                          {account?.currency || "USD"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"
                  >
                    <div className="flex">
                      <svg
                        className="h-5 w-5 mr-2 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}

                {/* Form */}
                <form className="space-y-5">
                  <div>
                    <p className="text-gray-700 mb-3">
                      Are you sure you want to delete the savings goal{" "}
                      <span className="font-semibold text-black">
                        {accountName}
                      </span>
                      ? This action cannot be undone.
                    </p>

                    {!account?.savingAccount?.isCompleted &&
                      account &&
                      Math.abs(parseFloat(account.amount.toFixed(2))) > 0 && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                          <div className="flex items-center mb-2">
                            <svg
                              className="h-5 w-5 mr-2 text-yellow-600 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-medium">Important:</span>
                          </div>
                          <p>
                            This savings goal has a remaining balance. Please
                            select an account where the funds will be
                            transferred.
                          </p>
                        </div>
                      )}
                  </div>

                  {!account?.savingAccount?.isCompleted &&
                    account &&
                    Math.abs(parseFloat(account.amount.toFixed(2))) > 0 && (
                      <div>
                        <label
                          htmlFor="accountInput"
                          className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                        >
                          <span className="text-red-500 mr-1">🏦</span>
                          Transfer balance to
                          <span className="text-red-500">*</span>
                        </label>

                        {/* Searchable Account Selection */}
                        <div ref={accountRef} className="relative">
                          <motion.div
                            whileFocus={{ scale: 1.0 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 17,
                            }}
                            className="flex items-center bg-white border border-red-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent transition-all bg-red-50/50"
                            onClick={() =>
                              setShowAccountDropdown(!showAccountDropdown)
                            }
                          >
                            <div className="px-3 text-red-500">
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

                            {selectedAccount ? (
                              <div className="flex-1 py-3 px-1">
                                <span className="font-normal text-sm text-gray-900">
                                  {selectedAccount.name} (
                                  {selectedAccount.amount?.toFixed(2)}{" "}
                                  {selectedAccount.currency})
                                </span>
                              </div>
                            ) : (
                              <input
                                type="text"
                                className="flex-1 py-3 bg-transparent outline-none text-gray-900 font-medium"
                                placeholder="Search accounts..."
                                value={accountInput}
                                onChange={handleAccountInputChange}
                                onClick={() => setShowAccountDropdown(true)}
                              />
                            )}

                            {(accountInput || selectedAccount) && (
                              <button
                                type="button"
                                className="px-3 text-gray-400 hover:text-gray-600"
                                onClick={clearAccountSelection}
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

                            <div className="px-2 text-gray-400">
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${showAccountDropdown ? "transform rotate-180" : ""}`}
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
                          </motion.div>

                          {showAccountDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                              className="fixed z-[100] mt-1 w-full max-w-md bg-white border border-red-100 rounded-xl shadow-lg"
                              style={{
                                maxHeight: "200px",
                                overflowY: "auto",
                                boxShadow:
                                  "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                top: isMobileScreen
                                  ? "calc(28vh + 200px)"
                                  : "calc(23vh + 200px)",
                                width: "calc(96% - 1.8rem)",
                              }}
                            >
                              {filteredAccounts.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500 text-center">
                                  No matching accounts found
                                </div>
                              ) : (
                                filteredAccounts.map((account, index) => (
                                  <motion.div
                                    key={account.id}
                                    whileHover={{
                                      backgroundColor:
                                        "rgba(239, 68, 68, 0.05)",
                                    }}
                                    className={`p-3 cursor-pointer text-sm ${
                                      selectedAccountId === account.id
                                        ? "bg-red-50"
                                        : ""
                                    } ${
                                      index === filteredAccounts.length - 1
                                        ? ""
                                        : "border-b border-red-50"
                                    }`}
                                    onClick={() => selectAccount(account)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">
                                        {account.name}
                                      </span>
                                      <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                        {account.amount !== undefined
                                          ? `${account.amount.toFixed(2)} ${account.currency}`
                                          : ""}
                                      </span>
                                    </div>
                                  </motion.div>
                                ))
                              )}
                            </motion.div>
                          )}
                        </div>

                        {/* Transfer Summary Section */}
                        {selectedAccount && account && !fetchingRates && (
                          <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <span className="text-red-500 mr-1">🔄</span>
                              Transfer Summary
                            </h3>

                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-3"
                            >
                              {/* Main summary card */}
                              <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
                                <div className="grid grid-cols-2 divide-x divide-red-100">
                                  {/* From column */}
                                  <div className="p-4">
                                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                                      From {accountName}
                                    </div>
                                    <div className="font-bold text-red-500 text-lg">
                                      -{account.amount?.toFixed(2)}{" "}
                                      {account.currency}
                                    </div>
                                  </div>

                                  {/* To column */}
                                  <div className="p-4">
                                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                                      To {selectedAccount.name}
                                    </div>
                                    <div className="font-bold text-green-500 text-lg">
                                      +
                                      {account.currency !==
                                      selectedAccount.currency
                                        ? convertedAmount?.toFixed(2)
                                        : account.amount?.toFixed(2)}{" "}
                                      {selectedAccount.currency}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* New balance info */}
                              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700">
                                    New balance in {selectedAccount.name}:
                                  </span>
                                  <span className="font-medium text-red-600">
                                    {(
                                      selectedAccount.amount +
                                      (account.currency !==
                                      selectedAccount.currency
                                        ? convertedAmount || 0
                                        : account.amount || 0)
                                    ).toFixed(2)}{" "}
                                    {selectedAccount.currency}
                                  </span>
                                </div>
                              </div>

                              {/* Exchange rate info (only if currencies differ) */}
                              {account.currency !==
                                selectedAccount.currency && (
                                <div className="flex items-center text-xs text-gray-500 bg-red-50 p-3 rounded-lg border border-red-100">
                                  <svg
                                    className="h-4 w-4 mr-2 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                    />
                                  </svg>
                                  <div>
                                    <span className="font-medium">
                                      Exchange rate:
                                    </span>{" "}
                                    1 {account.currency} ={" "}
                                    {getExchangeRate(
                                      account.currency,
                                      selectedAccount.currency,
                                      rates
                                    ).toFixed(4)}{" "}
                                    {selectedAccount.currency}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          </div>
                        )}
                      </div>
                    )}

                  <div>
                    <label
                      htmlFor="confirmText"
                      className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                    >
                      <span className="text-red-500 mr-1">⚠️</span>
                      Type{" "}
                      <span className="font-semibold text-red-600 mx-1">
                        Delete
                      </span>{" "}
                      to confirm
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                      type="text"
                      id="confirmText"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full border border-red-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-red-50/50"
                      placeholder="Type 'Delete' to confirm"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.1 }}
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 border-2 border-red-200 rounded-xl text-red-600 font-medium bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all shadow-sm"
                      disabled={loading}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.2)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.1 }}
                      type="button"
                      onClick={handleConfirmDelete}
                      className="flex-1 py-3 px-4 bg-red-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                      disabled={
                        confirmText !== "Delete" ||
                        loading ||
                        fetchingRates ||
                        (!account?.savingAccount?.isCompleted &&
                          account &&
                          account.amount > 0 &&
                          !selectedAccountId)
                      }
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        "Delete Goal"
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </>
  );
};

export default DeleteSavingAccountModal;
