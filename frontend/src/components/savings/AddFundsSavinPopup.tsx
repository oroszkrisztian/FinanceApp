import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ErrorState from "../ErrorState";
import { TransactionType } from "../../interfaces/enums";
import { useAuth } from "../../context/AuthContext";
import { fetchDefaultAccounts } from "../../services/accountService";
import { Account } from "../../interfaces/Account";
import { addFundsSaving } from "../../services/transactionService";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
} from "../../services/exchangeRateService";

interface AddFundsPopupProps {
  isOpen: boolean;
  account: any;
  onSuccess: (accountId: number) => void;
  onClose: () => void;
}

const AddFundsSavingPopup: React.FC<AddFundsPopupProps> = ({
  isOpen,
  account,
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [amountTransfer, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultAccounts, setDefaultAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [selectedSourceAccount, setSelectedSourceAccount] = useState<
    number | null
  >(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [sourceAccountCurrency, setSourceAccountCurrency] = useState<
    string | null
  >(null);
  const [isClosing, setIsClosing] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] =
    useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  const parseNumberInput = (value: string) => {
    if (!value) return NaN;
    return parseFloat(value.toString().replace(",", "."));
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
    const loadAccounts = async () => {
      if (!user?.id) return;
      setLoadingAccounts(true);
      try {
        const accounts = await fetchDefaultAccounts(user.id);
        setDefaultAccounts(accounts);
        setFilteredAccounts(accounts);
      } catch (err) {
        console.error("Error loading accounts:", err);
        setError("Failed to load source accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadAccounts();
  }, [user?.id]);

  useEffect(() => {
    const loadExchangeRates = async () => {
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
    loadExchangeRates();
  }, []);

  useEffect(() => {
    if (selectedSourceAccount) {
      const sourceAccount = defaultAccounts.find(
        (acc) => acc.id === selectedSourceAccount
      );
      if (sourceAccount) {
        setSourceAccountCurrency(sourceAccount.currency);
        setDisplayCurrency(sourceAccount.currency);
      }
    } else {
      setSourceAccountCurrency(null);
      setDisplayCurrency(account?.currency || null);
    }
  }, [selectedSourceAccount, defaultAccounts, account?.currency]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchInput.trim() === "") {
      setFilteredAccounts(defaultAccounts);
    } else {
      const filtered = defaultAccounts.filter((account) =>
        account.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  }, [searchInput, defaultAccounts]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setShowAccountDropdown(true);
  };

  const selectAccount = (accountId: number) => {
    setSelectedSourceAccount(accountId);
    setSearchInput("");
    setShowAccountDropdown(false);
  };

  const clearSelectedAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSourceAccount(null);
    setSearchInput("");
  };

  const getTargetAmount = (): number => {
    if (!amountTransfer || !sourceAccountCurrency || !account?.currency)
      return 0;
    const amountValue = parseNumberInput(amountTransfer);
    if (isNaN(amountValue)) return 0;

    if (sourceAccountCurrency === account.currency) {
      return amountValue;
    } else {
      return convertAmount(
        amountValue,
        sourceAccountCurrency,
        account.currency,
        rates
      );
    }
  };

  const getWithdrawAmount = (): number => {
    if (!amountTransfer || !sourceAccountCurrency) return 0;
    const amountValue = parseNumberInput(amountTransfer);
    return isNaN(amountValue) ? 0 : amountValue;
  };

  const calculateNewTargetBalance = (): number | null => {
    if (!account || account.amount === undefined) return null;
    return account.amount + getTargetAmount();
  };

  const calculateSourceAccountNewBalance = (): number | null => {
    if (!selectedSourceAccount) return null;
    const sourceAccount = defaultAccounts.find(
      (acc) => acc.id === selectedSourceAccount
    );
    if (!sourceAccount || sourceAccount.amount === undefined) return null;
    return sourceAccount.amount - getWithdrawAmount();
  };

  const calculateTargetAmountExceed = () => {
    if (!account?.savingAccount?.targetAmount) return null;

    const targetAmount = account.savingAccount.targetAmount;
    const currentAmount = account.amount || 0;
    const amountToAdd = Math.round(getTargetAmount());
    const newAmount = Math.round(currentAmount + amountToAdd);

    if (newAmount > targetAmount) {
      const excessAmount = newAmount - targetAmount;
      const roundedExcess = Math.round(excessAmount * 100) / 100;
      const maxAllowedToAdd = Math.max(0, targetAmount - currentAmount);

      const excessInSourceCurrency = sourceAccountCurrency
        ? convertAmount(
            roundedExcess,
            account.currency,
            sourceAccountCurrency,
            rates
          )
        : roundedExcess;

      const maxAllowedInSourceCurrency = sourceAccountCurrency
        ? convertAmount(
            maxAllowedToAdd,
            account.currency,
            sourceAccountCurrency,
            rates
          )
        : maxAllowedToAdd;

      return {
        exceeded: true,
        excessAmount: roundedExcess,
        excessAmountInSourceCurrency: excessInSourceCurrency,
        maxAllowedToAdd: maxAllowedToAdd,
        maxAllowedToAddInSourceCurrency: maxAllowedInSourceCurrency,
      };
    }

    return { exceeded: false };
  };

  const targetCheck = calculateTargetAmountExceed();
  const newTargetBalance = calculateNewTargetBalance();
  const sourceAccountNewBalance = calculateSourceAccountNewBalance();
  const sourceAccount = defaultAccounts.find(
    (acc) => acc.id === selectedSourceAccount
  );
  const withdrawAmount = getWithdrawAmount();

  const getDisplayAmount = (amount: number, fromCurrency: string): string => {
    if (sourceAccountCurrency && sourceAccountCurrency !== fromCurrency) {
      return `${convertAmount(amount, fromCurrency, sourceAccountCurrency, rates).toFixed(2)} ${sourceAccountCurrency}`;
    } else {
      return `${amount.toFixed(2)} ${fromCurrency}`;
    }
  };

  const handleSuccess = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const amountToAdd = parseFloat(amountTransfer);
      if (isNaN(amountToAdd) || amountToAdd <= 0) {
        throw new Error("Please enter a valid amount.");
      }

      if (!sourceAccount) {
        throw new Error("Please select a source account.");
      }

      if (!user) {
        throw new Error("User not found");
      }

      const targetCheck = calculateTargetAmountExceed();
      if (targetCheck?.exceeded) {
        throw new Error(
          `This transfer would exceed the target amount by ${(targetCheck.excessAmount ?? 0).toFixed(2)} ${account.currency}. Maximum amount you can add is ${(targetCheck.maxAllowedToAdd ?? 0).toFixed(2)} ${account.currency}.`
        );
      }

      const convertedAmount = convertAmount(
        amountToAdd,
        sourceAccount.currency,
        account.currency,
        rates
      );

      await addFundsSaving(
        user.id,
        convertedAmount,
        sourceAccount.id,
        account.id,
        TransactionType.TRANSFER,
        account.currency
      );

      setLoading(false);
      handleClose();
      onSuccess(account.id); 
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to add funds");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSuccess();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  if (error) return <ErrorState error={error} />;

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
              className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl pointer-events-auto"
              style={{ maxWidth: isMobileScreen ? "auto" : "500px" ,
                        minWidth: isMobileScreen ? "auto" : "400px"
              }}
            >
              {/* Header with fixed position */}
              <div className="bg-indigo-500 h-20 relative sticky top-0 z-10">
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
                        className="w-6 h-6 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </motion.svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Add Funds 💰
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div
                className="p-6 overflow-y-auto"
                style={{ maxHeight: "calc(90vh - 140px)" }}
              >
                {/* Account Name Display */}
                <div className="mb-5 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-indigo-800">
                      {account?.name || "Account"}
                    </p>
                    <div className="bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100">
                      <p className="text-indigo-700 font-medium">
                        {sourceAccountCurrency &&
                        sourceAccountCurrency !== account?.currency
                          ? getDisplayAmount(
                              account?.amount || 0,
                              account?.currency
                            )
                          : `${account?.amount?.toFixed(2) || "0.00"} ${account?.currency || "USD"}`}
                      </p>
                    </div>
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
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="sourceAccount"
                      className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                    >
                      <span className="text-indigo-500 mr-1">🏦</span>
                      Source Account<span className="text-indigo-500">*</span>
                    </label>

                    {/* Searchable Account Selection */}
                    <div ref={searchRef} className="relative">
                      <motion.div
                        whileFocus={{ scale: 1.0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                        className="flex items-center bg-white border border-indigo-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50"
                        onClick={() =>
                          setShowAccountDropdown(!showAccountDropdown)
                        }
                      >
                        <div className="px-3 text-indigo-500">
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

                        {selectedSourceAccount ? (
                          <div className="flex-1 py-3 px-1">
                            <span className="font-normal text-sm text-gray-900">
                              {
                                defaultAccounts.find(
                                  (acc) => acc.id === selectedSourceAccount
                                )?.name
                              }{" "}
                              (
                              {defaultAccounts
                                .find((acc) => acc.id === selectedSourceAccount)
                                ?.amount?.toFixed(2)}{" "}
                              {
                                defaultAccounts.find(
                                  (acc) => acc.id === selectedSourceAccount
                                )?.currency
                              }
                              )
                            </span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            className="flex-1 py-3 bg-transparent outline-none text-gray-900 font-medium"
                            placeholder="Search accounts..."
                            value={searchInput}
                            onChange={handleSearchInputChange}
                            onClick={() => setShowAccountDropdown(true)}
                          />
                        )}

                        {(searchInput || selectedSourceAccount) && (
                          <button
                            type="button"
                            className="px-3 text-gray-400 hover:text-gray-600"
                            onClick={clearSelectedAccount}
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
                          className="absolute z-[100]"
                          style={{
                            marginTop: "2px",
                            width: "100%",
                            backgroundColor: "white",
                            borderRadius: "0.75rem",
                            boxShadow:
                              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            border: "1px solid #e0e7ff",
                            maxHeight: "14rem",
                            overflow: "auto",
                          }}
                        >
                          {loadingAccounts ? (
                            <div className="p-3 text-sm text-gray-500 flex items-center justify-center">
                              <svg
                                className="animate-spin h-4 w-4 mr-2 text-indigo-500"
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
                              Loading accounts...
                            </div>
                          ) : filteredAccounts.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                              No matching accounts found
                            </div>
                          ) : (
                            filteredAccounts.map((account, index) => (
                              <motion.div
                                key={account.id}
                                whileHover={{
                                  backgroundColor: "rgba(79, 70, 229, 0.05)",
                                }}
                                className={`p-3 cursor-pointer text-sm ${
                                  selectedSourceAccount === account.id
                                    ? "bg-indigo-50"
                                    : ""
                                } ${
                                  index === filteredAccounts.length - 1
                                    ? ""
                                    : "border-b border-indigo-50"
                                }`}
                                onClick={() => selectAccount(account.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {account.name}
                                  </span>
                                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
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

                  {selectedSourceAccount &&
                    sourceAccountCurrency !== account?.currency && (
                      <div className="px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-100">
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 text-indigo-500"
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
                          Values displayed in {sourceAccountCurrency} for
                          clarity
                        </span>
                      </div>
                    )}

                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                    >
                      <span className="text-indigo-500 mr-1">💰</span>
                      Amount to Add<span className="text-indigo-500">*</span>
                    </label>
                    <div className="relative">
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                        type="text"
                        id="amount"
                        name="amount"
                        value={amountTransfer}
                        onChange={(e) => {
                          const value = e.target.value;
                          const regex = /^[0-9]*([.,][0-9]*)?$/;
                          if (value === "" || regex.test(value))
                            setAmount(value);
                        }}
                        className="w-full border border-indigo-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                        placeholder={"0.00"}
                        autoComplete="off"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span className="text-indigo-600 font-medium">
                          {sourceAccountCurrency || account?.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedSourceAccount && sourceAccount && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="text-indigo-500 mr-1">🔄</span>
                        Transaction Summary
                      </h3>

                      {targetCheck?.exceeded &&
                      sourceAccountNewBalance !== null &&
                      sourceAccountNewBalance > 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm"
                        >
                          <div className="flex items-center text-yellow-700 font-medium mb-3">
                            <svg
                              className="w-5 h-5 mr-2 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Target amount will be exceeded
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-yellow-100">
                            <p className="text-sm flex items-center justify-between">
                              <span>Max allowed to add:</span>
                              <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                {sourceAccountCurrency === account.currency
                                  ? (targetCheck.maxAllowedToAdd ?? 0).toFixed(
                                      2
                                    )
                                  : (
                                      targetCheck.maxAllowedToAddInSourceCurrency ??
                                      0
                                    ).toFixed(2)}{" "}
                                {sourceAccountCurrency}
                              </span>
                            </p>
                          </div>
                        </motion.div>
                      ) : sourceAccountNewBalance !== null &&
                        sourceAccountNewBalance <= 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-4 bg-red-50 rounded-xl border border-red-200 shadow-sm"
                        >
                          <div className="flex items-center text-red-600 font-medium mb-3">
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
                          <div className="bg-white p-3 rounded-lg border border-red-100">
                            <p className="text-sm text-gray-700">
                              Available in {sourceAccount.name}:
                              <span className="ml-2 font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                {sourceAccount.amount?.toFixed(2)}{" "}
                                {sourceAccountCurrency}
                              </span>
                            </p>
                            <p className="text-sm text-gray-700 mt-2">
                              Balance exceeded by:
                              <span className="ml-2 font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                {Math.abs(sourceAccountNewBalance).toFixed(2)}{" "}
                                {sourceAccountCurrency}
                              </span>
                            </p>
                          </div>
                        </motion.div>
                      ) : amountTransfer &&
                        newTargetBalance &&
                        !isNaN(parseNumberInput(amountTransfer)) &&
                        sourceAccountNewBalance !== null ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-3"
                        >
                          {/* Main summary card */}
                          <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-indigo-100">
                              {/* From column */}
                              <div className="p-4">
                                <div className="text-xs text-gray-500 mb-2 flex items-center">
                                  {sourceAccount.name}
                                </div>
                                <div className="font-bold text-red-500 text-lg">
                                  -{withdrawAmount.toFixed(2)}{" "}
                                  {sourceAccountCurrency}
                                </div>
                                <div className="text-xs text-gray-500 mt-2 flex items-center">
                                  <span className="mr-1">Balance after:</span>
                                  <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                    {sourceAccountNewBalance.toFixed(2)}{" "}
                                    {sourceAccountCurrency}
                                  </span>
                                </div>
                              </div>

                              {/* To column */}
                              <div className="p-4">
                                <div className="text-xs text-gray-500 mb-2 flex items-center">
                                  {account.name}
                                </div>
                                <div className="font-bold text-green-500 text-lg">
                                  +
                                  {(
                                    newTargetBalance - (account.amount || 0)
                                  ).toFixed(2)}{" "}
                                  {account.currency}
                                </div>
                                <div className="text-xs text-gray-500 mt-2 flex items-center">
                                  <span className="mr-1">Balance after:</span>
                                  <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                    {(newTargetBalance || 0).toFixed(2)}{" "}
                                    {account.currency}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Exchange rate info (only if currencies differ) */}
                          {sourceAccountCurrency &&
                            account?.currency &&
                            sourceAccountCurrency !== account.currency && (
                              <div className="flex items-center text-xs text-gray-500 bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-3">
                                <svg
                                  className="h-4 w-4 mr-2 text-indigo-500"
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
                                  1 {sourceAccountCurrency} ={" "}
                                  {(
                                    rates[sourceAccountCurrency] /
                                    rates[account?.currency]
                                  ).toFixed(4)}{" "}
                                  {account?.currency}
                                </div>
                              </div>
                            )}
                        </motion.div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                          <p className="text-sm text-gray-500">
                            Enter an amount to see transaction details
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Buttons moved here */}
                  <div className="flex gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.1 }}
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 border-2 border-indigo-200 rounded-xl text-indigo-600 font-medium bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all shadow-sm"
                      disabled={loading}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.2)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.1 }}
                      type="submit"
                      className="flex-1 py-3 px-4 bg-indigo-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                      disabled={
                        loading ||
                        fetchingRates ||
                        (sourceAccountNewBalance !== null &&
                          sourceAccountNewBalance <= 0) ||
                        targetCheck?.exceeded ||
                        !selectedSourceAccount
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
                          Adding...
                        </>
                      ) : (
                        "Add Funds"
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

export default AddFundsSavingPopup;
