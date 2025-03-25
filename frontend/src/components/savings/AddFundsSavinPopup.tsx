import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ErrorState from "../ErrorState";
import { TransactionType } from "../../interfaces/enums";
import { useAuth } from "../../context/AuthContext";
import { fetchDefaultAccounts } from "../../services/accountService";
import { Account } from "../../interfaces/Account";
import { addFundsSaving } from "../../services/transactionService";
import AnimatedModal from "../animations/BlurPopup";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
} from "../../services/exchangeRateService";

interface AddFundsPopupProps {
  isOpen: boolean;
  account: any;
  onSuccess: () => void;
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

  const parseNumberInput = (value: string) => {
    if (!value) return NaN;
    return parseFloat(value.toString().replace(",", "."));
  };

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

  // Filter accounts based on search input
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
    const amountToAdd = getTargetAmount();
    const newAmount = currentAmount + amountToAdd;

    if (newAmount > targetAmount) {
      const excessAmount = newAmount - targetAmount;
      const maxAllowedToAdd = Math.max(0, targetAmount - currentAmount);

      const excessInSourceCurrency = sourceAccountCurrency
        ? convertAmount(
            excessAmount,
            account.currency,
            sourceAccountCurrency,
            rates
          )
        : excessAmount;

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
        excessAmount: excessAmount,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!amountTransfer || parseNumberInput(amountTransfer) <= 0)
        throw new Error("Please enter a valid amount");

      if (!user?.id) throw new Error("User id not found");

      if (!selectedSourceAccount)
        throw new Error("Please select a source account");

      const sourceAccount = defaultAccounts.find(
        (acc) => acc.id === selectedSourceAccount
      );

      if (!sourceAccount) throw new Error("Source account not found");

      const amountToAdd = parseNumberInput(amountTransfer);

