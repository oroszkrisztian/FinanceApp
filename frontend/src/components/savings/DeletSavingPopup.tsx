import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Search,
  ChevronDown,
  AlertCircle,
  Info,
} from "lucide-react";
import { deleteSavingAccount } from "../../services/accountService";
import { Account } from "../../interfaces/Account";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  getExchangeRate,
} from "../../services/exchangeRateService";
import { addFundsDefault } from "../../services/transactionService";
import { TransactionType } from "../../interfaces/enums";
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null
  );
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  const [accountInput, setAccountInput] = useState("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const account = accounts.find((acc) => acc.id === accountId);
  const selectedAccount = defaultAccounts.find(
    (acc) => acc.id === selectedAccountId
  );

  const hasAmount =
    account &&
    !Boolean(account?.savingAccount?.isCompleted) &&
    account.amount !== undefined &&
    account.amount !== null &&
    account.amount > 0;

  const steps = hasAmount
    ? ["Transfer Funds", "Confirm Delete"]
    : ["Confirm Delete"];
  const maxSteps = hasAmount ? 2 : 1;

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    if (!hasAmount) {
      setCurrentStep(1);
    }
  }, [hasAmount]);

  useEffect(() => {
    const loadExchangeRates = async () => {
      if (!hasAmount) return;

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
    };

    if (isOpen) {
      loadExchangeRates();
    }
  }, [isOpen, hasAmount]);

  useEffect(() => {
    if (
      !account ||
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

  const resetForm = () => {
    setCurrentStep(1);
    setConfirmText("");
    setError(null);
    setSelectedAccountId(null);
    setConvertedAmount(null);
    setAccountInput("");
    setShowAccountDropdown(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      resetForm();
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleAccountSelect = (accountName: string) => {
    const account = defaultAccounts.find((acc) => acc.name === accountName);
    if (account) {
      setSelectedAccountId(account.id);
      setAccountInput("");
      setShowAccountDropdown(false);
    }
  };

  const clearAccountSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAccountId(null);
    setAccountInput("");
  };

  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountInput(value);
    setSelectedAccountId(null);
    setShowAccountDropdown(true);
  };

  const filteredAccounts = defaultAccounts.filter((account) =>
    account.name.toLowerCase().includes(accountInput.toLowerCase())
  );

  const canProceed = () => {
    if (!hasAmount) {
      return confirmText === "Delete";
    }

    switch (currentStep) {
      case 1:
        return selectedAccountId !== null;
      case 2:
        return confirmText === "Delete";
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canProceed() || !accountId ) return;

    setLoading(true);

    if (!hasAmount) {
      try {
        await deleteSavingAccount( accountId);
        setLoading(false);
        onSuccess(accountId);
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

    if (!selectedAccountId) {
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
      account!.currency !== selectedAccount.currency
        ? convertedAmount || 0
        : account!.amount || 0;

    if (transferAmount <= 0) {
      setLoading(false);
      setError("Transfer amount must be greater than zero.");
      return;
    }

    try {
      await addFundsDefault(
        transferAmount,
        accountId,
        selectedAccountId,
        TransactionType.TRANSFER,
        selectedAccount.currency
      );

      await deleteSavingAccount(accountId);

      setLoading(false);
      onSuccess(accountId);
      handleClose();
    } catch (err) {
      setLoading(false);
      console.error("Error in addFundsDefault:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete savings goal"
      );
    }
  };

  const renderStepContent = () => {
    const stepIndex = hasAmount ? currentStep : 1;
    const isTransferStep = hasAmount && stepIndex === 1;
    const isConfirmStep =
      (!hasAmount && stepIndex === 1) || (hasAmount && stepIndex === 2);

    if (isTransferStep) {
      return (
        <div className="space-y-4">
          <div className="mb-5 px-4 py-2 bg-red-50 rounded-xl border border-red-100">
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold text-red-800">
                {accountName || "Savings Goal"}
              </p>
              <div className="bg-white px-3 py-1 rounded-lg shadow-sm border border-red-100">
                <p className="text-red-700 font-medium">
                  {account?.amount?.toFixed(2) || "0.00"}{" "}
                  {account?.currency || "USD"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="accountInput"
              className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
            >
              <span className="text-red-500 mr-1">🏦</span>
              Transfer balance to<span className="text-red-500">*</span>
            </label>

            <div ref={accountRef} className="relative">
              <motion.div
                whileFocus={{ scale: 1.0 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="flex items-center bg-white border border-red-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent transition-all bg-red-50/50"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              >
                <div className="px-3 text-red-500">
                  <Search size={16} />
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
                    <X size={16} />
                  </button>
                )}

                <div className="px-2 text-gray-400">
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${showAccountDropdown ? "transform rotate-180" : ""}`}
                  />
                </div>
              </motion.div>

              {showAccountDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-[100] mt-1 w-full bg-white border border-red-100 rounded-xl shadow-lg max-h-28 overflow-y-auto"
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
                          backgroundColor: "rgba(239, 68, 68, 0.05)",
                        }}
                        className={`p-3 cursor-pointer text-sm ${selectedAccountId === account.id ? "bg-red-50" : ""} ${index === filteredAccounts.length - 1 ? "" : "border-b border-red-50"}`}
                        onClick={() => handleAccountSelect(account.name)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{account.name}</span>
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
          </div>

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
                <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-red-100">
                    <div className="p-4">
                      <div className="text-xs text-gray-500 mb-2 flex items-center">
                        From {accountName}
                      </div>
                      <div className="font-bold text-red-500 text-lg">
                        -{account.amount?.toFixed(2)} {account.currency}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-gray-500 mb-2 flex items-center">
                        To {selectedAccount.name}
                      </div>
                      <div className="font-bold text-green-500 text-lg">
                        +
                        {account.currency !== selectedAccount.currency
                          ? convertedAmount?.toFixed(2)
                          : account.amount?.toFixed(2)}{" "}
                        {selectedAccount.currency}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      New balance in {selectedAccount.name}:
                    </span>
                    <span className="font-medium text-red-600">
                      {(
                        selectedAccount.amount +
                        (account.currency !== selectedAccount.currency
                          ? convertedAmount || 0
                          : account.amount || 0)
                      ).toFixed(2)}{" "}
                      {selectedAccount.currency}
                    </span>
                  </div>
                </div>

                {account.currency !== selectedAccount.currency && (
                  <div className="flex items-center text-xs text-gray-500 bg-red-50 p-3 rounded-lg border border-red-100">
                    <Info size={16} className="mr-2 text-red-500" />
                    <div>
                      <span className="font-medium">Exchange rate:</span> 1{" "}
                      {account.currency} ={" "}
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
      );
    }

    if (isConfirmStep) {
      return (
        <div className="space-y-4">
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

          <div>
            <p className="text-gray-700 mb-3">
              Are you sure you want to delete the savings goal{" "}
              <span className="font-semibold text-black">{accountName}</span>?
              This action cannot be undone.
            </p>

            {hasAmount && selectedAccount && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                <div className="flex items-center mb-1">
                  <span className="mr-2">✅</span>
                  <span className="font-medium">Transfer Confirmed</span>
                </div>
                <p>
                  Funds will be transferred to {selectedAccount.name} before
                  deletion.
                </p>
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
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                type="text"
                id="confirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border border-red-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-red-50/50"
                placeholder="Type 'Delete' to confirm"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (error && !isClosing) return <ErrorState error={error} />;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
        style={{
          width: isMobileView ? "90%" : "28rem",
          minHeight: "55vh",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 relative overflow-hidden">
          <div
            className={`absolute top-0 right-0 bg-white/20 rounded-full ${isMobileView ? "w-10 h-10 -translate-y-5 translate-x-5" : "w-12 h-12 -translate-y-6 translate-x-6"}`}
          ></div>
          <div
            className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${isMobileView ? "w-6 h-6 translate-y-3 -translate-x-3" : "w-8 h-8 translate-y-4 -translate-x-4"}`}
          ></div>
          <div
            className={`absolute bg-white/15 rounded-full ${isMobileView ? "top-1 left-12 w-4 h-4" : "top-1 left-14 w-6 h-6"}`}
          ></div>

          <div
            className={`${isMobileView ? "px-4 py-3" : "px-4 py-3"} flex items-center justify-between relative z-10 mb-2`}
          >
            <div className="flex items-center">
              <div
                className={`bg-white rounded-full flex items-center justify-center mr-3 shadow-lg ${isMobileView ? "w-8 h-8" : "w-10 h-10"}`}
              >
                <motion.svg
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.3 }}
                  className={`text-red-600 ${isMobileView ? "w-4 h-4" : "w-5 h-5"}`}
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
                <h2
                  className={`font-bold text-white ${isMobileView ? "text-base" : "text-lg"}`}
                >
                  Delete Savings Goal
                </h2>
                <p
                  className={`text-white/90 ${isMobileView ? "text-xs" : "text-sm"}`}
                >
                  {hasAmount ? steps[currentStep - 1] : "Confirm Delete"}
                </p>
              </div>
            </div>

            <motion.button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={isMobileView ? 18 : 20} />
            </motion.button>
          </div>

          {hasAmount && (
            <div
              className={`${isMobileView ? "px-4 pb-3" : "px-4 pb-3"} relative z-10`}
            >
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded transition-all duration-300 ${index < currentStep ? "bg-white" : "bg-white/30"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className={`flex-1 overflow-y-auto ${isMobileView ? "p-3" : "p-4"}`}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 shadow-sm"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div
          className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 backdrop-blur-sm flex justify-between`}
        >
          <motion.button
            onClick={prevStep}
            disabled={currentStep === 1 || !hasAmount}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            whileHover={{ scale: currentStep === 1 || !hasAmount ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft size={14} />
            Back
          </motion.button>

          {hasAmount && currentStep < maxSteps ? (
            <motion.button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-sm"
              whileHover={{ scale: !canProceed() ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue
              <ArrowRight size={14} />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleConfirmDelete}
              disabled={!canProceed() || loading}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-sm"
              whileHover={{ scale: !canProceed() || loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
              ) : (
                "🗑️"
              )}
              Delete Goal
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteSavingAccountModal;
