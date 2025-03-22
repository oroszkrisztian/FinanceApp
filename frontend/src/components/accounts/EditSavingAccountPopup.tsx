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
  validateCurrencyConversion
} from "../../services/exchangeRateService";

interface EditSavingAccountPopupProps {
  setIsModalOpen: (isOpen: boolean) => void;
  account: any;
  onSuccess: () => void;
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
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState<boolean>(true);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);

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
    if (
      Object.keys(rates).length === 0 ||
      !account ||
      !account.savingAccount?.targetAmount ||
      formData.currency === originalCurrency ||
      !formData.currency ||
      !originalCurrency
    ) {
      setConvertedAmount(null);
      return;
    }

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
  }, [formData.currency, originalCurrency, account, rates]);

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

      const updatedTargetAmount =
        formData.currency !== originalCurrency && convertedAmount !== null
          ? convertedAmount
          : parseFloat(formData.targetAmount as string);

      const targetDate = new Date(
        `${formData.targetDate}T00:00:00.000Z`
      ).toISOString();
      const requestData = {
        name: formData.name,
        description: formData.description,
        currency: formData.currency as CurrencyType,
        savingAccount: {
          update: {
            targetAmount: updatedTargetAmount,
            targetDate: targetDate,
          },
        },
      };

      await editSavingAccount(user.id, account.id, requestData);
      setLoading(false);
      onSuccess();
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
    
    const hasFormChanged = 
      account.name !== formData.name ||
      account.description !== formData.description ||
      account.currency !== formData.currency ||
      account.savingAccount?.targetAmount.toString() !== formData.targetAmount.toString() ||
      (account.savingAccount?.targetDate 
        ? new Date(account.savingAccount.targetDate).toISOString().split("T")[0] 
        : "") !== formData.targetDate;
        
    setHasChanges(hasFormChanged);
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
      backdropBlur="sm"
      animationDuration={150}
    >
      <div className="bg-white rounded-lg shadow-xl p-5 ooverflow-x-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-indigo-50 w-10 h-10 rounded-full flex items-center justify-center mr-3">
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Edit Savings Goal
              </h2>
              <p className="text-indigo-600 mt-1">
                Update details for {account?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Account Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label
              htmlFor="targetAmount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Amount
            </label>
            <div className="flex border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent transition-all">
              <input
                type="number"
                id="targetAmount"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`flex-1 px-4 py-3 focus:outline-none rounded-l-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  formData.currency !== originalCurrency &&
                  formData.currency &&
                  !fetchingRates
                    ? "bg-indigo-50"
                    : ""
                }`}
                required
              />
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="px-3 py-3 bg-indigo-50 text-indigo-700 focus:outline-none rounded-r-lg"
                required
              >
                {Object.values(CurrencyType).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            {formData.currency !== originalCurrency &&
              convertedAmount !== null && (
                <p className="text-sm text-indigo-600 mt-1 flex items-center">
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
                  Value converted from {originalCurrency} to {formData.currency}
                </p>
              )}
          </div>

          {/* Amount Conversion Information */}
          {formData.currency !== originalCurrency &&
            formData.currency &&
            originalCurrency &&
            account.savingAccount?.targetAmount !== undefined && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                {fetchingRates ? (
                  <div className="flex items-center text-indigo-700">
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
                    Calculating amount conversion...
                  </div>
                ) : convertedAmount !== null ? (
                  <div>
                    <p className="font-semibold text-indigo-700 mb-2">
                      Target Amount After Conversion:
                    </p>
                    <p className="text-indigo-700 text-lg font-medium">
                      {account.savingAccount.targetAmount.toFixed(2)}{" "}
                      {originalCurrency} = {convertedAmount.toFixed(2)}{" "}
                      {formData.currency}
                    </p>
                    <div className="text-xs mt-2 text-indigo-700 border-t border-indigo-100 pt-2">
                      <p>
                        Conversion path: {originalCurrency} →{" "}
                        {formData.currency}
                      </p>
                      {rates[originalCurrency] && rates[formData.currency] && (
                        <p>
                          1 {originalCurrency} ={" "}
                          {getExchangeRate(
                            originalCurrency,
                            formData.currency,
                            rates
                          ).toFixed(4)}{" "}
                          {formData.currency}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-indigo-700">
                    Unable to convert currencies. Please select a different
                    currency.
                  </p>
                )}
              </div>
            )}

          {/* Target Date */}
          <div>
            <label
              htmlFor="targetDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Date
            </label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Buttons */}
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
                !hasChanges ||
                loading ||
                (formData.currency !== originalCurrency && fetchingRates)
              }
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
    </AnimatedModal>
  );
};

export default EditSavingAccountPopup;