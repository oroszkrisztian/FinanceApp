import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountType, CurrencyType } from "../../interfaces/enums";
import { createDefaultAccount } from "../../services/accountService";
import {
  fetchExchangeRates,
  ExchangeRates,
} from "../../services/exchangeRateService";
import { X, CreditCard, FileText, ChevronDown, Plus, AlertCircle } from "lucide-react";

interface CreateDefaultAccountPopupProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAccountCreated?: () => void;
}

const CreateDefaultAccountPopup = ({
  setIsModalOpen,
  onAccountCreated,
}: CreateDefaultAccountPopupProps) => {
  const [isMobileView, setIsMobileView] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    accountType: AccountType.DEFAULT,
    currency: CurrencyType.RON,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      
      if (!formData.name.trim()) {
        throw new Error("Account name is required");
      }

      const data = await createDefaultAccount({
        accountType: formData.accountType,
        currencyType: formData.currency,
        name: formData.name,
        description: formData.description,
      });

      console.log("Account created successfully:", data);

      if (onAccountCreated) {
        onAccountCreated();
      } else {
        setIsModalOpen(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error creating account:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = () => {
    return formData.name.trim() && !fetchingRates;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        onClick={() => setIsModalOpen(false)}
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
          {/*Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            {/*background elements */}
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
                    className={`bg-white text-blue-600 rounded-full shadow-lg ${
                      isMobileView ? "p-1.5 w-7 h-7" : "p-1.5 w-10 h-10"
                    } flex items-center justify-center`}
                  >
                    <Plus size={isMobileView ? 14 : 18} />
                  </div>
                  <div>
                    <h2 className={`font-semibold ${isMobileView ? "text-base" : "text-lg"}`}>
                      Create Account
                    </h2>
                    <p className={`opacity-90 ${isMobileView ? "text-xs" : "text-sm"}`}>
                      Add a new financial account
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsModalOpen(false)}
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
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="e.g., Primary Account"
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
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="Add details about this account"
                    rows={3}
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between shadow-sm"
                    disabled={fetchingRates}
                  >
                    <span>{formData.currency}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {isCurrencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto"
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
                              setFormData({ ...formData, currency: curr as CurrencyType });
                              setIsCurrencyOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                              formData.currency === curr
                                ? "bg-blue-50 text-blue-700"
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

              {/* Preview */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={14} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Account Preview
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">
                        {formData.name || "Account Name"}
                      </p>
                      <p className="text-xs text-blue-700">
                        {formData.description || "No description"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-blue-700">
                      <CreditCard size={12} />
                      <span className="text-xs">{formData.currency}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-100">
                    <span className="text-sm font-medium text-blue-900">
                      0.00 {formData.currency}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 flex gap-2`}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!canSubmit() || isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : fetchingRates ? (
                "Loading Rates..."
              ) : (
                <>
                  <Plus size={16} />
                  Create Account
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateDefaultAccountPopup;