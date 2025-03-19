import { useState, useEffect } from "react";
import { AccountType, CurrencyType } from "../../interfaces/enums";
import { useAuth } from "../../context/AuthContext";
import { editDefaultAccount } from "../../services/accountService";
import { Account } from "../../interfaces/Account";

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error("User not found. Please log in again.");
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

  const currentAmount = account ? account.amount : 0;

  return (
    <div>
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">
              Edit Account {account.name}
            </h2>

            <button
              onClick={() => setIsEditModalOpen(false)}
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
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account Name<span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Description Field */}
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

            {/* Currency Field */}
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Currency<span className="text-blue-600">*</span>
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                {Object.values(CurrencyType).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Conversion Information */}
            {formData.currency !== originalCurrency &&
              currentAmount !== undefined && (
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
                      Calculating amount conversion...
                    </div>
                  ) : convertedBalance !== null ? (
                    <div>
                      <p className="font-semibold text-blue-700 mb-2">
                        Amount After Conversion:
                      </p>
                      <p className="text-blue-900 text-lg font-medium">
                        {currentAmount.toFixed(2)} {originalCurrency} ={" "}
                        {convertedBalance.toFixed(2)} {formData.currency}
                      </p>
                      <div className="text-xs mt-2 text-blue-600 border-t border-blue-100 pt-2">
                        <p>
                          Conversion path: {originalCurrency} →{" "}
                          {formData.currency}
                        </p>
                        {rates[originalCurrency] &&
                          rates[formData.currency] && (
                            <p>
                              1 {originalCurrency} ={" "}
                              {(
                                rates[originalCurrency] /
                                rates[formData.currency]
                              ).toFixed(4)}{" "}
                              {formData.currency}
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

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[120px]"
                disabled={
                  isLoading ||
                  (formData.currency !== originalCurrency && fetchingRates)
                }
              >
                {isLoading ? (
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
        </div>
      </div>
    </div>
  );
};

export default EditDefaultAccountPopup;