      if (amountToAdd > (sourceAccount.amount || 0))
        throw new Error(
          `Insufficient funds in source account. Need ${amountToAdd.toFixed(2)} ${sourceAccount.currency}.`
        );

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
      onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to add funds");
    }
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
            <div className="bg-indigo-50 w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg
                className="w-5 h-5 text-indigo-600"
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
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 break-words">
                Add Funds to {account?.name || "Account"}
              </h2>
              <p className="text-indigo-600 mt-1">
                Current balance:{" "}
                {sourceAccountCurrency &&
                sourceAccountCurrency !== account?.currency
                  ? getDisplayAmount(account?.amount || 0, account?.currency)
                  : `${account?.amount?.toFixed(2) || "0.00"} ${account?.currency || "USD"}`}
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="sourceAccount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Source Account<span className="text-red-500">*</span>
            </label>

            {/* Searchable Account Selection */}
            <div ref={searchRef} className="relative">
              <div
                className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent transition-all"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              >
                <div className="px-3 text-gray-500">
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
                    <span className="font-medium text-gray-900">
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
              </div>

              {showAccountDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-28 overflow-auto">
                  {loadingAccounts ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Loading accounts...
                    </div>
                  ) : filteredAccounts.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No matching accounts found
                    </div>
                  ) : (
                    filteredAccounts.map((account, index) => (
                      <div
                        key={account.id}
                        className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                          selectedSourceAccount === account.id
                            ? "bg-indigo-10t0"
                            : ""
                        } ${
                          index === filteredAccounts.length - 1
                            ? ""
                            : "border-b border-gray-100"
                        }`}
                        onClick={() => selectAccount(account.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{account.name}</span>
                          <span className="text-xs text-gray-500">
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
          </div>

          {selectedSourceAccount &&
            sourceAccountCurrency != account?.currency && (
              <div className="mt-1 text-bs text-indigo-600">
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
                  All values will be displayed in {sourceAccountCurrency} for
                  clarity
                </span>
              </div>
            )}

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount to Add<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="amount"
                name="amount"
                value={amountTransfer}
                onChange={(e) => {
                  const value = e.target.value;
                  const regex = /^[0-9]*([.,][0-9]*)?$/;
                  if (value === "" || regex.test(value)) setAmount(value);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                placeholder={"0.00"}
                autoComplete="off"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-gray-500">
                  {sourceAccountCurrency || account?.currency}
                </span>
              </div>
            </div>

            {sourceAccountCurrency &&
              sourceAccountCurrency !== account?.currency &&
              !isNaN(parseNumberInput(amountTransfer)) && (
                <p className="text-sm text-indigo-600 mt-1">
                  This equals{" "}
                  {convertAmount(
                    parseNumberInput(amountTransfer),
                    sourceAccountCurrency,
                    account.currency,
                    rates
                  ).toFixed(2)}{" "}
                  {account.currency}
                </p>
              )}
          </div>

          {selectedSourceAccount !== undefined && (
            <div className="mb-2 p-2 bg-green-50 border border-indigo-100 rounded-lg text-sm text-center">
              <p className="text-green-600 font-medium">
                {sourceAccountCurrency &&
                sourceAccountCurrency !== account.currency
                  ? convertAmount(
                      Math.max(
                        0,
                        account.savingAccount.targetAmount -
                          account.amount -
                          getTargetAmount()
                      ),
                      account.currency,
                      sourceAccountCurrency,
                      rates
                    ).toFixed(2)
                  : Math.max(
                      0,
                      account.savingAccount.targetAmount -
                        account.amount -
                        getTargetAmount()
                    ).toFixed(2)}{" "}
                {sourceAccountCurrency || account.currency} more needed to reach
                target
              </p>
            </div>
          )}

          {selectedSourceAccount && sourceAccount && (
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Transaction Summary
              </div>

              {targetCheck?.exceeded &&
              sourceAccountNewBalance !== null &&
              sourceAccountNewBalance > 0 ? (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-base">
                  <div className="flex items-center text-yellow-700 font-medium mb-1">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Target amount will be exceeded
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-700 mt-1">
                      <span className="font-medium text-indigo-600">
                        Max allowed to add:{" "}
                        {sourceAccountCurrency === account.currency
                          ? (targetCheck.maxAllowedToAdd ?? 0).toFixed(2)
                          : (
                              targetCheck.maxAllowedToAddInSourceCurrency ?? 0
                            ).toFixed(2)}{" "}
                        {sourceAccountCurrency}
                      </span>
                    </p>
                  </div>
                </div>
              ) : sourceAccountNewBalance !== null &&
                sourceAccountNewBalance <= 0 ? (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-base">
                  <div className="flex items-center text-red-700 font-medium mb-1">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Insufficient balance
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-700">
                      Available in {sourceAccount.name}:{" "}
                      {sourceAccount.amount?.toFixed(2)} {sourceAccountCurrency}
                    </p>
                    <p className="text-gray-700 mt-1">
                      Needed:{" "}
                      <span className="font-medium">
                        {Math.abs(sourceAccountNewBalance).toFixed(2)}{" "}
                        {sourceAccountCurrency} more
                      </span>
                    </p>
                  </div>
                </div>
              ) : amountTransfer &&
                !isNaN(parseNumberInput(amountTransfer)) &&
                sourceAccountNewBalance !== null ? (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">Will withdraw:</span>
                    <span className="font-medium text-gray-900">
                      {withdrawAmount.toFixed(2)} {sourceAccountCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 truncate pr-2">
                      {sourceAccount.name}:
                    </span>
                    <span className="font-medium text-gray-900">
                      {sourceAccount.amount?.toFixed(2)} →{" "}
                      {sourceAccountNewBalance.toFixed(2)}{" "}
                      {sourceAccountCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600 truncate pr-2">
                      {account.name}:
                    </span>
                    <span className="font-medium text-indigo-600">
                      {(account.amount || 0).toFixed(2)} →{" "}
                      {(newTargetBalance || 0).toFixed(2)} {account.currency}
                    </span>
                  </div>

                  {sourceAccountCurrency &&
                    account?.currency &&
                    sourceAccountCurrency !== account.currency && (
                      <div className="mt-1 px-1 py-1 bg-indigo-50 border border-indigo-100 rounded text-xs sm:text-sm text-indigo-700">
                        Exchange rate: 1 {sourceAccountCurrency} ={" "}
                        {(
                          rates[sourceAccountCurrency] /
                          rates[account?.currency]
                        ).toFixed(4)}{" "}
                        {account?.currency}
                      </div>
                    )}
                </div>
              ) : (
                <div className="p-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-center">
                  <p>Enter an amount to see transaction details</p>
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
              type="submit"
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={
                loading ||
                fetchingRates ||
                (sourceAccountNewBalance !== null &&
                  sourceAccountNewBalance <= 0) ||
                targetCheck?.exceeded
              }
            >
              Add Funds
            </motion.button>
          </div>
        </form>
      </div>
    </AnimatedModal>
  );
};

export default AddFundsSavingPopup;
