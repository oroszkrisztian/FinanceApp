import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { deleteSavingAccount } from "../../services/accountService";
import { useAuth } from "../../context/AuthContext";
import AnimatedModal from "../animations/BlurPopup";
import { Account } from "../../interfaces/Account";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  getExchangeRate,
} from "../../services/exchangeRateService";
import {
  addFundsDefault,
  addFundsSaving,
} from "../../services/transactionService";
import { CurrencyType, TransactionType } from "../../interfaces/enums";

interface DeleteSavingAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultAccounts: Account[];
  accountId: number | null;
  accountName: string;
  onSuccess: () => void;
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

  const account = accounts.find((acc) => acc.id === accountId);
  const selectedAccount = defaultAccounts.find(
    (acc) => acc.id === selectedAccountId
  );

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

    if (account?.savingAccount?.isCompleted) {
      try {
        await deleteSavingAccount(
          user.id,
          accountId,
          // Type-safe check for selectedAccountId
          typeof selectedAccountId === "string" ? undefined : selectedAccountId
        );
        setLoading(false);
        onSuccess();
        handleClose();
      } catch (err) {
        setLoading(false);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error deleting savings goal:", err);
      }
    } else {
      if (typeof selectedAccountId === "string") {
        setLoading(false);
        setError("Please select an account to transfer the funds to.");
        return;
      }

      if (!account?.amount || account.amount <= 0) {
        try {
          await deleteSavingAccount(
            user.id,
            accountId,
            typeof selectedAccountId === "string"
              ? undefined
              : selectedAccountId
          );
          setLoading(false);
          selectedAccount
          onSuccess();
          handleClose();
        } catch (err) {
          setLoading(false);
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
          console.error("Error deleting empty savings goal:", err);
        }
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
        console.log("Sending to addFundsDefault:", {
          userId: user.id,
          amount: transferAmount,
          fromSavingId: accountId,
          toAccountId: selectedAccountIdNumber,
          type: TransactionType.TRANSFER,
          currency,
        });

        await addFundsDefault(
          user.id,
          transferAmount,
          accountId,
          selectedAccountIdNumber,
          TransactionType.TRANSFER,
          currency
        );

        //await deleteSavingAccount(user.id, accountId, undefined);

        setLoading(false);
        onSuccess();
        handleClose();
      } catch (err) {
        setLoading(false);
        console.error("Error in addFundsDefault:", err);
      }
    }
    setLoading(false);
  };

  return (
    <AnimatedModal
      isOpen={isOpen && !isClosing}
      onClose={handleClose}
      closeOnBackdropClick={true}
      backdropBlur="sm"
      animationDuration={150}
    >
      <div className="bg-white rounded-lg shadow-xl p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-red-50 w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 break-words">
                Delete {accountName || "Goal"}
              </h2>
              {account && (
                <p className="text-red-600 mt-1">
                  Current balance: {account?.amount?.toFixed(2) || "0.00"}{" "}
                  {account?.currency}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
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
          </div>
        )}

        <form className="space-y-4">
          <div>
            <p className="text-gray-700 mb-3">
              Are you sure you want to delete the savings goal{" "}
              <span className="font-semibold text-black">{accountName}</span>?
              This action cannot be undone.
            </p>

            {!account?.savingAccount?.isCompleted && (
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
                  This savings goal has a remaining balance. Please select an
                  account where the funds will be transferred.
                </p>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmText"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              To confirm, type{" "}
              <span className="font-semibold text-red-600">Delete</span> below:
            </label>
            <input
              type="text"
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="Type 'Delete' to confirm"
            />
          </div>

          {!account?.savingAccount?.isCompleted && (
            <div>
              <label
                htmlFor="transferAccount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Transfer balance to<span className="text-red-500">*</span>
              </label>
              <select
                id="transferAccount"
                value={selectedAccountId}
                onChange={(e) =>
                  setSelectedAccountId(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm md:text-base"
                required
                disabled={fetchingRates}
              >
                <option value="" disabled>
                  Select an account
                </option>
                {defaultAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.amount?.toFixed(2)} {acc.currency})
                  </option>
                ))}
              </select>

              {/* Transfer Summary Section */}
              {selectedAccount && account && !fetchingRates && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Transfer Summary
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm">
                    {fetchingRates ? (
                      <div className="flex items-center justify-center py-2">
                        <svg
                          className="animate-spin mr-2 h-4 w-4 text-indigo-600"
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
                        <span>Calculating conversion...</span>
                      </div>
                    ) : (
                      <>
                        {account.currency !== selectedAccount.currency ? (
                          <>
                            <div className="flex justify-between py-1 border-b border-gray-100">
                              <span className="text-gray-600">
                                <span className="text-red-600">
                                  {account.name} in {selectedAccount.currency}:
                                </span>
                              </span>
                              <span className=" text-red-600">
                                {account.amount?.toFixed(2)} {account.currency}{" "}
                                → {convertedAmount?.toFixed(2)}{" "}
                                {selectedAccount.currency}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-600">
                              Transfer amount:
                            </span>
                            <span className="font-medium text-gray-900">
                              {account.amount?.toFixed(2)} {account.currency}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          New balance :{" "}
                          <div>
                            <span className="text-red-600">
                              {convertedAmount?.toFixed(2)}
                            </span>{" "}
                            +{" "}
                            <span className="text-green-600">
                              {selectedAccount.amount?.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-green-600 truncate pr-2">
                            {selectedAccount.name} :
                          </span>
                          <span className="font-medium text-green-600">
                            {(
                              selectedAccount.amount +
                              (account.currency !== selectedAccount.currency
                                ? convertedAmount || 0
                                : account.amount || 0)
                            ).toFixed(2)}{" "}
                            {selectedAccount.currency}
                          </span>
                        </div>

                        {account.currency !== selectedAccount.currency && (
                          <div className="mt-1 px-1 py-1 bg-indigo-50 border border-indigo-100 rounded text-xs sm:text-sm text-indigo-700">
                            Exchange rate: 1 {account.currency} ={" "}
                            {getExchangeRate(
                              account.currency,
                              selectedAccount.currency,
                              rates
                            ).toFixed(4)}{" "}
                            {selectedAccount.currency}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={
                confirmText !== "Delete" ||
                loading ||
                fetchingRates ||
                (!account?.savingAccount?.isCompleted && !selectedAccountId)
              }
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                "Delete Savings Goal"
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </AnimatedModal>
  );
};

export default DeleteSavingAccountModal;
