import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Account } from "../../interfaces/Account";
import { useAuth } from "../../context/AuthContext";
import { TransactionType } from "../../interfaces/enums";
import AnimatedModal from "../animations/BlurPopup";
import {
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
  ExchangeRates,
} from "../../services/exchangeRateService";
import { addFundsDefaultAccount } from "../../services/transactionService";

interface IncomeProps {
  onClose: () => void;
  isOpen: boolean;
  accounts: Account[];
  accountsLoading: boolean;
  onSuccess: () => void;
  rates: ExchangeRates;
  ratesError: string | null;
  fetchingRates: boolean;
}

const AddIncomePopup: React.FC<IncomeProps> = ({
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
  const accountRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [accountInput, setAccountInput] = useState("");
  const [amountString, setAmountString] = useState("");
  const [formData, setFormData] = useState({
    amount: 0,
    name: "",
    description: "",
    selectedAccount: "",
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
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

  const resetForm = () => {
    setFormData({
      amount: 0,
      name: "",
      description: "",
      selectedAccount: "",
      currency: "RON",
    });
    setAmountString("");
    setSelectedAccount(null);
    setAccountInput("");
    setShowAccountDropdown(false);
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
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    updateConversionDetails();
  }, [formData.amount, formData.currency, selectedAccount, rates]);

  useEffect(() => {
    // Calculate progress based on required fields
    let progress = 0;
    const totalRequiredFields = 3; // name, amount, and account required

    if (formData.name.trim() !== "") {
      progress += 1;
    }

    if (formData.amount > 0) {
      progress += 1;
    }

    if (selectedAccount) {
      progress += 1;
    }

    // Calculate percentage (capped at 100%)
    const percentage = Math.min((progress / totalRequiredFields) * 100, 100);
    setProgressPercentage(percentage);
  }, [formData, selectedAccount]);

  const updateConversionDetails = () => {
    if (!selectedAccount || !rates || Object.keys(rates).length === 0) return;

    const accountCurrency = selectedAccount.currency;
    const transactionCurrency = formData.currency;
    const validation = validateCurrencyConversion(
      transactionCurrency,
      accountCurrency,
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

    const rate = getExchangeRate(transactionCurrency, accountCurrency, rates);
    const convertedValue = convertAmount(
      formData.amount,
      transactionCurrency,
      accountCurrency,
      rates
    );

    setConversionDetails({
      originalAmount: formData.amount,
      convertedAmount: convertedValue,
      rate: rate,
      error: null,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountInput(value);
    setSelectedAccount(null);
    setShowAccountDropdown(true);
    setFormData((prev) => ({ ...prev, selectedAccount: "" }));
  };

  const selectAccount = (account: Account) => {
    setSelectedAccount(account);
    setFormData((prev) => ({ ...prev, selectedAccount: String(account.id) }));
    setAccountInput("");
    setShowAccountDropdown(false);
  };

  const clearAccountSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAccount(null);
    setAccountInput("");
    setFormData((prev) => ({ ...prev, selectedAccount: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError("User not found");
      setIsLoading(false);
      return;
    }
    if (!selectedAccount) {
      setError("No account selected");
      setIsLoading(false);
      return;
    }
    if (formData.amount <= 0) {
      setError("Invalid amount");
      setIsLoading(false);
      return;
    }

    try {
      const finalAmount = getTransactionAmount();
      await addFundsDefaultAccount(
        user.id,
        formData.name,
        formData.description,
        finalAmount,
        TransactionType.INCOME,
        selectedAccount.id,
        null,
        selectedAccount.currency
      );
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to add income:", error);
      setError(error instanceof Error ? error.message : "Failed to add income");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(accountInput.toLowerCase())
  );

  const getTransactionAmount = (): number => {
    if (!selectedAccount || !formData.amount) return 0;

    if (formData.currency === selectedAccount.currency) {
      return formData.amount;
    } else {
      if (fetchingRates || conversionDetails.error) return 0;
      return conversionDetails.convertedAmount;
    }
  };

  const calculateNewBalance = (): {
    currentBalance: number;
    newBalance: number;
  } | null => {
    if (!selectedAccount || selectedAccount.amount === undefined) return null;

    const transactionAmount = getTransactionAmount();
    const currentBalance = selectedAccount.amount;
    const newBalance = currentBalance + transactionAmount;

    return {
      currentBalance,
      newBalance,
    };
  };

  const balanceInfo = selectedAccount ? calculateNewBalance() : null;

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
        <div className="bg-gradient-to-r from-green-600 to-green-800 py-4 relative z-10">
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
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </motion.svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Income 💹</h2>
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
              {/* Amount Input with Currency */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  <span className="text-green-500 mr-1">💰</span>
                  Amount<span className="text-green-500">*</span>
                </label>
                <div className="flex border border-green-200 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all bg-green-50/50 overflow-hidden">
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
                  />

                  <div className="flex items-center">
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      className="h-full w-20 px-2 py-3 bg-green-600 text-white font-medium focus:outline-none appearance-none text-center"
                      disabled={isLoading || fetchingRates}
                    >
                      {fetchingRates ? (
                        <option>...</option>
                      ) : ratesError ? (
                        <option>Err</option>
                      ) : (
                        // Limit to 5 most common currencies + current selected if not in top 5
                        (() => {
                          const topCurrencies = [
                            "USD",
                            "EUR",
                            "GBP",
                            "JPY",
                            "RON",
                          ]; // Most common currencies
                          const currentCurrency = formData.currency;

                          // Add current currency to the list if not already in top currencies
                          if (!topCurrencies.includes(currentCurrency)) {
                            topCurrencies.pop(); // Remove last element
                            topCurrencies.unshift(currentCurrency); // Add current currency at the beginning
                          }

                          return topCurrencies
                            .filter((curr) => rates[curr]) // Ensure the currency exists in rates
                            .map((curr) => (
                              <option key={curr} value={curr}>
                                {curr}
                              </option>
                            ));
                        })()
                      )}
                    </select>
                    <div className="pointer-events-none absolute right-7 flex items-center px-1 text-white">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Show additional currency info for mobile */}
                {isMobileScreen && (
                  <div className="mt-1 text-xs text-gray-500 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1 text-green-500"
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
                    Tap to select currency
                  </div>
                )}
              </div>

              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  <span className="text-green-500 mr-1">🏷️</span>
                  Income Name<span className="text-green-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-green-50/50"
                  placeholder="Enter income name"
                  required
                />
              </div>

              {/* Account Dropdown */}
              <div>
                <label
                  htmlFor="accountInput"
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  <span className="text-green-500 mr-1">💳</span>
                  Account<span className="text-green-500">*</span>
                </label>
                {accountsLoading ? (
                  <div className="animate-pulse h-11 bg-gray-200 rounded-xl"></div>
                ) : accounts.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                    No accounts available. Please create one first.
                  </div>
                ) : (
                  <div className="relative" ref={accountRef}>
                    <div
                      className="flex items-center border border-green-200 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all bg-green-50/50 overflow-hidden h-[42px]"
                      onClick={() =>
                        setShowAccountDropdown(!showAccountDropdown)
                      }
                    >
                      <div className="p-2 m-1.5 rounded-md">
                        <svg
                          className="h-5 w-5 text-green-500"
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
                        {selectedAccount ? (
                          <input
                            type="text"
                            className="w-full py-2.5 px-0 bg-transparent outline-none text-gray-800 font-medium"
                            value={`${selectedAccount.name} (${selectedAccount.amount.toFixed(2)} ${selectedAccount.currency})`}
                            readOnly
                            onClick={() => setShowAccountDropdown(true)}
                          />
                        ) : (
                          <input
                            type="text"
                            value={accountInput}
                            onChange={handleAccountInputChange}
                            className="w-full py-2.5 px-0 bg-transparent outline-none text-gray-800"
                            placeholder="Type to search accounts"
                            onClick={() => setShowAccountDropdown(true)}
                          />
                        )}
                      </div>
                      {(accountInput || selectedAccount) && (
                        <button
                          type="button"
                          className="px-2 text-gray-400 hover:text-gray-600"
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
                          className={`w-4 h-4 transition-transform duration-200 ${
                            showAccountDropdown ? "transform rotate-180" : ""
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

                    {showAccountDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-md max-h-40 overflow-y-auto"
                      >
                        {filteredAccounts.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">
                            No matching accounts
                          </div>
                        ) : (
                          filteredAccounts.map((account) => (
                            <motion.div
                              key={account.id}
                              whileHover={{
                                backgroundColor: "rgba(209, 250, 229, 0.4)",
                              }}
                              className={`px-3 py-2 cursor-pointer text-sm ${
                                selectedAccount?.id === account.id
                                  ? "bg-green-100"
                                  : ""
                              }`}
                              onClick={() => selectAccount(account)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">
                                  {account.name}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
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
                )}
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  <span className="text-green-500 mr-1">📝</span>
                  Description (Optional)
                </label>
                <motion.textarea
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-green-50/50"
                  placeholder="Add income details"
                />
              </div>

              {/* Transaction Summary */}
              {selectedAccount && formData.amount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl shadow-sm mt-4"
                >
                  <h3 className="font-bold text-green-700 mb-3 flex items-center">
                    <span className="mr-1">💰</span>
                    Transaction Summary
                  </h3>

                  {balanceInfo && (
                    <div className="bg-white rounded-lg border border-green-100 shadow-sm overflow-hidden">
                      <div className="grid grid-cols-1 divide-y divide-green-50">
                        {/* Current Balance */}
                        <div className="p-3 flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Current Balance:
                          </span>
                          <span className="font-medium">
                            {balanceInfo.currentBalance.toFixed(2)}{" "}
                            {selectedAccount.currency}
                          </span>
                        </div>

                        {/* Transaction Amount */}
                        <div className="p-3 flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Transaction:
                          </span>
                          <span className="text-green-500 font-medium">
                            +{getTransactionAmount().toFixed(2)}{" "}
                            {selectedAccount.currency}
                          </span>
                        </div>

                        {/* New Balance */}
                        <div className="p-3 flex justify-between items-center bg-green-50/50">
                          <span className="text-sm font-medium text-gray-700">
                            New Balance:
                          </span>
                          <span className="font-bold">
                            {balanceInfo.newBalance.toFixed(2)}{" "}
                            {selectedAccount.currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Currency Conversion Info */}
                  {selectedAccount &&
                    formData.currency !== selectedAccount.currency &&
                    !conversionDetails.error &&
                    !fetchingRates && (
                      <div className="mt-3 text-sm">
                        <div className="flex items-center text-green-700 mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
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
                          <span className="font-medium">
                            Currency Conversion
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="px-3 py-2 bg-white rounded-lg border border-green-200 text-green-900">
                            <p className="text-sm font-medium">
                              {formData.amount.toFixed(2)} {formData.currency}
                            </p>
                          </div>

                          <div className="flex items-center justify-center px-2">
                            <motion.div
                              animate={{ x: [-5, 5, -5] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                              <svg
                                className="h-5 w-5 text-green-500"
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
                              </svg>
                            </motion.div>
                          </div>

                          <div className="px-3 py-2 bg-green-500 text-white rounded-lg shadow-md">
                            <p className="text-sm font-medium">
                              {conversionDetails.convertedAmount.toFixed(2)}{" "}
                              {selectedAccount.currency}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs mt-2 text-green-600 border-t border-green-100 pt-2">
                          <p className="flex items-center">
                            <span className="mr-1">💱</span>
                            Exchange rate: 1 {formData.currency} ={" "}
                            {conversionDetails.rate.toFixed(4)}{" "}
                            {selectedAccount.currency}
                          </p>
                        </div>
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
                  className={`${isMobileScreen ? "w-full" : "flex-1"} py-3 px-4 border-2 border-green-200 rounded-xl text-green-600 font-medium bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all shadow-sm`}
                  disabled={isLoading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.2)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  type="submit"
                  className={`${isMobileScreen ? "w-full" : "flex-1"} py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg`}
                  disabled={isLoading || progressPercentage < 100}
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
                      Adding...
                    </>
                  ) : (
                    "Add Income"
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

export default AddIncomePopup;
