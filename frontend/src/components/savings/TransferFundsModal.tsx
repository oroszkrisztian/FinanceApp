import { Account } from "../../interfaces/Account";
import AnimatedModal from "../animations/BlurPopup";
import { useAuth } from "../../context/AuthContext";
import { CurrencyType, TransactionType } from "../../interfaces/enums";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  convertAmount,
  ExchangeRates,
  fetchExchangeRates,
} from "../../services/exchangeRateService";
import ErrorState from "../ErrorState";
import { addFundsDefault } from "../../services/transactionService";

interface TransferFromSavingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSaving: Account;
  accountsDefault: Account[];
  onSuccess: () => void;
}

const TransferFromSavingModal: React.FC<TransferFromSavingModalProps> = ({
  isOpen,
  onClose,
  selectedSaving,
  accountsDefault,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [amountTransfer, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [selectedTargetAccount, setSelectedTargetAccount] = useState<
    number | null
  >(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [targetAccountCurrency, setTargetAccountCurrency] = useState<
    string | null
  >(null);
  const [isClosing, setIsClosing] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] =
    useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const parseNumberInput = (value: string) => {
    if (!value) return NaN;
    return parseFloat(value.toString().replace(",", "."));
  };

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
    if (selectedTargetAccount) {
      const targetAccount = accountsDefault.find(
        (acc) => acc.id === selectedTargetAccount
      );
      if (targetAccount) {
        setTargetAccountCurrency(targetAccount.currency);
        setDisplayCurrency(targetAccount.currency);
      }
    } else {
      setTargetAccountCurrency(null);
      setDisplayCurrency(selectedSaving.currency || null);
    }
  }, [selectedTargetAccount, accountsDefault, selectedSaving.currency]);

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
      setFilteredAccounts(accountsDefault);
    } else {
      const filtered = accountsDefault.filter((account) =>
        account.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  }, [searchInput, accountsDefault]);

  // Reset amount when target account changes
  useEffect(() => {
    setAmount("");
  }, [selectedTargetAccount]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setShowAccountDropdown(true);
    setIsDropdownOpen(true);
  };

  const selectAccount = (accountId: number) => {
    setSelectedTargetAccount(accountId);
    setSearchInput("");
    setShowAccountDropdown(false);
    setIsDropdownOpen(false);
  };

  const clearSelectedAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTargetAccount(null);
    setSearchInput("");
    setIsDropdownOpen(false);
  };

  // Calculate how much will be withdrawn from the savings account
  const getWithdrawAmount = (): number => {
    if (!amountTransfer || !targetAccountCurrency || !selectedSaving.currency)
      return 0;
    const amountValue = parseNumberInput(amountTransfer);
    if (isNaN(amountValue)) return 0;

    // If same currency, no conversion needed
    if (selectedSaving.currency === targetAccountCurrency) {
      return amountValue;
    } else {
      // Convert from target currency to savings currency
      return convertAmount(
        amountValue,
        targetAccountCurrency,
        selectedSaving.currency,
        rates
      );
    }
  };

  // Calculate the amount that will be deposited in the target account
  const getTargetAmount = (): number => {
    if (!amountTransfer) return 0;
    const amountValue = parseNumberInput(amountTransfer);
    return isNaN(amountValue) ? 0 : amountValue;
  };

  // Convert savings balance to target account currency
  const getSavingsBalanceInTargetCurrency = (): number | null => {
    if (
      !selectedSaving ||
      !targetAccountCurrency ||
      !selectedSaving.currency ||
      !rates ||
      !selectedSaving.amount
    ) {
      return null;
    }

    if (selectedSaving.currency === targetAccountCurrency) {
      return selectedSaving.amount;
    }

    return convertAmount(
      selectedSaving.amount,
      selectedSaving.currency,
      targetAccountCurrency,
      rates
    );
  };

  const calculateNewTargetBalance = (): number | null => {
    if (!selectedTargetAccount) return null;
    const targetAccount = accountsDefault.find(
      (acc) => acc.id === selectedTargetAccount
    );
    if (!targetAccount || targetAccount.amount === undefined) return null;
    return targetAccount.amount + getTargetAmount();
  };

  const calculateSourceAccountNewBalance = (): number | null => {
    if (!selectedSaving || selectedSaving.amount === undefined) return null;
    return selectedSaving.amount - getWithdrawAmount();
  };

  const newTargetBalance = calculateNewTargetBalance();
  const sourceAccountNewBalance = calculateSourceAccountNewBalance();
  const targetAccount = accountsDefault.find(
    (acc) => acc.id === selectedTargetAccount
  );
  const withdrawAmount = getWithdrawAmount();
  const targetAmount = getTargetAmount();
  const savingsBalanceInTargetCurrency = getSavingsBalanceInTargetCurrency();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!amountTransfer || parseNumberInput(amountTransfer) <= 0)
        throw new Error("Please enter a valid amount");

      if (!user?.id) throw new Error("User id not found");

      if (!selectedTargetAccount)
        throw new Error("Please select a target account");

      const targetAccount = accountsDefault.find(
        (acc) => acc.id === selectedTargetAccount
      );

      if (!targetAccount) throw new Error("Target account not found");

      const withdrawalAmount = getWithdrawAmount();

      if (withdrawalAmount > (selectedSaving.amount || 0))
        throw new Error(
          `Insufficient funds in savings account. You have ${(selectedSaving.amount || 0).toFixed(2)} ${selectedSaving.currency} available, but need ${withdrawalAmount.toFixed(2)} ${selectedSaving.currency}.`
        );

      // Use the amount entered (in target currency) directly
      const depositAmount = getTargetAmount();

      await addFundsDefault(
        user.id,
        depositAmount,
        selectedSaving.id,
        targetAccount.id,
        TransactionType.TRANSFER,
        targetAccount.currency as CurrencyType
      );

      setLoading(false);
      handleClose();
      onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to transfer funds");
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  if (error && !isClosing) return <ErrorState error={error} />;

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
        className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full"
        style={{
          maxWidth: isMobileScreen ? "100%" : "28rem",
          minWidth: isMobileScreen ? "auto" : "28rem",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div className="bg-indigo-500 h-20 relative">
          {/* Decorative circles */}
          <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
          <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
          <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>

          {/* Title is now part of the header, not overlapping */}
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
                    d="M9 5l7 7-7 7"
                  />
                </motion.svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Transfer Funds 🔄
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

        <div
          className="p-6"
          style={{ paddingBottom: isDropdownOpen ? "2rem" : "1.5rem" }}
        >
          {/* Source Account Name Display */}
          <div className="mb-5 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold text-indigo-800">
                {selectedSaving?.name || "Savings"}
              </p>
              <div className="bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100">
                <p className="text-indigo-700 font-medium">
                  {targetAccountCurrency &&
                  targetAccountCurrency !== selectedSaving?.currency &&
                  savingsBalanceInTargetCurrency !== null ? (
                    <span>
                      {savingsBalanceInTargetCurrency.toFixed(2)}{" "}
                      {targetAccountCurrency}
                    </span>
                  ) : (
                    <span>
                      {selectedSaving?.amount?.toFixed(2) || "0.00"}{" "}
                      {selectedSaving?.currency || "USD"}
                    </span>
                  )}
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
                htmlFor="targetAccount"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">🏦</span>
                Target Account<span className="text-indigo-500">*</span>
              </label>

              {/* Searchable Account Selection */}
              <div ref={searchRef} className="relative">
                <motion.div
                  whileFocus={{ scale: 1.0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex items-center bg-white border border-indigo-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
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

                  {selectedTargetAccount ? (
                    <div className="flex-1 py-3 px-1">
                      <span className="font-normal text-sm text-gray-900">
                        {
                          accountsDefault.find(
                            (acc) => acc.id === selectedTargetAccount
                          )?.name
                        }{" "}
                        (
                        {accountsDefault
                          .find((acc) => acc.id === selectedTargetAccount)
                          ?.amount?.toFixed(2)}{" "}
                        {
                          accountsDefault.find(
                            (acc) => acc.id === selectedTargetAccount
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

                  {(searchInput || selectedTargetAccount) && (
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
                    className="fixed z-[100] mt-1 w-full max-w-md bg-white border border-indigo-100 rounded-xl shadow-lg"
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      top: isMobileScreen
                        ? "calc(6vh + 200px)"
                        : "calc(5vh + 200px)",
                      width: "calc(96% - 1.8rem)",
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
                            selectedTargetAccount === account.id
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
                            <span className="font-medium">{account.name}</span>
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

            {selectedTargetAccount &&
              targetAccountCurrency !== selectedSaving?.currency && (
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
                    Values displayed in {targetAccountCurrency} for clarity
                  </span>
                </div>
              )}

            {selectedTargetAccount && (
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
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    type="text"
                    id="amount"
                    name="amount"
                    value={amountTransfer}
                    onChange={(e) => {
                      const value = e.target.value;
                      const regex = /^[0-9]*([.,][0-9]*)?$/;
                      if (value === "" || regex.test(value)) setAmount(value);
                    }}
                    className="w-full border border-indigo-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                    placeholder={"0.00"}
                    autoComplete="off"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="text-indigo-600 font-medium">
                      {targetAccountCurrency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedTargetAccount && targetAccount && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="text-indigo-500 mr-1">🔄</span>
                  Transaction Summary
                </h3>

                {sourceAccountNewBalance !== null &&
                sourceAccountNewBalance < 0 ? (
                  // Insufficient funds error state
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
                        Amount exceeded by:
                        <span className="ml-2 font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                          {targetAccountCurrency
                            ? convertAmount(
                                parseFloat(withdrawAmount.toFixed(2)) -
                                  (selectedSaving.amount || 0),
                                selectedSaving.currency,
                                targetAccountCurrency,
                                rates
                              ).toFixed(2) +
                              " " +
                              targetAccountCurrency
                            : (
                                parseFloat(withdrawAmount.toFixed(2)) -
                                (selectedSaving.amount || 0)
                              ).toFixed(2) +
                              " " +
                              selectedSaving.currency}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                ) : amountTransfer &&
                  !isNaN(parseNumberInput(amountTransfer)) &&
                  sourceAccountNewBalance !== null ? (
                  // Valid transaction summary
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
                            From {selectedSaving.name}
                          </div>
                          <div className="font-bold text-red-500 text-lg">
                            -{withdrawAmount.toFixed(2)}{" "}
                            {selectedSaving.currency}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 flex items-center">
                            <span className="mr-1">Balance after:</span>
                            <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {sourceAccountNewBalance.toFixed(2)}{" "}
                              {selectedSaving.currency}
                            </span>
                          </div>
                        </div>

                        {/* To column */}
                        <div className="p-4">
                          <div className="text-xs text-gray-500 mb-2 flex items-center">
                            To {targetAccount.name}
                          </div>
                          <div className="font-bold text-green-500 text-lg">
                            +{targetAmount.toFixed(2)} {targetAccountCurrency}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 flex items-center">
                            <span className="mr-1">Balance after:</span>
                            <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {(newTargetBalance || 0).toFixed(2)}{" "}
                              {targetAccount.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exchange rate info (only if currencies differ) */}
                    {targetAccountCurrency &&
                      selectedSaving?.currency &&
                      targetAccountCurrency !== selectedSaving.currency && (
                        <div className="flex items-center text-xs text-gray-500 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
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
                            <span className="font-medium">Exchange rate:</span>{" "}
                            1 {targetAccountCurrency} ={" "}
                            {(
                              rates[targetAccountCurrency] /
                              rates[selectedSaving.currency]
                            ).toFixed(4)}{" "}
                            {selectedSaving.currency}
                          </div>
                        </div>
                      )}
                  </motion.div>
                ) : (
                  // Empty state - no amount entered
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                    <p className="text-sm text-gray-500">
                      Enter an amount to see transaction details
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
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
                    sourceAccountNewBalance < 0) ||
                  !selectedTargetAccount
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
                    Processing...
                  </>
                ) : (
                  "Transfer"
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatedModal>
  );
};

export default TransferFromSavingModal;
