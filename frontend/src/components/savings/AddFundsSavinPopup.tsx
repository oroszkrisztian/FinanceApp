import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ErrorState from "../ErrorState";
import { CurrencyType, TransactionType } from "../../interfaces/enums";
import { useAuth } from "../../context/AuthContext";
import { fetchDefaultAccounts } from "../../services/accountService";
import { Account } from "../../interfaces/Account";
import { addFundsSaving } from "../../services/transactionService";
import AnimatedModal from "../animations/BlurPopup";

interface ExchangeRates {
  [key: string]: number;
}

interface AddFundsPopupProps {
  isOpen: boolean;
  account: any;
  onSuccess: () => void;
  onClose: () => void;
}

const AddFundsSavingPopup: React.FC<AddFundsPopupProps> = ({
  isOpen,
  account,
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [amountTransfer, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultAccounts, setDefaultAccounts] = useState<Account[]>([]);
  const [selectedSourceAccount, setSelectedSourceAccount] = useState<number | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [sourceAccountCurrency, setSourceAccountCurrency] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const parseNumberInput = (value: string) => {
    if (!value) return NaN;
    return parseFloat(value.toString().replace(",", "."));
  };

  useEffect(() => {
    const loadAccounts = async () => {
      if (!user?.id) return;
      setLoadingAccounts(true);
      try {
        const accounts = await fetchDefaultAccounts(user.id);
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
          const multiplier = element.getAttribute("multiplier") ? parseInt(element.getAttribute("multiplier") || "1") : 1;
          const value = parseFloat(element.textContent || "0") / multiplier;
          if (currency && value) ratesObj[currency] = value;
        }
        Object.values(CurrencyType).forEach((curr) => {
          if (!ratesObj[curr]) ratesObj[curr] = 1;
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
      const sourceAccount = defaultAccounts.find((acc) => acc.id === selectedSourceAccount);
      if (sourceAccount) setSourceAccountCurrency(sourceAccount.currency);
    } else setSourceAccountCurrency(null);
  }, [selectedSourceAccount, defaultAccounts]);

  useEffect(() => {
    if (!amountTransfer || !sourceAccountCurrency || !account?.currency || sourceAccountCurrency === account.currency) {
      setConvertedAmount(null);
      return;
    }
    if (!rates[sourceAccountCurrency] || !rates[account.currency]) {
      setError(`Exchange rate for ${!rates[sourceAccountCurrency] ? sourceAccountCurrency : account.currency} not found.`);
      setConvertedAmount(null);
      return;
    }
    const amountValue = parseNumberInput(amountTransfer);
    if (isNaN(amountValue)) {
      setConvertedAmount(null);
      return;
    }
    const convertedValue = (amountValue * rates[account.currency]) / rates[sourceAccountCurrency];
    setConvertedAmount(convertedValue);
  }, [amountTransfer, sourceAccountCurrency, account?.currency, rates]);

  const calculateNewBalance = () => {
    if (!amountTransfer) return null;
    const amountValue = parseFloat(amountTransfer);
    if (isNaN(amountValue)) return null;
    return account.amount + amountValue;
  };

  const calculateSourceAccountNewBalance = () => {
    if (!selectedSourceAccount || !amountTransfer) return null;
    const sourceAccount = defaultAccounts.find((acc) => acc.id === selectedSourceAccount);
    if (!sourceAccount || sourceAccount.amount === undefined) return null;
    const amountValue = parseNumberInput(amountTransfer);
    if (isNaN(amountValue)) return null;
    const amountToSubtract = sourceAccountCurrency !== account.currency && convertedAmount ? convertedAmount : amountValue;
    return sourceAccount.amount - amountToSubtract;
  };

  const newBalance = calculateNewBalance();
  const sourceAccountNewBalance = calculateSourceAccountNewBalance();

  const getSourceAccount = () => {
    if (!selectedSourceAccount) return null;
    return defaultAccounts.find((acc) => acc.id === selectedSourceAccount);
  };

  const sourceAccount = getSourceAccount();
  const amountToWithdraw = sourceAccountCurrency !== account.currency && convertedAmount ? convertedAmount : parseNumberInput(amountTransfer || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!amountTransfer || parseNumberInput(amountTransfer) <= 0) throw new Error("Please enter a valid amount");
      if (!user?.id) throw new Error("User id not found");
      if (!selectedSourceAccount) throw new Error("Please select a source account");
      const sourceAccount = defaultAccounts.find((acc) => acc.id === selectedSourceAccount);
      if (!sourceAccount) throw new Error("Source account not found");
      const amountToAdd = parseNumberInput(amountTransfer);
      const amountToSubtract = sourceAccountCurrency !== account.currency && convertedAmount ? convertedAmount : amountToAdd;
      if (amountToSubtract > (sourceAccount.amount || 0)) throw new Error(`Insufficient funds in source account. Need ${amountToSubtract.toFixed(2)} ${sourceAccountCurrency}.`);
      await addFundsSaving(user.id, amountToAdd, sourceAccount.id, account.id, TransactionType.TRANSFER, account.currency);
      setLoading(false);
      handleClose();
      onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to add funds");
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (error) return <ErrorState error={error} />;

  return (
    <AnimatedModal
      isOpen={isOpen && !isClosing}
      onClose={handleClose}
      closeOnBackdropClick={true}
      backdropBlur="sm"
      animationDuration={300}
    >
      <div className="bg-white rounded-lg shadow-xl p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-indigo-50 w-10 h-10 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add Funds to {account?.name || "Account"}</h2>
          </div>
          <div className="bg-indigo-50 px-3 py-1 rounded-full text-indigo-800 text-sm font-medium">
            {account?.currency || "USD"}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sourceAccount" className="block text-sm font-medium text-gray-700 mb-1">
              Source Account<span className="text-red-500">*</span>
            </label>
            <select
              id="sourceAccount"
              value={selectedSourceAccount || ""}
              onChange={(e) => setSelectedSourceAccount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Add<span className="text-red-500">*</span>
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
                  if (value === "" || regex.test(value)) setAmount(value);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="0.00"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">{account?.currency || "RON"}</span>
              </div>
            </div>
          </div>

          {selectedSourceAccount && sourceAccount && sourceAccountNewBalance !== null && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Transaction Summary</div>
              {sourceAccountNewBalance > 0 ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Will withdraw:</span>
                    <span className="font-medium text-gray-900">
                      {isNaN(amountToWithdraw) ? "0.00" : amountToWithdraw.toFixed(2)} {sourceAccountCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">{sourceAccount.name}:</span>
                    <span className="font-medium text-gray-900">
                      {sourceAccount.amount?.toFixed(2)} → {sourceAccountNewBalance.toFixed(2)} {sourceAccountCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-600">{account.name}:</span>
                    <span className="font-medium text-indigo-600">
                      {account.amount?.toFixed(2)} → {newBalance?.toFixed(2)} {account.currency}
                    </span>
                  </div>
                  {sourceAccountCurrency && account?.currency && sourceAccountCurrency !== account.currency && (
                    <div className="mt-2 px-1 py-1.5 bg-indigo-50 border border-indigo-100 rounded text-xs text-indigo-700">
                      Exchange rate: 1 {account?.currency} = {(rates[account?.currency] / rates[sourceAccountCurrency]).toFixed(4)} {sourceAccountCurrency}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <div className="flex items-center text-red-700 font-medium mb-1.5">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Insufficient balance
                  </div>
                  <div className="ml-5.5">
                    <p className="text-gray-700">Available: {sourceAccount.amount?.toFixed(2)} {sourceAccountCurrency}</p>
                    <p className="text-gray-700 mt-1">
                      Needed: <span className="font-medium">{Math.abs(sourceAccountNewBalance).toFixed(2)} {sourceAccountCurrency} more</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-opacity-50 transition-colors text-sm font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium"
              disabled={loading || fetchingRates || (sourceAccountNewBalance !== null && sourceAccountNewBalance <= 0)}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
            </motion.button>
          </div>
        </form>
      </div>
    </AnimatedModal>
  );
};

export default AddFundsSavingPopup;