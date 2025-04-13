import { useEffect, useRef, useState } from "react";
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
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
    if (!user) {
      alert("User not found");
      setIsLoading(false);
      return;
    }
    if (!selectedFromAccount || !selectedToAccount) {
      setIsLoading(false);
      return;
    }
    if (selectedFromAccount.id === selectedToAccount.id) {
      alert("You cannot transfer money to the same account.");
      setIsLoading(false);
      return;
    }
    if (formData.amount <= 0) {
      alert("Please enter a valid amount.");
      setIsLoading(false);
      return;
    }
    if (selectedFromAccount.amount < formData.amount) {
      alert("Insufficient funds in the selected account.");
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
    } finally {
      setIsLoading(false);
    }
  };

  const TransferVisualization = () => {
    if (!selectedFromAccount || !selectedToAccount || !formData.amount)
      return null;

    const isExceedingBalance = selectedFromAccount.amount < formData.amount;

    if (isExceedingBalance) {
      return (
        <div className="mt-4 bg-red-50 rounded-lg border border-red-200 p-3">
          <div className="flex items-center text-red-700">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium">Insufficient funds</span>
          </div>
          <p className="mt-1 text-sm text-red-600">
            Available balance: {selectedFromAccount.amount.toFixed(2)}{" "}
            {selectedFromAccount.currency}
            <br />
            Requested amount: {formData.amount.toFixed(2)}{" "}
            {selectedFromAccount.currency}
          </p>
        </div>
      );
    }

    return (
      <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase">
            Transfer Summary
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {/* From Account */}
          <div className="p-3">
            <div className="flex justify-between items-baseline mb-1">
              <div className="text-sm font-medium text-gray-900">
                {selectedFromAccount.name}
              </div>
              <div className="text-sm text-red-600 font-medium">
                -{formData.amount.toFixed(2)} {selectedFromAccount.currency}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Current balance</span>
              <span>
                {selectedFromAccount.amount.toFixed(2)}{" "}
                {selectedFromAccount.currency}
              </span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span>New balance</span>
              <span
                className={
                  selectedFromAccount.amount - formData.amount < 0
                    ? "text-red-600"
                    : ""
                }
              >
                {(selectedFromAccount.amount - formData.amount).toFixed(2)}{" "}
                {selectedFromAccount.currency}
              </span>
            </div>
          </div>

          {/* To Account */}
          <div className="p-3">
            <div className="flex justify-between items-baseline mb-1">
              <div className="text-sm font-medium text-gray-900">
                {selectedToAccount.name}
              </div>
              <div className="text-sm text-green-600 font-medium">
                +{conversionDetails.convertedAmount.toFixed(2)}{" "}
                {selectedToAccount.currency}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Current balance</span>
              <span>
                {selectedToAccount.amount.toFixed(2)}{" "}
                {selectedToAccount.currency}
              </span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span>New balance</span>
              <span className="text-green-600">
                {(
                  selectedToAccount.amount + conversionDetails.convertedAmount
                ).toFixed(2)}{" "}
                {selectedToAccount.currency}
              </span>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {selectedFromAccount.currency !== selectedToAccount.currency && (
            <div className="px-3 py-2 text-xs text-gray-500">
              Rate: 1 {selectedFromAccount.currency} ={" "}
              {conversionDetails.rate.toFixed(4)} {selectedToAccount.currency}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnBackdropClick={true}
      backdropBlur="md"
      animationDuration={150}
    >
      <div
        className={`bg-white rounded-xl shadow-lg mx-auto flex flex-col max-h-[90vh] ${
          isMobileScreen ? "w-[95%] min-w-0" : "max-w-4xl w-full mx-auto"
        }`}
        ref={modalRef}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-5 rounded-t-xl flex items-center flex-shrink-0 sticky top-0 z-10">
          <div className="mr-3 p-2.5 rounded-full bg-blue-700 shadow">
            <svg
              className="h-6 w-6 text-white"
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
          </div>
          <h3 className="text-lg font-bold text-white">Transfer Money</h3>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-grow">
          <form
            onSubmit={handleSubmit}
            className={`${isMobileScreen ? "p-3" : "p-5"}`}
          >
            {/* From Account Dropdown */}
            <div className="mb-4">
              <label
                htmlFor="fromAccountInput"
                className="block text-xs font-semibold text-gray-500 uppercase mb-1"
              >
                From Account*
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-11 bg-gray-200 rounded-md"></div>
              ) : accounts.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                  No accounts available
                </div>
              ) : (
                <div className="relative" ref={fromAccountRef}>
                  <div
                    className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 h-[42px]"
                    onClick={() =>
                      setShowFromAccountDropdown(!showFromAccountDropdown)
                    }
                  >
                    <div className="p-2 bg-gray-50 m-1.5 rounded-md">
                      <svg
                        className="h-5 w-5 text-gray-500"
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
                          className={`w-full py-2.5 px-0 bg-transparent outline-none text-gray-800 font-medium ${
                            isMobileScreen ? "text-sm" : ""
                          }`}
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
                          showFromAccountDropdown ? "transform rotate-180" : ""
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
                    <div className="mt-1 text-sm text-gray-600">
                      Balance: {selectedFromAccount.amount.toFixed(2)}{" "}
                      {selectedFromAccount.currency}
                    </div>
                  )}

                  {showFromAccountDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-40 overflow-y-auto">
                      {filteredFromAccounts.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          No matching accounts
                        </div>
                      ) : (
                        filteredFromAccounts.map((account) => (
                          <div
                            key={account.id}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                              selectedFromAccount?.id === account.id
                                ? "bg-gray-100"
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
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label
                htmlFor="amount"
                className="block text-xs font-semibold text-gray-500 uppercase mb-1"
              >
                Amount*
              </label>
              <div className="flex border border-gray-300 rounded-lg">
                <input
                  type="text"
                  id="amount"
                  name="amount"
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
                  className="w-full px-4 py-3 focus:outline-none rounded-l-lg text-2xl font-bold"
                  placeholder="0.00"
                  disabled={!selectedFromAccount}
                />
                <div className="px-3 py-3 bg-gray-50 text-gray-700 rounded-r-lg border-l border-gray-300">
                  <span className="text-lg font-bold">
                    {selectedFromAccount?.currency || "---"}
                  </span>
                </div>
              </div>
            </div>

            {/* To Account Dropdown */}
            <div className="mb-4">
              <label
                htmlFor="toAccountInput"
                className="block text-xs font-semibold text-gray-500 uppercase mb-1"
              >
                To Account*
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-11 bg-gray-200 rounded-md"></div>
              ) : accounts.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                  No accounts available
                </div>
              ) : (
                <div className="relative" ref={toAccountRef}>
                  <div
                    className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 h-[42px]"
                    onClick={() =>
                      setShowToAccountDropdown(!showToAccountDropdown)
                    }
                  >
                    <div className="p-2 bg-gray-50 m-1.5 rounded-md">
                      <svg
                        className="h-5 w-5 text-gray-500"
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
                          className={`w-full py-2.5 px-0 bg-transparent outline-none text-gray-800 font-medium ${
                            isMobileScreen ? "text-sm" : ""
                          }`}
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
                    <div className="mt-1 text-sm text-gray-600">
                      Balance: {selectedToAccount.amount.toFixed(2)}{" "}
                      {selectedToAccount.currency}
                    </div>
                  )}

                  {showToAccountDropdown && (
                    <div className="absolute z-50 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-40 overflow-y-auto">
                      {filteredToAccounts.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          No matching accounts
                        </div>
                      ) : (
                        filteredToAccounts.map((account) => (
                          <div
                            key={account.id}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                              selectedToAccount?.id === account.id
                                ? "bg-gray-100"
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
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transfer Visualization */}
            {selectedFromAccount &&
              selectedToAccount &&
              formData.amount > 0 && <TransferVisualization />}

            {/* Currency Selector */}
            <div className="mb-4">
              <label
                htmlFor="currency"
                className="block text-xs font-semibold text-gray-500 uppercase mb-1"
              >
                Currency*
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="px-3 py-3 bg-indigo-500 text-white font-medium focus:outline-none"
                disabled={isLoading || fetchingRates}
              >
                {fetchingRates ? (
                  <option>Loading currencies...</option>
                ) : ratesError ? (
                  <option>Error loading currencies</option>
                ) : (
                  Object.keys(rates).map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Buttons */}
            <div
              className={`${
                isMobileScreen
                  ? "flex flex-col-reverse space-y-2 space-y-reverse"
                  : "flex justify-end space-x-3"
              } mt-4 pb-3`}
            >
              <button
                type="button"
                onClick={handleClose}
                className={`${
                  isMobileScreen ? "w-full mt-2" : "px-5"
                } py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium focus:outline-none shadow-sm hover:bg-gray-50`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${
                  isMobileScreen ? "w-full" : "px-5"
                } py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-full text-sm font-medium focus:outline-none shadow-sm hover:from-blue-700 hover:to-blue-900 disabled:opacity-50`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  </span>
                ) : (
                  "Transfer"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default TransferDefaultAccounts;
