import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ErrorState from "../ErrorState";
import { CurrencyType, TransactionType } from "../../interfaces/enums";
import { useAuth } from "../../context/AuthContext";
import { fetchAllAccounts } from "../../services/accountService";
import { Account } from "../../interfaces/Account";
import { addFundsSaving } from "../../services/transactionService";
import { Currency } from "lucide-react";

interface ExchangeRates {
  [key: string]: number;
}

interface AddFundsPopupProps {
  setIsModalOpen: (isOpen: boolean) => void;
  account: any;
  onSuccess: () => void;
}

const AddFundsSavingPopup: React.FC<AddFundsPopupProps> = ({
  setIsModalOpen,
  account,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [amountTransfer, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [defaultAccounts, setDefaultAccounts] = useState<Account[]>([]);
  const [selectedSourceAccount, setSelectedSourceAccount] = useState<
    number | null
  >(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [sourceAccountCurrency, setSourceAccountCurrency] = useState<
    string | null
  >(null);

  const parseNumberInput = (value: string) => {
    if (!value) return NaN;
    return parseFloat(value.toString().replace(",", "."));
  };

  useEffect(() => {
    const loadAccounts = async () => {
      if (!user?.id) return;

      setLoadingAccounts(true);
      try {
        const accounts = await fetchAllAccounts(user.id);
        setDefaultAccounts(accounts);
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
    const fetchExchangeRates = async () => {
      setFetchingRates(true);
      try {
        const response = await fetch("http://localhost:3000/exchange-rates");
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const ratesObj: ExchangeRates = {};
        const rateElements = xmlDoc.getElementsByTagName("Rate");

        for (let i = 0; i < rateElements.length; i++) {
          const element = rateElements[i];
          const currency = element.getAttribute("currency") || "";
          const multiplier = element.getAttribute("multiplier")
            ? parseInt(element.getAttribute("multiplier") || "1")
            : 1;
          const value = parseFloat(element.textContent || "0") / multiplier;

          if (currency && value) {
            ratesObj[currency] = value;
          }
        }

        Object.values(CurrencyType).forEach((curr) => {
          if (!ratesObj[curr]) {
            ratesObj[curr] = 1;
          }
        });

        setRates(ratesObj);
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
        setError("Could not fetch exchange rates. Please try again later.");
      } finally {
        setFetchingRates(false);
      }
    };

    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (selectedSourceAccount) {
      const sourceAccount = defaultAccounts.find(
        (acc) => acc.id === selectedSourceAccount
      );

      if (sourceAccount) {
        setSourceAccountCurrency(sourceAccount.currency);
      }
    } else {
      setSourceAccountCurrency(null);
    }
  }, [selectedSourceAccount, defaultAccounts]);

  useEffect(() => {
    if (
      Object.keys(rates).length === 0 ||
      !amountTransfer ||
      !sourceAccountCurrency ||
      !account?.currency ||
      sourceAccountCurrency === account.currency
    ) {
      setConvertedAmount(null);
      return;
    }

    if (!rates[sourceAccountCurrency]) {
      setError(`Exchange rate for ${sourceAccountCurrency} not found.`);
      setConvertedAmount(null);
      return;
    }

    if (!rates[account.currency]) {
      setError(`Exchange rate for ${account.currency} not found.`);
      setConvertedAmount(null);
      return;
    }

    const amountValue = parseNumberInput(amountTransfer);
    if (isNaN(amountValue)) {
      setConvertedAmount(null);
      return;
    }

    const convertedValue =
      (amountValue * rates[account.currency]) / rates[sourceAccountCurrency];
    setConvertedAmount(convertedValue);
  }, [amountTransfer, sourceAccountCurrency, account?.currency, rates]);

  const calculateNewBalance = () => {
    if (!amountTransfer) return null;

    const amountValue = parseFloat(amountTransfer);
    if (isNaN(amountValue)) return null;
    const newBalance = account.amount + amountValue;

    return newBalance;
  };

  const calculateSourceAccountNewBalance = () => {
    if (!selectedSourceAccount || !amountTransfer) return null;

    const sourceAccount = defaultAccounts.find(
      (acc) => acc.id === selectedSourceAccount
    );

    if (!sourceAccount || sourceAccount.amount === undefined) return null;

    const amountValue = parseNumberInput(amountTransfer);
    if (isNaN(amountValue)) return null;

    const amountToSubtract =
      sourceAccountCurrency !== account.currency && convertedAmount
        ? convertedAmount
        : amountValue;
    const total = sourceAccount.amount - amountToSubtract;

    return total;
  };

  const newBalance = calculateNewBalance();

  const sourceAccountNewBalance = calculateSourceAccountNewBalance();

  const getSourceAccount = () => {
    if (!selectedSourceAccount) return null;
    return defaultAccounts.find((acc) => acc.id === selectedSourceAccount);
  };

  const sourceAccount = getSourceAccount();
  const amountToWithdraw =
    sourceAccountCurrency !== account.currency && convertedAmount
      ? convertedAmount
      : parseNumberInput(amountTransfer || "0");

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!amountTransfer || parseNumberInput(amountTransfer) <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (!user?.id) {
        throw new Error("User id not found");
      }

      if (!selectedSourceAccount) {
        throw new Error("Please select a source account");
      }

      const sourceAccount = defaultAccounts.find(
        (acc) => acc.id === selectedSourceAccount
      );

      if (!sourceAccount) {
        throw new Error("Source account not found");
      }

      const amountToAdd = parseNumberInput(amountTransfer);
      const amountToSubtract =
        sourceAccountCurrency !== account.currency && convertedAmount
          ? convertedAmount
          : amountToAdd;
      try {
        await addFundsSaving(
          user.id,
          amountToAdd,
          sourceAccount.id,
          account.id,
          TransactionType.TRANSFER,
          account.currency
        );
      } catch (error) {
        setLoading(false);
        setError(
          error instanceof Error ? error.message : "Failed to transfer funds"
        );
      }

      if (amountToSubtract > (sourceAccount.amount || 0)) {
        throw new Error(
          `Insufficient funds in source account. Need ${amountToSubtract.toFixed(2)} ${sourceAccountCurrency}.`
        );
      }

      setLoading(false);
      onSuccess();
      setIsModalOpen(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to add funds");
    }
  };

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClickOutside}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative overflow-hidden border border-gray-200"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-black">
                Add Funds to {account?.name || "Account"}
              </h2>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-full text-gray-800 font-medium">
              {account?.currency || "USD"}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="sourceAccount"
              className="block text-sm font-medium text-black mb-1"
            >
              Source Account<span className="text-black">*</span>
            </label>
            <select
              id="sourceAccount"
              value={selectedSourceAccount || ""}
              onChange={(e) => setSelectedSourceAccount(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
              disabled={loadingAccounts}
            >
              {loadingAccounts ? (
                <option>Loading accounts...</option>
              ) : defaultAccounts.length === 0 ? (
                <option value="">No accounts available</option>
              ) : (
                <>
                  <option value="" disabled hidden>
                    Select an account
                  </option>
                  {defaultAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.amount?.toFixed(2)} {acc.currency})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-black mb-1"
            >
              Amount to Add ({account?.currency || "RON"})
              <span className="text-black">*</span>
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
                  if (value === "" || regex.test(value)) {
                    setAmount(value);
                  }
                }}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="0,00"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">
                  {account?.currency || "RON"}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Summary */}

          <div className="space-y-3">
            <div className="text-sm text-gray-800 font-medium mb-1">
              Transaction Summary:
            </div>

            {selectedSourceAccount &&
              sourceAccount &&
              sourceAccountNewBalance !== null && (
                <>
                  {sourceAccountNewBalance > 0 ? (
                    <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg">
                      <p className="text-gray-700 flex justify-between">
                        <span className="font-medium">Will withdraw:</span>
                        <span className="font-semibold">
                          {amountToWithdraw.toFixed(2)} {sourceAccountCurrency}
                        </span>
                      </p>
                      <p className="text-gray-700 flex justify-between mt-1">
                        <span className="font-medium">
                          {sourceAccount.name} balance:
                        </span>
                        <span className="font-semibold">
                          {sourceAccount.amount?.toFixed(2)} →{" "}
                          {sourceAccountNewBalance.toFixed(2)}{" "}
                          {sourceAccountCurrency}
                        </span>
                      </p>
                      <p className="text-gray-700 flex justify-between mt-1">
                        <span className="font-medium">
                          {account.name} balance:
                        </span>
                        <span className="font-semibold">
                          {account.amount?.toFixed(2)} →{" "}
                          {newBalance?.toFixed(2)} {account.currency}
                        </span>
                      </p>

                      {/* Show exchange rate if needed */}
                      {sourceAccountCurrency &&
                        account?.currency &&
                        sourceAccountCurrency !== account.currency && (
                          <p className="text-xs text-gray-500 mt-1">
                            Using exchange rate: 1 {account?.currency} ={" "}
                            {(
                              rates[account?.currency] /
                              rates[sourceAccountCurrency]
                            ).toFixed(4)}{" "}
                            {sourceAccountCurrency}
                          </p>
                        )}
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 font-medium">
                        Insufficient balance in {sourceAccount.name}.
                      </p>
                      <p className="text-gray-700">
                        Available balance: {sourceAccount.amount?.toFixed(2)}{" "}
                        {sourceAccountCurrency}
                      </p>
                      <p className="text-gray-700 mt-1">
                        You need extra:{" "}
                        <span className="font-semibold">
                          {Math.abs(sourceAccountNewBalance).toFixed(2)}{" "}
                          {sourceAccountCurrency}
                        </span>
                      </p>
                    </div>
                  )}
                </>
              )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-black bg-white hover:bg-gray-100 focus:outline-none focus:border-black focus:ring-0 transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:border-white focus:ring-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              disabled={loading || fetchingRates}
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
                  Processing...
                </>
              ) : fetchingRates ? (
                "Loading Rates..."
              ) : (
                "Add Funds"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddFundsSavingPopup;
