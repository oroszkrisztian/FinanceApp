import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { CurrencyType, AccountType } from "../../interfaces/enums";
import { editSavingAccount } from "../../services/accountService";
import AnimatedModal from "../animations/BlurPopup";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";

interface EditSavingAccountPopupProps {
  setIsModalOpen: (isOpen: boolean) => void;
  account: any;
  onSuccess: (accountId?: number) => void;
}

const EditSavingAccountPopup: React.FC<EditSavingAccountPopupProps> = ({
  setIsModalOpen,
  account,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    currency: "" as CurrencyType | "",
    accountType: "SAVINGS" as AccountType,
    targetAmount: "" as string | number,
    targetDate: "",
  });

  const [originalCurrency, setOriginalCurrency] = useState<CurrencyType | "">(
    ""
  );
  const [originalTargetAmount, setOriginalTargetAmount] = useState<
    number | null
  >(null);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState<boolean>(true);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasChangedCurrency, setHasChangedCurrency] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(100);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || "",
        description: account.description || "",
        currency: account.currency || "",
        accountType: account.accountType || AccountType.SAVINGS,
        targetAmount: account.savingAccount?.targetAmount || "",
        targetDate: account.savingAccount?.targetDate
          ? new Date(account.savingAccount.targetDate)
              .toISOString()
              .split("T")[0]
          : "",
      });
      setOriginalCurrency(account.currency || "");
      setOriginalTargetAmount(account.savingAccount?.targetAmount || null);
    }
  }, [account]);

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
    setError(null);

    if (
      Object.keys(rates).length === 0 ||
      !account ||
      !account.savingAccount?.targetAmount ||
      !formData.currency ||
      !originalCurrency
    ) {
      setConvertedAmount(null);
      return;
    }

    if (formData.currency === originalCurrency) {
      if (hasChangedCurrency) {
        setConvertedAmount(null);
        setFormData((prev) => ({
          ...prev,
          targetAmount: originalTargetAmount || "",
        }));
        setHasChangedCurrency(false);
      }
      return;
    }

    setHasChangedCurrency(true);

    const validation = validateCurrencyConversion(
      originalCurrency,
      formData.currency,
      rates
    );

    if (!validation.valid) {
      setError(validation.error || "Currency conversion error");
      setConvertedAmount(null);
      return;
    }

    const targetAmount = account.savingAccount.targetAmount;
    try {
      const convertedValue = convertAmount(
        targetAmount,
        originalCurrency,
        formData.currency,
        rates
      );

      setConvertedAmount(convertedValue);

      setFormData((prev) => ({
        ...prev,
        targetAmount: convertedValue.toFixed(2),
      }));
    } catch (error) {
      console.error("Conversion error:", error);
      setError("Failed to convert amount. Please try a different currency.");
      setConvertedAmount(null);
    }
  }, [
    formData.currency,
    originalCurrency,
    account,
    rates,
    hasChangedCurrency,
    originalTargetAmount,
  ]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "currency") {
      setFormData((prev) => ({
        ...prev,
        [name]: value as CurrencyType | "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error("User is not authenticated");
      if (!formData.currency) throw new Error("Please select a currency");
      if (formData.targetAmount === "")
        throw new Error("Please enter a target amount");

      let finalTargetAmount: number;

      if (typeof formData.targetAmount === "string") {
        finalTargetAmount = parseFloat(formData.targetAmount);
      } else {
        finalTargetAmount = formData.targetAmount;
      }

      if (isNaN(finalTargetAmount)) {
        throw new Error("Please enter a valid target amount");
      }

      const targetDate = new Date(
        `${formData.targetDate}T00:00:00.000Z`
      ).toISOString();

      const requestData = {
        name: formData.name,
        description: formData.description,
        currency: formData.currency as CurrencyType,
        savingAccount: {
          update: {
            targetAmount: finalTargetAmount,
            targetDate: targetDate,
          },
        },
      };

      await editSavingAccount(user.id, account.id, requestData);
      setLoading(false);
      onSuccess(account.id); // Pass the account ID to trigger animation
      handleClose();
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error ? err.message : "Failed to update savings account"
      );
    }
  };

  useEffect(() => {
    if (!account) return;

    const formTargetAmount =
      typeof formData.targetAmount === "string"
        ? parseFloat(formData.targetAmount)
        : formData.targetAmount;

    const accountTargetAmount = account.savingAccount?.targetAmount || 0;

    const hasFormChanged =
      account.name !== formData.name ||
      account.description !== formData.description ||
      account.currency !== formData.currency ||
      Math.abs(accountTargetAmount - formTargetAmount) > 0.01 ||
      (account.savingAccount?.targetDate
        ? new Date(account.savingAccount.targetDate).toISOString().split("T")[0]
        : "") !== formData.targetDate;

    setHasChanges(hasFormChanged);
  }, [formData, account]);

  useEffect(() => {
    // Calculate progress based on required fields
    let progress = 0;
    const totalRequiredFields = 3; // name, currency, targetAmount, targetDate

    if (formData.name.trim() !== "") {
      progress += 1;
    }

    if (formData.currency) {
      progress += 1;
    }

    if (formData.targetAmount && formData.targetAmount !== "") {
      progress += 1;
    }

    if (formData.targetDate) {
      progress += 1;
    }

    // Calculate percentage (capped at 100%)
    const percentage = Math.min((progress / totalRequiredFields) * 100, 100);
    setProgressPercentage(percentage);
  }, [formData]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsModalOpen(false);
    }, 150);
  };

  return (
    <AnimatedModal
      isOpen={!isClosing}
      onClose={handleClose}
      closeOnBackdropClick={true}
      backdropBlur="md"
      animationDuration={300}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          maxWidth: isMobileScreen ? "100%" : "28rem",
          minWidth: isMobileScreen ? "auto" : "28rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
      >
        {/* Header with fixed height that won't overlap content */}
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
                  className="w-6 h-6 text-indigo-600 "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </motion.svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit Goal ✏️</h2>
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

        <div className="p-6">
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
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">🏷️</span>
                Goal Name<span className="text-indigo-500">*</span>
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">📝</span>
                Description (Optional)
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                placeholder="Add a description for your goal..."
              />
            </div>

            {/* Target Amount */}
            <div>
              <label
                htmlFor="targetAmount"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">💰</span>
                Target Amount<span className="text-indigo-500">*</span>
              </label>
              <div className="flex border border-indigo-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50 overflow-hidden">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  type="number"
                  id="targetAmount"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`flex-1 px-4 py-3 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    formData.currency !== originalCurrency &&
                    formData.currency &&
                    !fetchingRates
                      ? "bg-indigo-50/50"
                      : ""
                  }`}
                  required
                />
                <motion.select
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="px-3 py-3 bg-indigo-500 text-white font-medium focus:outline-none appearance-none"
                  required
                >
                  {Object.values(CurrencyType).map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </motion.select>
              </div>
              {formData.currency !== originalCurrency &&
                convertedAmount !== null && (
                  <p className="text-sm text-indigo-600 mt-2 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
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
                    Value converted from {originalCurrency} to{" "}
                    {formData.currency}
                  </p>
                )}
            </div>

            {/* Amount Conversion Information */}
            {formData.currency !== originalCurrency &&
              formData.currency &&
              originalCurrency &&
              account?.savingAccount?.targetAmount !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm"
                >
                  {fetchingRates ? (
                    <div className="flex items-center text-indigo-700">
                      <svg
                        className="animate-spin mr-3 h-5 w-5"
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
                      <p className="font-bold text-indigo-700 mb-3 flex items-center">
                        <span className="mr-1">💰</span>
                        Target Amount After Conversion:
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="px-3 py-2 bg-white rounded-lg border border-indigo-200 text-indigo-900">
                          <p className="text-sm font-medium">
                            {account.savingAccount.targetAmount.toFixed(2)}{" "}
                            {originalCurrency}
                          </p>
                        </div>

                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ x: [-5, 5, -5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <svg
                              className="h-6 w-6 text-indigo-500"
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
                          </motion.div>
                        </div>

                        <div className="px-3 py-2 bg-indigo-500 text-white rounded-lg shadow-md">
                          <p className="text-sm font-medium">
                            {convertedAmount.toFixed(2)} {formData.currency}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs mt-3 text-indigo-600 border-t border-indigo-100 pt-2">
                        <p className="flex items-center">
                          <span className="mr-1">💱</span>
                          Exchange rate: 1 {originalCurrency} ={" "}
                          {getExchangeRate(
                            originalCurrency,
                            formData.currency,
                            rates
                          ).toFixed(4)}{" "}
                          {formData.currency}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-indigo-700 flex items-center">
                      <span className="mr-1">⚠️</span>
                      Unable to convert currencies. Please select a different
                      currency.
                    </p>
                  )}
                </motion.div>
              )}

            {/* Target Date */}
            <div>
              <label
                htmlFor="targetDate"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">🗓️</span>
                Target Date<span className="text-indigo-500">*</span>
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                type="date"
                id="targetDate"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                required
              />
            </div>

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
                  !hasChanges ||
                  loading ||
                  (formData.currency !== originalCurrency && fetchingRates) ||
                  progressPercentage < 100
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
                    Saving...
                  </>
                ) : fetchingRates && formData.currency !== originalCurrency ? (
                  "Loading Rates..."
                ) : (
                  "Save Changes"
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatedModal>
  );
};

export default EditSavingAccountPopup;
