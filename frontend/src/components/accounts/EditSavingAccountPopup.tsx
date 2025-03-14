import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { CurrencyType, AccountType } from "../../interfaces/enums";
import { editSavingAccount } from "../../services/accountService";

interface EditSavingAccountPopupProps {
  setIsModalOpen: (isOpen: boolean) => void;
  account: any;
  onSuccess: () => void;
}

interface ExchangeRates {
  [currency: string]: number;
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

  useEffect(() => {
    if (account) {
      console.log("Account Data:", account);
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

        // Set base currency rate to 1
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
      !account.savingAccount?.targetAmount ||
      formData.currency === originalCurrency ||
      !formData.currency ||
      !originalCurrency
    ) {
      setConvertedAmount(null);
      return;
    }

    if (!rates[formData.currency]) {
      setError(`Exchange rate for ${formData.currency} not found.`);
      setConvertedAmount(null);
      return;
    }

    if (!rates[originalCurrency]) {
      setError(`Exchange rate for ${originalCurrency} not found.`);
      setConvertedAmount(null);
      return;
    }

    const targetAmount = account.savingAccount.targetAmount;
    const convertedValue =
      (targetAmount * rates[originalCurrency]) / rates[formData.currency];
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

    if (name === "targetAmount") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }

      if (!formData.currency) {
        throw new Error("Please select a currency");
      }

      if (formData.targetAmount === "") {
        throw new Error("Please enter a target amount");
      }

      const updatedTargetAmount =
        formData.currency !== originalCurrency && convertedAmount !== null
          ? convertedAmount
          : parseFloat(formData.targetAmount as string);

      const targetDate = new Date(
        `${formData.targetDate}T00:00:00.000Z`
      ).toISOString();
      console.log("Frontend targetDate:", formData.targetDate);
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
      setIsModalOpen(false);
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error ? err.message : "Failed to update savings account"
      );
    }
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black">
              Edit Savings Account
            </h2>
            <p className="text-gray-800 mt-1">
              Update your savings account details
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-gray-100 border-l-4 border-red-500 text-black rounded-md">
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
              className="block text-sm font-medium text-black mb-1"
            >
              Account Name<span className="text-black">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-black mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* Target Amount */}

          <div>
            <label
              htmlFor="targetAmount"
              className="block text-sm font-medium text-black mb-1"
            >
              Target Amount
            </label>
            <div className="flex border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-all">
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
                    ? "bg-gray-100"
                    : ""
                }`}
                required
              />
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="px-3 py-3 bg-gray-50 text-gray-700 focus:outline-none rounded-r-lg"
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
                <p className="text-sm text-gray-700 mt-1 flex items-center">
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
              <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
                {fetchingRates ? (
                  <div className="flex items-center text-black">
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
                    <p className="font-semibold text-black mb-2">
                      Target Amount After Conversion:
                    </p>
                    <p className="text-black text-lg font-medium">
                      {account.savingAccount.targetAmount.toFixed(2)}{" "}
                      {originalCurrency} = {convertedAmount.toFixed(2)}{" "}
                      {formData.currency}
                    </p>
                    <div className="text-xs mt-2 text-gray-700 border-t border-gray-200 pt-2">
                      <p>
                        Conversion path: {originalCurrency} →{" "}
                        {formData.currency}
                      </p>
                      {rates[originalCurrency] && rates[formData.currency] && (
                        <p>
                          1 {originalCurrency} ={" "}
                          {(
                            rates[originalCurrency] / rates[formData.currency]
                          ).toFixed(4)}{" "}
                          {formData.currency}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-black">
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
              className="block text-sm font-medium text-black mb-1"
            >
              Target Date
            </label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Buttons */}
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
              disabled={
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
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditSavingAccountPopup;
