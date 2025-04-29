import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Account } from "../../interfaces/Account";
import AnimatedModal from "../animations/BlurPopup";
import { CurrencyType, TransactionType } from "../../interfaces/enums";
import {
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
  ExchangeRates,
} from "../../services/exchangeRateService";

import { transferFundsDefault } from "../../services/transactionService";
import { useAuth } from "../../context/AuthContext";

interface TransferDefaultAccountsProps {
  onClose: () => void;
  isOpen: boolean;
  accounts: Account[];
  accountsLoading: boolean;
  onSuccess: () => void;
  rates: ExchangeRates;
  ratesError: string | null;
  fetchingRates: boolean;
}

const TransferDefaultAccounts: React.FC<TransferDefaultAccountsProps> = ({
  onClose,
  isOpen,
  accounts,
  accountsLoading,
  onSuccess,
  rates,
  ratesError,
  fetchingRates,
}) => {
  const { user } = useAuth();
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [amountString, setAmountString] = useState("");
  const [showFromAccountDropdown, setShowFromAccountDropdown] = useState(false);
  const [showToAccountDropdown, setShowToAccountDropdown] = useState(false);
  const [selectedFromAccount, setSelectedFromAccount] =
    useState<Account | null>(null);
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(
    null
  );
  const [fromAccountInput, setFromAccountInput] = useState("");
  const [toAccountInput, setToAccountInput] = useState("");
  const fromAccountRef = useRef<HTMLDivElement>(null);
  const toAccountRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

  const [formData, setFormData] = useState<{
    amount: number;
    currency: string;
  }>({
    amount: 0,
    currency: "RON",
  });

  const [conversionDetails, setConversionDetails] = useState<{
    originalAmount: number;
    convertedAmount: number;
    rate: number;
    error: string | null;
  }>({
    originalAmount: 0,
    convertedAmount: 0,
    rate: 1,
    error: null,
  });

  const resetForm = () => {
    setFormData({
      amount: 0,
      currency: "RON",
    });
    setAmountString("");
    setFromAccountInput("");
    setToAccountInput("");
    setSelectedFromAccount(null);
    setSelectedToAccount(null);
    setShowFromAccountDropdown(false);
    setShowToAccountDropdown(false);
    setConversionDetails({
      originalAmount: 0,
      convertedAmount: 0,
      rate: 1,
      error: null,
    });
    setError(null);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      resetForm();
      setIsClosing(false);
      onClose();
    }, 150);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fromAccountRef.current &&
        !fromAccountRef.current.contains(event.target as Node) &&
        showFromAccountDropdown
      ) {
        setShowFromAccountDropdown(false);
      }
      if (
        toAccountRef.current &&
        !toAccountRef.current.contains(event.target as Node) &&
        showToAccountDropdown
      ) {
        setShowToAccountDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFromAccountDropdown, showToAccountDropdown]);

  useEffect(() => {
    updateConversionDetails();
  }, [formData.amount, formData.currency, selectedToAccount, rates]);

  useEffect(() => {
    // Calculate progress based on required fields
    let progress = 0;
    const totalRequiredFields = 3; // amount, fromAccount, and toAccount required

    if (formData.amount > 0) {
      progress += 1;
    }

    if (selectedFromAccount) {
      progress += 1;
    }

    if (selectedToAccount) {
      progress += 1;
    }

    // Calculate percentage (capped at 100%)
    const percentage = Math.min((progress / totalRequiredFields) * 100, 100);
    setProgressPercentage(percentage);
  }, [formData, selectedFromAccount, selectedToAccount]);

  const updateConversionDetails = () => {
    if (
      !selectedFromAccount ||
      !selectedToAccount ||
      !rates ||
      Object.keys(rates).length === 0
    )
      return;

    const fromCurrency = selectedFromAccount.currency;
    const toCurrency = selectedToAccount.currency;
    const validation = validateCurrencyConversion(
      fromCurrency,
      toCurrency,
      rates
    );

    if (!validation.valid) {
      setConversionDetails({
        originalAmount: formData.amount,
        convertedAmount: formData.amount,
        rate: 1,
        error: validation.error || "Invalid conversion",
      });
      return;
    }

    const rate = getExchangeRate(fromCurrency, toCurrency, rates);
    const convertedValue = convertAmount(
      formData.amount,
      fromCurrency,
      toCurrency,
      rates
    );

    setConversionDetails({
      originalAmount: formData.amount,
      convertedAmount: convertedValue,
      rate: rate,
      error: null,
    });
  };

  const getTransactionAmount = (): number => {
    if (!selectedToAccount || !formData.amount) return 0;

    if (formData.currency === selectedToAccount.currency) {
      return formData.amount;
    } else {
      if (fetchingRates || conversionDetails.error) return 0;
      return conversionDetails.convertedAmount;
    }
  };

  const handleFromAccountInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFromAccountInput(value);
    setSelectedFromAccount(null);
    setShowFromAccountDropdown(true);
  };

  const handleToAccountInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setToAccountInput(value);
    setSelectedToAccount(null);
    setShowToAccountDropdown(true);
  };

  const selectFromAccount = (account: Account) => {
    setSelectedFromAccount(account);
    setFromAccountInput("");
    setShowFromAccountDropdown(false);
  };

  const selectToAccount = (account: Account) => {
    setSelectedToAccount(account);
    setToAccountInput("");
    setShowToAccountDropdown(false);
  };

  const clearFromAccountSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFromAccount(null);
    setFromAccountInput("");
  };

  const clearToAccountSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedToAccount(null);
    setToAccountInput("");
  };

  const filteredFromAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(fromAccountInput.toLowerCase()) &&
      account.id !== selectedToAccount?.id
  );

  const filteredToAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(toAccountInput.toLowerCase()) &&
      account.id !== selectedFromAccount?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError("User not found");
      setIsLoading(false);
      return;
    }
    if (!selectedFromAccount || !selectedToAccount) {
      setError("Please select both accounts");
      setIsLoading(false);
      return;
    }
    if (selectedFromAccount.id === selectedToAccount.id) {
      setError("You cannot transfer money to the same account");
      setIsLoading(false);
      return;
    }
    if (formData.amount <= 0) {
      setError("Please enter a valid amount");
      setIsLoading(false);
      return;
    }
    if (selectedFromAccount.amount < formData.amount) {
      setError("Insufficient funds in the selected account");
      setIsLoading(false);
      return;
    }

    try {
      const finalAmount = getTransactionAmount();

      await transferFundsDefault(
        user.id,
        finalAmount,
        selectedFromAccount.id,
        selectedToAccount.id,
        TransactionType.TRANSFER,
        selectedFromAccount.currency
      );

      resetForm();
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error during transfer:", error);
      setError(
        error instanceof Error ? error.message : "Failed to transfer funds"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedModal
      isOpen={isOpen && !isClosing}
      onClose={handleClose}
      closeOnBackdropClick={true}
      backdropBlur="md"
      animationDuration={300}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: isMobileScreen ? "100%" : "36rem",
          minWidth: isMobileScreen ? "auto" : "36rem",
         
          maxHeight: "90vh",
        }}
        ref={modalRef}
      >
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-4 relative z-10">
          {/* Decorative circles */}
          <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
          <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
          <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>

          {/* Title in header */}
          <div className="px-6 flex items-center justify-between relative">
            <div className="flex items-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <motion.svg
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.3 }}
                  className="w-6 h-6 text-blue-600"
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
                </motion.svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Transfer Money 💸
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* From Account Dropdown */}
              <div>
                <label
                  htmlFor="fromAccountInput"
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  <span className="text-blue-500 mr-1">💳</span>
                  From Account<span className="text-blue-500">*</span>
                </label>
                {accountsLoading ? (
                  <div className="animate-pulse h-11 bg-gray-200 rounded-xl"></div>
                ) : accounts.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                    No accounts available. Please create one first.
                  </div>
                ) : (
                  <div className="relative" ref={fromAccountRef}>
                    <div
                      className="flex items-center border border-blue-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all bg-blue-50/50 overflow-hidden h-[42px]"
                      onClick={() =>
                        setShowFromAccountDropdown(!showFromAccountDropdown)
                      }
                    >
                      <div className="p-2 m-1.5 rounded-md">
                        <svg
                          className="h-5 w-5 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-grow">
                        {selectedFromAccount ? (
                          <input
                            type="text"
                            className="w-full py-2.5 px-0 bg-transparent outline-none text-gray-800 font-medium"
                            value={selectedFromAccount.name}
                            readOnly
                            onClick={() => setShowFromAccountDropdown(true)}
                          />
                        ) : (
                          <input
                            type="text"
                            value={fromAccountInput}
                            onChange={handleFromAccountInputChange}
                            className="w-full py-2.5 px-0 bg-transparent outline-none text-gray-800"
                            placeholder="Select source account"
                            onClick={() => setShowFromAccountDropdown(true)}
                          />
                        )}
                      </div>
                      {(fromAccountInput || selectedFromAccount) && (
                        <button
                          type="button"
                          className="px-2 text-gray-400 hover:text-gray-600"
                          onClick={clearFromAccountSelection}
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
                          className={`w-4 h-4 transition-transform duration-200 ${
                            showFromAccountDropdown
                              ? "transform rotate-180"
                              : ""
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
                      </div>
                    </div>

                    {selectedFromAccount && (
                      <div className="mt-1 text-sm text-blue-600 flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Balance: {selectedFromAccount.amount.toFixed(2)}{" "}
                        {selectedFromAccount.currency}
                      </div>
                    )}

                    {showFromAccountDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-md max-h-40 overflow-y-auto"
                      >
                        {filteredFromAccounts.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">
                            No matching accounts
                          </div>
                        ) : (
                          filteredFromAccounts.map((account) => (
                            <motion.div
                              key={account.id}
                              whileHover={{
                                backgroundColor: "rgba(219, 234, 254, 0.4)",
                              }}
                              className={`px-3 py-2 cursor-pointer text-sm ${
                                selectedFromAccount?.id === account.id
                                  ? "bg-blue-100"
                                  : ""
                              }`}
                              onClick={() => selectFromAccount(account)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">
                                  {account.name}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  {account.amount.toFixed(2)} {account.currency}
                                </span>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  <span className="text-blue-500 mr-1">💰</span>
                  Amount<span className="text-blue-500">*</span>
                </label>
                <div className="flex border border-blue-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all bg-blue-50/50 overflow-hidden">
                  <input
                    type="text"
                    id="amount"
                    name="amount"
                    className="flex-1 min-w-0 px-4 py-3 focus:outline-none bg-transparent font-bold text-xl text-gray-800"
                    placeholder="0.00"
                    autoComplete="off"
                    required
                    value={amountString}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === "" || /^[0-9]*([.,][0-9]*)?$/.test(value)) {
                        setAmountString(value);

                        if (value === "") {
                          setFormData({
                            ...formData,
                            amount: 0,
                          });
                        } else {
                          const numericValue = parseFloat(
                            value.replace(",", ".")
                          );

                          if (!isNaN(numericValue)) {
                            setFormData({
                              ...formData,
                              amount: numericValue,
                            });
                          }
                        }
                      }
                    }}
                    disabled={!selectedFromAccount}
                  />
                  <div className="px-3 py-3 bg-blue-600 text-white font-medium">
                    <span className="text-base">
                      {selectedFromAccount?.currency || "---"}
                    </span>
                  </div>
                </div>
                {!selectedFromAccount && (
                  <div className="mt-1 text-xs text-gray-500 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Select a source account first
                  </div>
                )}
              </div>

              {/* To Account Dropdown */}
              <div>
                <label
                  htmlFor="toAccountInput"
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  <span className="text-blue-500 mr-1">💳</span>
                  To Account<span className="text-blue-500">*</span>
                </label>
                {accountsLoading ? (
                  <div className="animate-pulse h-11 bg-gray-200 rounded-xl"></div>
                ) : accounts.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                    No accounts available. Please create one first.
                  </div>
                ) : (
                  <div className="relative" ref={toAccountRef}>
                    <div
                      className="flex items-center border border-blue-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all bg-blue-50/50 overflow-hidden h-[42px]"
                      onClick={() =>
                        setShowToAccountDropdown(!showToAccountDropdown)
                      }
                    >
                      <div className="p-2 m-1.5 rounded-md">
                        <svg
                          className="h-5 w-5 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-grow">
                        {selectedToAccount ? (
                          <input
                            type="text"
                            className="w-full py-2.5 px-0 bg-transparent outline-none text-gray-800 font-medium"
                            value={selectedToAccount.name}
                            readOnly
                            onClick={() => setShowToAccountDropdown(true)}
                          />
                        ) : (
                          <input
                            type="text"
                            value={toAccountInput}
                            onChange={handleToAccountInputChange}
                            className="w-full py-2.5 px-0 bg-transparent outline-none text-gray-800"
                            placeholder="Select destination account"
                            onClick={() => setShowToAccountDropdown(true)}
                          />
                        )}
                      </div>
                      {(toAccountInput || selectedToAccount) && (
                        <button
                          type="button"
                          className="px-2 text-gray-400 hover:text-gray-600"
                          onClick={clearToAccountSelection}
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
                          className={`w-4 h-4 transition-transform duration-200 ${
                            showToAccountDropdown ? "transform rotate-180" : ""
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
                      </div>
                    </div>

                    {selectedToAccount && (
                      <div className="mt-1 text-sm text-blue-600 flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Balance: {selectedToAccount.amount.toFixed(2)}{" "}
                        {selectedToAccount.currency}
                      </div>
                    )}

                    {showToAccountDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-md max-h-40 overflow-y-auto"
                      >
                        {filteredToAccounts.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">
                            No matching accounts
                          </div>
                        ) : (
                          filteredToAccounts.map((account) => (
                            <motion.div
                              key={account.id}
                              whileHover={{
                                backgroundColor: "rgba(219, 234, 254, 0.4)",
                              }}
                              className={`px-3 py-2 cursor-pointer text-sm ${
                                selectedToAccount?.id === account.id
                                  ? "bg-blue-100"
                                  : ""
                              }`}
                              onClick={() => selectToAccount(account)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">
                                  {account.name}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  {account.amount.toFixed(2)} {account.currency}
                                </span>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Transfer Visualization */}
              {selectedFromAccount &&
                selectedToAccount &&
                formData.amount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm"
                  >
                    <h3 className="font-bold text-blue-700 mb-2 flex items-center">
                      <span className="mr-1">💸</span>
                      Transfer Summary
                    </h3>

                    {selectedFromAccount.amount < formData.amount ? (
                      <div className="p-2 bg-red-100 rounded-lg border border-red-200">
                        <div className="flex items-center text-red-600 font-medium mb-1">
                          <svg
                            className="w-4 h-4 mr-1 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Insufficient funds
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                          Available: {selectedFromAccount.amount.toFixed(2)}{" "}
                          {selectedFromAccount.currency} | Needed:{" "}
                          {formData.amount.toFixed(2)}{" "}
                          {selectedFromAccount.currency}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* From/To Account info  */}
                        <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-2">
                          <div className="grid grid-cols-3 gap-1 items-center">
                            <div className="col-span-1 flex items-center">
                              <div className="bg-blue-100 p-1 rounded-full mr-1">
                                <svg
                                  className="w-3 h-3 text-blue-500"
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
                              <span className="font-medium truncate">
                                {selectedFromAccount.name}
                              </span>
                            </div>
                            <div className="text-center">
                              <motion.svg
                                animate={{ x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-4 h-4 text-blue-500 inline-block"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                                />
                              </motion.svg>
                            </div>
                            <div className="col-span-1 flex items-center justify-end">
                              <span className="font-medium truncate">
                                {selectedToAccount.name}
                              </span>
                              <div className="bg-green-100 p-1 rounded-full ml-1">
                                <svg
                                  className="w-3 h-3 text-green-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between mt-2">
                            <div>
                              <span className="text-red-500 font-medium">
                                -{formData.amount.toFixed(2)}{" "}
                                {selectedFromAccount.currency}
                              </span>
                              <div className="text-gray-500">
                                New balance:{" "}
                                {(
                                  selectedFromAccount.amount - formData.amount
                                ).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-green-500 font-medium">
                                +{conversionDetails.convertedAmount.toFixed(2)}{" "}
                                {selectedToAccount.currency}
                              </span>
                              <div className="text-gray-500">
                                New balance:{" "}
                                {(
                                  selectedToAccount.amount +
                                  conversionDetails.convertedAmount
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Exchange Rate Info - Only if currencies differ */}
                        {selectedFromAccount.currency !==
                          selectedToAccount.currency && (
                          <div className="text-blue-600 flex items-center justify-center">
                            <span className="mr-1">💱</span>
                            Rate: 1 {selectedFromAccount.currency} ={" "}
                            {conversionDetails.rate.toFixed(4)}{" "}
                            {selectedToAccount.currency}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

              {/* Buttons */}
              <div
                className={`flex ${isMobileScreen ? "flex-col-reverse gap-2" : "gap-3"} pt-4 pb-2`}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  type="button"
                  onClick={handleClose}
                  className={`${isMobileScreen ? "w-full" : "flex-1"} py-3 px-4 border-2 border-blue-200 rounded-xl text-blue-600 font-medium bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all shadow-sm`}
                  disabled={isLoading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.2)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  type="submit"
                  className={`${isMobileScreen ? "w-full" : "flex-1"} py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg`}
                  disabled={
                    isLoading ||
                    progressPercentage < 100 ||
                    (selectedFromAccount &&
                      selectedFromAccount.amount < formData.amount) ||
                    false
                  }
                >
                  {isLoading ? (
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
                      Processing...
                    </>
                  ) : (
                    "Transfer Money"
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </AnimatedModal>
  );
};

export default TransferDefaultAccounts;
