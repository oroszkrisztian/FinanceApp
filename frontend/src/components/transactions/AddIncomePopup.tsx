import { useEffect, useState, useRef } from "react";
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

    if (!user) {
      console.error("User not found");
      return;
    }
    if (!selectedAccount) {
      console.error("No account selected");
      return;
    }
    if (formData.amount <= 0) {
      console.error("Invalid amount");
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
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 px-5 py-5 rounded-t-xl flex items-center flex-shrink-0">
          <div className="mr-3 p-2.5 rounded-full bg-green-700 shadow">
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
                d="M7 11l5-5m0 0l5 5m-5-5v12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Add Income</h3>
        </div>

        {/* Content */}
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
                    className={`flex border border-gray-300 rounded-lg focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500 transition-all ${
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
                              setFormData({ ...formData, amount: 0 });
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
                </div>

                {/* Name Input */}
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-gray-500 uppercase mb-1"
                  >
                    Name*
                  </label>
                  <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 bg-transparent border-none outline-none text-gray-800"
                      placeholder="Enter income name"
                      required
                    />
                  </div>
                </div>

                {/* Account Selection */}
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
                        className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500 h-[42px]"
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

                {/* Description Field */}
                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-xs font-semibold text-gray-500 uppercase mb-1"
                  >
                    Description
                  </label>
                  <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500">
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={isMobileScreen ? 2 : 3}
                      className="w-full px-3 py-2.5 bg-transparent border-none outline-none text-gray-800"
                      placeholder="Add income details"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Transaction Summary */}
              {!isMobileScreen && selectedAccount && formData.amount > 0 && (
                <div className="flex-1">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 sticky top-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Transaction Summary
                    </h3>
                    {balanceInfo && (
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
                            <span className="text-green-500 font-medium">
                              +{getTransactionAmount().toFixed(2)}{" "}
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
                    )}

                    {/* Currency Conversion Info */}
                    {selectedAccount &&
                      formData.currency !== selectedAccount.currency &&
                      !conversionDetails.error &&
                      !fetchingRates && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                          <div className="flex items-center mb-2 text-green-700">
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
                </div>
              )}
            </div>

            {/* Transaction Summary for Mobile */}
            {isMobileScreen && selectedAccount && formData.amount > 0 && (
              <div className="mt-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Transaction Summary
                </h3>

                {balanceInfo && (
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
                        <span className="text-green-500 font-medium text-sm">
                          +{getTransactionAmount().toFixed(2)}{" "}
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
                )}

                {/* Currency Conversion Info */}
                {selectedAccount &&
                  formData.currency !== selectedAccount.currency &&
                  !conversionDetails.error &&
                  !fetchingRates && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200 text-xs">
                      <div className="flex items-center text-green-700">
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
                } py-2 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-full text-sm font-medium focus:outline-none shadow-sm hover:from-green-700 hover:to-green-900 disabled:opacity-50`}
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
                    Adding...
                  </span>
                ) : (
                  "Add Income"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default AddIncomePopup;
