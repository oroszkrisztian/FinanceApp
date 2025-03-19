import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { TransactionType, CurrencyType } from "../../interfaces/enums";
import { Account } from "../../interfaces/Account";
import { addFundsDefaultAccount } from "../../services/transactionService";

interface AddFundsPopupProps {
  account: Account;
  setIsAddFundsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onFundsAdded: () => void;
}

interface ExchangeRates {
  [currency: string]: number;
}

const AddFundsPopup: React.FC<AddFundsPopupProps> = ({
  account,
  setIsAddFundsModalOpen,
  onFundsAdded,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<CurrencyType>(
    account.currency as CurrencyType
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState<boolean>(true);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  const parseNumberInput = (value: string) => {
    if (!value) return NaN;
    return parseFloat(value.toString().replace(",", "."));
  };

  useEffect(() => {
    const fetchExchangeRates = async () => {
      setFetchingRates(true);
      try {
        const response = await fetch("http://localhost:3000/exchange-rates");
        const xmlText = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const origCurrency =
          xmlDoc.getElementsByTagName("OrigCurrency")[0]?.textContent || "";

        const ratesObj: ExchangeRates = {};
        const rateElements = xmlDoc.getElementsByTagName("Rate");

        if (origCurrency) {
          ratesObj[origCurrency] = 1;
        }

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

        if (!ratesObj[account.currency]) {
          console.warn(
            `Currency ${account.currency} not found in rates, using default 1:1 rate`
          );
          ratesObj[account.currency] = 1;
        }

        console.log("Available currencies:", Object.keys(ratesObj));
        setRates(ratesObj);
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
        setError("Could not fetch exchange rates. Please try again later.");
      } finally {
        setFetchingRates(false);
      }
    };

    fetchExchangeRates();
  }, [account.currency]);

  useEffect(() => {
    if (Object.keys(rates).length === 0 || !amount) {
      setConvertedAmount(null);
      return;
    }

    const numAmount = parseNumberInput(amount);

    if (isNaN(numAmount)) {
      setConvertedAmount(null);
      return;
    }

    if (currency === account.currency) {
      setConvertedAmount(numAmount);
      return;
    }

    if (!rates[currency]) {
      setError(`Exchange rate for ${currency} not found.`);
      setConvertedAmount(null);
      return;
    }

    if (!rates[account.currency]) {
      setError(`Exchange rate for ${account.currency} not found.`);
      setConvertedAmount(null);
      return;
    }

    const baseCurrency =
      Object.keys(rates).find((curr) => rates[curr] === 1) || "RON";

    let convertedValue = 0;

    if (baseCurrency === "RON") {
      if (currency === "RON") {
        convertedValue = numAmount / rates[account.currency];
      } else if (account.currency === "RON") {
        convertedValue = numAmount * rates[currency];
      } else {
        const amountInRON = numAmount * rates[currency];
        convertedValue = amountInRON / rates[account.currency];
      }
    } else {
      convertedValue = (numAmount * rates[currency]) / rates[account.currency];
    }

    setConvertedAmount(convertedValue);
  }, [amount, currency, account.currency, rates]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    if (!name || !amount) {
      setError("Name and amount are required");
      return;
    }

    const numAmount = parseNumberInput(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalAmount =
        currency !== account.currency && convertedAmount !== null
          ? convertedAmount
          : numAmount;

      await addFundsDefaultAccount(
        user.id,
        name,
        description,
        finalAmount,
        TransactionType.INCOME,
        Number(account.id),
        null,
        currency
      );

      setLoading(false);
      onFundsAdded();
      setIsAddFundsModalOpen(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to add funds");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">
            Add Funds to {account.name}
          </h2>
          <button
            onClick={() => setIsAddFundsModalOpen(false)}
            className="text-gray-400 hover:text-black transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            <div className="flex">
              <svg
                className="h-5 w-5 mr-2"
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Deposit Name<span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Salary Deposit"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Add details about this transaction"
              rows={3}
            />
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Amount<span className="text-blue-600">*</span>
            </label>
            <div className="flex border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  const regex = /^[0-9]*([.,][0-9]*)?$/;
                  if (value === "" || regex.test(value)) {
                    setAmount(value);
                  }
                }}
                className="flex-1 px-4 py-3 focus:outline-none rounded-l-lg"
                placeholder="0,00"
                required
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                className="px-3 py-3 bg-gray-50 text-gray-700 focus:outline-none rounded-r-lg"
              >
                {Object.values(CurrencyType).map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currency !== account.currency &&
            amount &&
            !isNaN(parseFloat(amount)) && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                {fetchingRates ? (
                  <div className="flex items-center text-blue-700">
                    <svg
                      className="animate-spin mr-3 h-4 w-4"
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
                    Calculating conversion...
                  </div>
                ) : convertedAmount !== null ? (
                  <div>
                    <p className="font-semibold text-blue-700 mb-2">
                      Currency Conversion:
                    </p>
                    <p className="text-blue-900 text-lg font-medium">
                      {parseNumberInput(amount).toFixed(2)} {currency} ={" "}
                      {convertedAmount.toFixed(2)} {account.currency}
                    </p>
                    <div className="text-xs mt-2 text-blue-600 border-t border-blue-100 pt-2">
                      <p>
                        Conversion path: {currency} → {account.currency}
                      </p>
                      {rates[currency] && rates[account.currency] && (
                        <p>
                          1 {currency} ={" "}
                          {(rates[currency] / rates[account.currency]).toFixed(
                            4
                          )}{" "}
                          {account.currency}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-blue-700">
                    Unable to convert currencies. Please select a different
                    currency.
                  </p>
                )}
              </div>
            )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddFundsModalOpen(false)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-black bg-white hover:bg-gray-200 focus:outline-none focus:border-blue-500 focus:ring-0 "
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-800 to-black text-white rounded-lg hover:from-blue-700 hover:to-gray-900 hover:shadow-lg focus:outline-none focus:border-blue-500 focus:ring-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
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
    </div>
  );
};

export default AddFundsPopup;
