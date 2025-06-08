import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountType, CurrencyType } from "../../interfaces/enums";
import { useAuth } from "../../context/AuthContext";
import { editDefaultAccount } from "../../services/accountService";
import { Account } from "../../interfaces/Account";
import { X, CreditCard, FileText, ChevronDown, Edit, AlertCircle, TrendingUp, DollarSign } from "lucide-react";

interface EditDefaultAccountPopupProps {
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAccountEdited?: () => void;
  account: Account;
}

interface ExchangeRates {
  [currency: string]: number;
}

const EditDefaultAccountPopup = ({
  setIsEditModalOpen,
  onAccountEdited,
  account,
}: EditDefaultAccountPopupProps) => {
  const { user } = useAuth();
  const [isMobileView, setIsMobileView] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    accountType: AccountType.DEFAULT,
    currency: CurrencyType.RON,
  });

  const [originalCurrency, setOriginalCurrency] = useState<CurrencyType>(
    CurrencyType.RON
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState<boolean>(true);
  const [convertedBalance, setConvertedBalance] = useState<number | null>(null);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const currencyRef = useRef<HTMLDivElement>(null);

  // Enhanced mobile detection
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || "",
        description: account.description || "",
        currency: account.currency || CurrencyType.RON,
        accountType: account.type || AccountType.DEFAULT,
      });
      setOriginalCurrency(account.currency as CurrencyType);
    }
  }, [account]);

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
    if (
      Object.keys(rates).length === 0 ||
      !account ||
      account.amount === undefined ||
      formData.currency === originalCurrency
    ) {
      setConvertedBalance(null);
      return;
    }

    if (!rates[formData.currency]) {
      setError(`Exchange rate for ${formData.currency} not found.`);
      setConvertedBalance(null);
      return;
    }

    if (!rates[originalCurrency]) {
      setError(`Exchange rate for ${originalCurrency} not found.`);
      setConvertedBalance(null);
      return;
    }

    const convertedValue =
      (account.amount * rates[originalCurrency]) / rates[formData.currency];
    setConvertedBalance(convertedValue);
  }, [formData.currency, originalCurrency, account, rates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error("User not found. Please log in again.");
      }

      if (!formData.name.trim()) {
        throw new Error("Account name is required");
      }

      const updatedAmount =
        formData.currency !== originalCurrency && convertedBalance !== null
          ? convertedBalance
          : undefined;

      console.log("Currency changing:", formData.currency !== originalCurrency);
      console.log("Original currency:", originalCurrency);
      console.log("New currency:", formData.currency);
      console.log("Original amount:", account.amount);
      console.log("Converted amount:", convertedBalance);
      console.log("Should update amount:", updatedAmount);

      const requestBody = {
        name: formData.name,
        description: formData.description,
        currency: formData.currency,
        accountType: formData.accountType,
        ...(updatedAmount !== undefined && { amount: updatedAmount }),
      };

      await editDefaultAccount(user.id, account.id as number, requestBody);

      console.log("Account updated successfully");

      if (onAccountEdited) {
        onAccountEdited();
      } else {
        setIsEditModalOpen(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error updating account:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = () => {
    return formData.name.trim() && !fetchingRates;
  };

  const currentAmount = account ? account.amount : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        onClick={() => setIsEditModalOpen(false)}
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
          {/* Enhanced Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            {/* Mobile-optimized background elements */}
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
                    className={`bg-white text-indigo-600 rounded-full shadow-lg ${
                      isMobileView ? "p-1.5 w-7 h-7" : "p-1.5 w-10 h-10"
                    } flex items-center justify-center`}
                  >
                    <Edit size={isMobileView ? 14 : 18} />
                  </div>
                  <div>
                    <h2 className={`font-semibold ${isMobileView ? "text-base" : "text-lg"}`}>
                      Edit Account
                    </h2>
                    <p className={`opacity-90 ${isMobileView ? "text-xs" : "text-sm"}`}>
                      {account.name}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsEditModalOpen(false)}
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
                  Account Name *
                </label>
                <div className="relative">
                  <CreditCard
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <div className="relative">
                  <FileText
                    size={16}
                    className="absolute left-3 top-3 text-gray-400"
                  />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                    placeholder="Add details about this account"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <div className="relative" ref={currencyRef}>
                  <button
                    type="button"
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-left flex items-center justify-between shadow-sm"
                    disabled={fetchingRates}
                  >
                    <span>{formData.currency}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {isCurrencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-28 overflow-y-auto"
                    >
                      {fetchingRates ? (
                        <div className="p-3 text-center text-gray-500">
                          Loading currencies...
                        </div>
                      ) : (
                        Object.keys(rates).map((currency) => (
                          <button
                            key={currency}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, currency: currency as CurrencyType });
                              setIsCurrencyOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                              formData.currency === currency
                                ? "bg-indigo-50 text-indigo-700"
                                : ""
                            }`}
                          >
                            {currency}
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Current Balance Display */}
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    Current Balance
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">
                    {currentAmount.toFixed(2)} {originalCurrency}
                  </span>
                </div>
              </div>

              {/* Currency Conversion Display */}
              {formData.currency !== originalCurrency &&
                currentAmount !== undefined && (
                  <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl shadow-sm">
                    {fetchingRates ? (
                      <div className="flex items-center text-indigo-700">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent mr-2" />
                        Calculating conversion...
                      </div>
                    ) : convertedBalance !== null ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={14} className="text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-800">
                            Currency Conversion
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="px-2 py-1 bg-white rounded-lg border border-indigo-200 text-indigo-900">
                            <p className="text-xs font-medium">
                              {currentAmount.toFixed(2)} {originalCurrency}
                            </p>
                          </div>
                          <div className="px-1">
                            <svg
                              className="h-3 w-3 text-indigo-500"
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
                          <div className="px-2 py-1 bg-indigo-500 text-white rounded-lg">
                            <p className="text-xs font-medium">
                              {convertedBalance.toFixed(2)} {formData.currency}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs mt-1 text-indigo-600 text-center">
                          Exchange rate: 1 {originalCurrency} ={" "}
                          {rates[originalCurrency] && rates[formData.currency]
                            ? (rates[originalCurrency] / rates[formData.currency]).toFixed(4)
                            : "N/A"}{" "}
                          {formData.currency}
                        </div>
                      </div>
                    ) : (
                      <p className="text-indigo-700 text-sm">
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
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!canSubmit() || isLoading || (formData.currency !== originalCurrency && fetchingRates)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : fetchingRates && formData.currency !== originalCurrency ? (
                "Loading Rates..."
              ) : (
                <>
                  <Edit size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditDefaultAccountPopup;