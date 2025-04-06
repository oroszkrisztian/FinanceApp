import React, { useState, useEffect, useRef } from "react";
import AnimatedModal from "../animations/BlurPopup";
import { Account } from "../../interfaces/Account";
import { CurrencyType, TransactionType } from "../../interfaces/enums";
import { Budget } from "../../interfaces/Budget";
import {
  fetchExchangeRates,
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
  ExchangeRates,
} from "../../services/exchangeRateService";
import { createExpense } from "../../services/transactionService";
import { useAuth } from "../../context/AuthContext";

interface CreateExpensePopupProps {
  onClose: () => void;
  isOpen: boolean;
  accounts: Account[];
  budgets: Budget[];
  accountsLoading: boolean;
  onSuccess: () => void;
}

const CreateExpensePopup: React.FC<CreateExpensePopupProps> = ({
  onClose,
  isOpen,
  accounts,
  budgets,
  accountsLoading,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    selectedAccount: string;
    selectedBudget: string;
    amount: number;
    currency: CurrencyType;
    type: TransactionType;
  }>({
    name: "",
    description: "",
    selectedAccount: "",
    selectedBudget: "",
    amount: 0,
    currency: CurrencyType.RON,
    type: TransactionType.EXPENSE,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [accountInput, setAccountInput] = useState("");
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [amountString, setAmountString] = useState("");
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
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
      name: "",
      description: "",
      selectedAccount: "",
      selectedBudget: "",
      amount: 0,
      currency: CurrencyType.RON,
      type: TransactionType.EXPENSE,
    });
    setAmountString("");
    setBudgetInput("");
    setAccountInput("");
    setSelectedBudget(null);
    setSelectedAccount(null);
    setShowBudgetDropdown(false);
    setShowAccountDropdown(false);
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
    if (isOpen) {
      fetchRates();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        budgetRef.current &&
        !budgetRef.current.contains(event.target as Node) &&
        showBudgetDropdown
      ) {
        setShowBudgetDropdown(false);
      }
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
  }, [showBudgetDropdown, showAccountDropdown]);

  useEffect(() => {
    updateConversionDetails();
  }, [formData.amount, formData.currency, selectedAccount, rates]);

  const fetchRates = async () => {
    setFetchingRates(true);
    try {
      const exchangeRates = await fetchExchangeRates();
      setRates(exchangeRates);
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
    } finally {
      setFetchingRates(false);
    }
  };

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

  const handleBudgetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBudgetInput(value);
    setSelectedBudget(null);
    setShowBudgetDropdown(true);
    setFormData((prev) => ({ ...prev, selectedBudget: "" }));
  };

  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountInput(value);
    setSelectedAccount(null);
    setShowAccountDropdown(true);
    setFormData((prev) => ({ ...prev, selectedAccount: "" }));
  };

  const selectBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormData((prev) => ({ ...prev, selectedBudget: String(budget.id) }));
    setBudgetInput("");
    setShowBudgetDropdown(false);
  };

  const selectAccount = (account: Account) => {
    setSelectedAccount(account);
    setFormData((prev) => ({ ...prev, selectedAccount: String(account.id) }));
    setAccountInput("");
    setShowAccountDropdown(false);
  };

  const clearBudgetSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBudget(null);
    setBudgetInput("");
    setFormData((prev) => ({ ...prev, selectedBudget: "" }));
  };

  const clearAccountSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAccount(null);
    setAccountInput("");
    setFormData((prev) => ({ ...prev, selectedAccount: "" }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }) as typeof prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    if (user === null) {
      console.error("User not found");
      return;
    }

    try {
      const userId = user.id;

      await createExpense(
        userId,
        formData.name,
        formData.amount,
        formData.currency as CurrencyType,
        parseInt(formData.selectedAccount),
        formData.selectedBudget ? parseInt(formData.selectedBudget) : null,
        formData.description || null
      );

      if (selectedAccount && formData.currency !== selectedAccount.currency) {
        console.log("Currency conversion performed:", {
          fromCurrency: formData.currency,
          toCurrency: selectedAccount.currency,
          originalAmount: formData.amount,
          convertedAmount: conversionDetails.convertedAmount,
          exchangeRate: conversionDetails.rate,
        });
      }

      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Failed to create expense:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBudgets = budgets.filter((budget) =>
    budget.name.toLowerCase().includes(budgetInput.toLowerCase())
  );

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
    isValid: boolean;
    currentBalance: number;
    transactionAmount: number;
    newBalance: number;
    error?: string;
  } | null => {
    if (!selectedAccount || selectedAccount.amount === undefined) return null;

    const transactionAmount = getTransactionAmount();

    const currentBalance = selectedAccount.amount;

    const newBalance = currentBalance - transactionAmount;

    const isValid = newBalance >= 0;

    return {
      isValid,
      currentBalance,
      transactionAmount,
      newBalance,
      error: isValid ? undefined : "Insufficient funds",
    };
  };

  const balanceInfo = selectedAccount ? calculateNewBalance() : null;

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
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 px-5 py-5 rounded-t-xl flex items-center flex-shrink-0 sticky top-0 z-10">
          <div className="mr-3 p-2.5 rounded-full bg-red-700 shadow">
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
                d="M17 13l-5 5m0 0l-5-5m5 5V6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Add an Expense</h3>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-grow">
          <form
            onSubmit={handleSubmit}
            className={`${isMobileScreen ? "p-3" : "p-5"}`}
          >
            <div className={`${!isMobileScreen ? "flex gap-6" : ""}`}>
              {/* Left Column - Form Fields */}
              <div className={`${!isMobileScreen ? "flex-1" : ""}`}>
                {/* Amount Input with Currency */}
                <div className="mb-4">
                  <div
                    className={`flex border border-gray-300 rounded-lg focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500 transition-all ${
                      isMobileScreen ? "flex-col" : ""
                    }`}
                  >
                    <div
                      className={`relative ${
                        isMobileScreen ? "w-full" : "flex-grow"
                      }`}
                    >
                      <input
                        type="text"
                        id="amount"
                        name="amount"
                        value={amountString}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (
                            value === "" ||
                            /^[0-9]*([.,][0-9]*)?$/.test(value)
                          ) {
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
                        className={`w-full px-4 py-3 focus:outline-none ${
                          isMobileScreen ? "rounded-t-lg" : "rounded-l-lg"
                        } border-none ${
                          isMobileScreen ? "text-xl" : "text-2xl"
                        } font-bold text-gray-800`}
                        placeholder="0.00"
                        autoComplete="off"
                        required
                      />
                    </div>

                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className={`${
                        isMobileScreen
                          ? "w-full px-4 py-2 rounded-b-lg text-center border-t border-gray-200"
                          : "px-3 py-3 bg-gray-50 text-gray-700 focus:outline-none rounded-r-lg border-l border-gray-300"
                      } ${isMobileScreen ? "text-base" : "text-lg"} font-bold`}
                      required
                    >
                      {Object.values(CurrencyType).map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Name Field */}
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-gray-500 uppercase mb-1"
                  >
                    Expense Name*
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500">
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
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full py-2.5 px-2 bg-transparent outline-none text-gray-800"
                      placeholder="Enter expense name"
                      required
                    />
                  </div>
                </div>

                {/* Account Dropdown */}
                <div className="mb-4">
                  <label
                    htmlFor="accountInput"
                    className="block text-xs font-semibold text-gray-500 uppercase mb-1"
                  >
                    Account*
                  </label>
                  {accountsLoading ? (
                    <div className="animate-pulse h-11 bg-gray-200 rounded-md"></div>
                  ) : accounts.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                      No accounts available. Please create one first.
                    </div>
                  ) : (
                    <div className="relative" ref={accountRef}>
                      <div
                        className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500 h-[42px]"
                        onClick={() =>
                          setShowAccountDropdown(!showAccountDropdown)
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
                          {selectedAccount ? (
                            <input
                              type="text"
                              className={`w-full py-2.5 px-0 bg-transparent outline-none text-gray-800 font-medium ${
                                isMobileScreen ? "text-sm" : ""
                              }`}
                              value={[
                                selectedAccount.name +
                                  " (" +
                                  selectedAccount.amount.toFixed(2) +
                                  " " +
                                  selectedAccount.currency +
                                  ")",
                              ]}
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
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-40 overflow-y-auto">
                          {filteredAccounts.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">
                              No matching accounts
                            </div>
                          ) : (
                            filteredAccounts.map((account) => (
                              <div
                                key={account.id}
                                className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                                  selectedAccount?.id === account.id
                                    ? "bg-gray-100"
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
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Budget Dropdown */}
                <div className="mb-4">
                  <label
                    htmlFor="budgetInput"
                    className="block text-xs font-semibold text-gray-500 uppercase mb-1"
                  >
                    Budget
                  </label>
                  {budgets.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                      No budgets available.
                    </div>
                  ) : (
                    <div className="relative" ref={budgetRef}>
                      <div
                        className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500 h-[42px]"
                        onClick={() =>
                          setShowBudgetDropdown(!showBudgetDropdown)
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
                              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-grow">
                          {selectedBudget ? (
                            <input
                              type="text"
                              className={`w-full py-2.5 px-0 bg-transparent outline-none text-gray-800 font-medium ${
                                isMobileScreen ? "text-sm" : ""
                              }`}
                              value={selectedBudget.name}
                              readOnly
                              onClick={() => setShowBudgetDropdown(true)}
                            />
                          ) : (
                            <input
                              type="text"
                              value={budgetInput}
                              onChange={handleBudgetInputChange}
                              className="w-full py-2.5 px-0 bg-transparent outline-none text-gray-800"
                              placeholder="Type to search budgets"
                              onClick={() => setShowBudgetDropdown(true)}
                            />
                          )}
                        </div>
                        {(budgetInput || selectedBudget) && (
                          <button
                            type="button"
                            className="px-2 text-gray-400 hover:text-gray-600"
                            onClick={clearBudgetSelection}
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
                              showBudgetDropdown ? "transform rotate-180" : ""
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

                      {showBudgetDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-28 overflow-y-auto">
                          {filteredBudgets.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">
                              No matching budgets
                            </div>
                          ) : (
                            filteredBudgets.map((budget) => (
                              <div
                                key={budget.id}
                                className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                                  selectedBudget?.id === budget.id
                                    ? "bg-gray-100"
                                    : ""
                                }`}
                                onClick={() => selectBudget(budget)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium truncate">
                                    {budget.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    {budget.currentSpent !== undefined
                                      ? `${budget.currentSpent.toFixed(2)} ${budget.currency}`
                                      : ""}
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

                {/* Description Field */}
                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-xs font-semibold text-gray-500 uppercase mb-1"
                  >
                    Description
                  </label>
                  <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500">
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={isMobileScreen ? 2 : 3}
                      className="w-full px-3 py-2.5 bg-transparent border-none outline-none text-gray-800"
                      placeholder="Add expense details"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Transaction Summary (only shown on desktop) */}
              {!isMobileScreen && selectedAccount && formData.amount > 0 && (
                <div className="flex-1">
                  {selectedAccount && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 sticky top-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Transaction Summary
                      </h3>

                      {formData.amount > 0 ? (
                        balanceInfo && !balanceInfo.isValid ? (
                          // Insufficient funds error state
                          <div className="mb-4">
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="flex items-center text-red-600 font-medium mb-2">
                                <svg
                                  className="w-5 h-5 mr-2 text-red-500"
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
                              <div className="bg-white p-2 rounded-lg border border-red-100">
                                <p className="text-sm text-gray-700">
                                  Amount exceeded by:
                                  <span className="ml-2 font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                                    {Math.abs(balanceInfo.newBalance).toFixed(
                                      2
                                    )}{" "}
                                    {selectedAccount.currency}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : balanceInfo ? (
                          // Valid transaction summary
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
                            <div className="grid grid-cols-1 divide-y divide-gray-100">
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
                                <span className="text-red-500 font-medium">
                                  -{balanceInfo.transactionAmount.toFixed(2)}{" "}
                                  {selectedAccount.currency}
                                </span>
                              </div>

                              {/* New Balance */}
                              <div className="p-3 flex justify-between items-center bg-gray-50">
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
                        ) : null
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                          Enter an amount to see transaction details
                        </div>
                      )}

                      {/* Currency Conversion Info */}
                      {selectedAccount &&
                        formData.currency !== selectedAccount.currency &&
                        !conversionDetails.error &&
                        !fetchingRates && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                            <div className="flex items-center mb-2 text-blue-700">
                              <svg
                                className="h-4 w-4 mr-2"
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
                            <div className="text-xs text-gray-600">
                              <p className="mb-1">
                                1 {formData.currency} ={" "}
                                {conversionDetails.rate.toFixed(4)}{" "}
                                {selectedAccount.currency}
                              </p>
                              <p>
                                {formData.amount} {formData.currency} ={" "}
                                {conversionDetails.convertedAmount.toFixed(2)}{" "}
                                {selectedAccount.currency}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transaction Summary for Mobile */}
            {isMobileScreen && selectedAccount && formData.amount > 0 && (
              <div className="mt-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Transaction Summary
                </h3>

                {balanceInfo && !balanceInfo.isValid ? (
                  // Insufficient funds error state
                  <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center text-red-600 font-medium mb-1 text-sm">
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
                    <div className="bg-white p-2 rounded-lg border border-red-100">
                      <p className="text-xs text-gray-700">
                        Amount exceeded by:
                        <span className="ml-1 font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs">
                          {Math.abs(balanceInfo.newBalance).toFixed(2)}{" "}
                          {selectedAccount.currency}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : balanceInfo ? (
                  // Valid transaction summary
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 divide-y divide-gray-100">
                      {/* Current Balance */}
                      <div className="p-2 flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          Current Balance:
                        </span>
                        <span className="font-medium text-sm">
                          {balanceInfo.currentBalance.toFixed(2)}{" "}
                          {selectedAccount.currency}
                        </span>
                      </div>

                      {/* Transaction Amount */}
                      <div className="p-2 flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          Transaction:
                        </span>
                        <span className="text-red-500 font-medium text-sm">
                          -{balanceInfo.transactionAmount.toFixed(2)}{" "}
                          {selectedAccount.currency}
                        </span>
                      </div>

                      {/* New Balance */}
                      <div className="p-2 flex justify-between items-center bg-gray-50">
                        <span className="text-xs font-medium text-gray-700">
                          New Balance:
                        </span>
                        <span className="font-bold text-sm">
                          {balanceInfo.newBalance.toFixed(2)}{" "}
                          {selectedAccount.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Currency Conversion Info */}
                {selectedAccount &&
                  formData.currency !== selectedAccount.currency &&
                  !conversionDetails.error &&
                  !fetchingRates && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                      <div className="flex items-center text-blue-700">
                        <svg
                          className="h-3 w-3 mr-1"
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
                          {formData.amount} {formData.currency} ={" "}
                          {conversionDetails.convertedAmount.toFixed(2)}{" "}
                          {selectedAccount.currency}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            )}

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
                } py-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full text-sm font-medium focus:outline-none shadow-sm hover:from-red-700 hover:to-red-900 disabled:opacity-50`}
                disabled={
                  isLoading || (balanceInfo ? !balanceInfo.isValid : false)
                }
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
                    Creating...
                  </span>
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default CreateExpensePopup;
