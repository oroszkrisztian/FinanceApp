import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, FileText, Plus, ChevronDown, TrendingUp, AlertCircle } from "lucide-react";
import { TransactionType } from "../../interfaces/enums";
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
  const [isMobileView, setIsMobileView] = useState(false);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>(account.currency || "RON");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState<boolean>(true);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseNumberInput = (value: string) => {
    if (!value) return NaN;
    return parseFloat(value.toString().replace(",", "."));
  };

  useEffect(() => {
    const fetchExchangeRates = async () => {
      setFetchingRates(true);
      try {
        const response = await fetch("https://financeapp-bg0k.onrender.com/exchange-rates");
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

  const canSubmit = () => {
    return (
      name.trim() &&
      amount.trim() &&
      !isNaN(parseNumberInput(amount)) &&
      parseNumberInput(amount) > 0
    );
  };

  return (
    <AnimatePresence>
      {true && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={() => setIsAddFundsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
              isMobileView
                ? "max-w-sm w-full max-h-[95vh]"
                : "max-w-md w-full max-h-[90vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              {/* Background elements */}
              <div
                className={`absolute top-0 right-0 bg-white/20 rounded-full ${
                  isMobileView
                    ? "w-12 h-12 -translate-y-6 translate-x-6"
                    : "w-16 h-16 -translate-y-8 translate-x-8"
                }`}
              ></div>
              <div
                className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${
                  isMobileView
                    ? "w-8 h-8 translate-y-4 -translate-x-4"
                    : "w-12 h-12 translate-y-6 -translate-x-6"
                }`}
              ></div>
              <div
                className={`absolute bg-white/15 rounded-full ${
                  isMobileView
                    ? "top-2 left-16 w-6 h-6"
                    : "top-2 left-16 w-8 h-8"
                }`}
              ></div>
              <div
                className={`absolute bg-white/10 rounded-full ${
                  isMobileView
                    ? "bottom-2 right-12 w-4 h-4"
                    : "bottom-2 right-12 w-6 h-6"
                }`}
              ></div>

              <div className={`relative z-10 ${isMobileView ? "p-3" : "p-4"}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`bg-white text-green-600 rounded-full shadow-lg ${
                        isMobileView ? "p-1.5 w-7 h-7" : "p-1.5 w-10 h-10"
                      } flex items-center justify-center`}
                    >
                      <Plus size={isMobileView ? 14 : 18} />
                    </div>
                    <div>
                      <h2 className={`font-semibold ${isMobileView ? "text-base" : "text-lg"}`}>
                        Add Funds
                      </h2>
                      <p className={`opacity-90 ${isMobileView ? "text-xs" : "text-sm"}`}>
                        {account.name}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setIsAddFundsModalOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={isMobileView ? 20 : 20} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className={`${isMobileView ? "p-3" : "p-4"} flex-1 overflow-y-auto`}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2 mb-4 shadow-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Name *
                  </label>
                  <div className="relative">
                    <FileText
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                      placeholder="e.g., Salary Deposit"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                    placeholder="Add details about this transaction"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <div className="relative">
                      <DollarSign
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          const regex = /^[0-9]*([.,][0-9]*)?$/;
                          if (value === "" || regex.test(value)) {
                            setAmount(value);
                          }
                        }}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <div className="relative" ref={currencyRef}>
                      <button
                        type="button"
                        onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-left flex items-center justify-between shadow-sm"
                        disabled={fetchingRates}
                      >
                        <span>{currency}</span>
                        <ChevronDown size={16} className="text-gray-400" />
                      </button>

                      {isCurrencyOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
                        >
                          {fetchingRates ? (
                            <div className="p-3 text-center text-gray-500">
                              Loading currencies...
                            </div>
                          ) : (
                            Object.keys(rates).map((curr) => (
                              <button
                                key={curr}
                                type="button"
                                onClick={() => {
                                  setCurrency(curr);
                                  setIsCurrencyOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                                  currency === curr
                                    ? "bg-green-50 text-green-700"
                                    : ""
                                }`}
                              >
                                {curr}
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {currency !== account.currency &&
                  amount &&
                  !isNaN(parseFloat(amount)) && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-xl shadow-sm">
                      {fetchingRates ? (
                        <div className="flex items-center text-green-700">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent mr-2" />
                          Calculating conversion...
                        </div>
                      ) : convertedAmount !== null ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={14} className="text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Currency Conversion
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="px-2 py-1 bg-white rounded-lg border border-green-200 text-green-900">
                              <p className="text-xs font-medium">
                                {parseNumberInput(amount).toFixed(2)} {currency}
                              </p>
                            </div>
                            <div className="px-1">
                              <svg
                                className="h-3 w-3 text-green-500"
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
                            </div>
                            <div className="px-2 py-1 bg-green-500 text-white rounded-lg">
                              <p className="text-xs font-medium">
                                {convertedAmount.toFixed(2)} {account.currency}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs mt-1 text-green-600 text-center">
                            Exchange rate: 1 {currency} ={" "}
                            {rates[currency] && rates[account.currency]
                              ? (rates[currency] / rates[account.currency]).toFixed(4)
                              : "N/A"}{" "}
                            {account.currency}
                          </div>
                        </div>
                      ) : (
                        <p className="text-green-700 text-sm">
                          Unable to convert currencies. Please select a different currency.
                        </p>
                      )}
                    </div>
                  )}
              </form>
            </div>

            {/* Footer */}
            <div className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 flex gap-2`}>
              <button
                type="button"
                onClick={() => setIsAddFundsModalOpen(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={!canSubmit() || loading || fetchingRates}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : fetchingRates ? (
                  "Loading Rates..."
                ) : (
                  <>
                    <Plus size={16} />
                    Add Funds
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddFundsPopup;