import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Search, ChevronDown, ArrowRight, AlertCircle, Info } from "lucide-react";
import { Account } from "../../interfaces/Account";
import { TransactionType } from "../../interfaces/enums";
import {
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
  ExchangeRates,
} from "../../services/exchangeRateService";
import { transferFundsDefault } from "../../services/transactionService";
import { useAuth } from "../../context/AuthContext";

interface TransferDefaultAccountsProps {
  onClose: () => void;
  isOpen: boolean;
  accounts: Account[];
  accountsLoading: boolean;
  onSuccess: () => void;
  rates: ExchangeRates;
  ratesError: string | null;
  fetchingRates: boolean;
}

const SearchWithSuggestions: React.FC<{
  placeholder: string;
  onSearch: (term: string) => void;
  suggestions: { id: number; name: string; amount: number; currency: string }[];
  onSelect?: (account: { id: number; name: string; amount: number; currency: string }) => void;
  value?: string;
  excludeId?: number;
}> = ({ placeholder, onSearch, suggestions, onSelect, value = "", excludeId }) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<typeof suggestions>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const filtered = suggestions.filter((suggestion) =>
      suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      suggestion.id !== excludeId
    );
    setFilteredSuggestions(filtered);
  }, [searchTerm, suggestions, excludeId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    if (onSelect) {
      onSelect(suggestion);
    }
    setSearchTerm(suggestion.name);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-blue-400"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-8 pr-3 py-3 text-sm border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors shadow-sm bg-blue-50/50"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-700"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">
                  {suggestion.name}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  {suggestion.amount.toFixed(2)} {suggestion.currency}
                </span>
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const TransferDefaultAccounts: React.FC<TransferDefaultAccountsProps> = ({
  onClose,
  isOpen,
  accounts,
  accountsLoading,
  onSuccess,
  rates,
  ratesError,
  fetchingRates,
}) => {
  const { user } = useAuth();
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [amountString, setAmountString] = useState("");
  const [selectedFromAccount, setSelectedFromAccount] = useState<Account | null>(null);
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(null);
  const [fromAccountSearchTerm, setFromAccountSearchTerm] = useState("");
  const [toAccountSearchTerm, setToAccountSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    amount: number;
  }>({
    amount: 0,
  });

  const [conversionDetails, setConversionDetails] = useState<{
    originalAmount: number;
    convertedAmount: number;
    rate: number;
    error: string | null;
  }>({
    originalAmount: 0,
    convertedAmount: 0,
    rate: 1,
    error: null,
  });

  const resetForm = () => {
    setFormData({
      amount: 0,
    });
    setAmountString("");
    setFromAccountSearchTerm("");
    setToAccountSearchTerm("");
    setSelectedFromAccount(null);
    setSelectedToAccount(null);
    setConversionDetails({
      originalAmount: 0,
      convertedAmount: 0,
      rate: 1,
      error: null,
    });
    setError(null);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      resetForm();
      setIsClosing(false);
      onClose();
    }, 150);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    updateConversionDetails();
  }, [formData.amount, selectedFromAccount, selectedToAccount, rates]);

  const updateConversionDetails = () => {
    if (
      !selectedFromAccount ||
      !selectedToAccount ||
      !rates ||
      Object.keys(rates).length === 0
    )
      return;

    const fromCurrency = selectedFromAccount.currency;
    const toCurrency = selectedToAccount.currency;
    const validation = validateCurrencyConversion(
      fromCurrency,
      toCurrency,
      rates
    );

    if (!validation.valid) {
      setConversionDetails({
        originalAmount: formData.amount,
        convertedAmount: formData.amount,
        rate: 1,
        error: validation.error || "Invalid conversion",
      });
      return;
    }

    const rate = getExchangeRate(fromCurrency, toCurrency, rates);
    const convertedValue = convertAmount(
      formData.amount,
      fromCurrency,
      toCurrency,
      rates
    );

    setConversionDetails({
      originalAmount: formData.amount,
      convertedAmount: convertedValue,
      rate: rate,
      error: null,
    });
  };

  // Account selection handlers
  const handleFromAccountSelect = (account: { id: number; name: string; amount: number; currency: string }) => {
    const fullAccount = accounts.find((acc) => acc.id === account.id);
    if (fullAccount) {
      setSelectedFromAccount(fullAccount);
      setFromAccountSearchTerm("");
    }
  };

  const handleToAccountSelect = (account: { id: number; name: string; amount: number; currency: string }) => {
    const fullAccount = accounts.find((acc) => acc.id === account.id);
    if (fullAccount) {
      setSelectedToAccount(fullAccount);
      setToAccountSearchTerm("");
    }
  };

  // Clear selections
  const clearFromAccountSelection = () => {
    setSelectedFromAccount(null);
    setFromAccountSearchTerm("");
  };

  const clearToAccountSelection = () => {
    setSelectedToAccount(null);
    setToAccountSearchTerm("");
  };

  // Get suggestions
  const accountSuggestions = accounts.map(acc => ({
    id: acc.id,
    name: acc.name,
    amount: acc.amount,
    currency: acc.currency
  }));

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError("User not found");
      setIsLoading(false);
      return;
    }
    if (!selectedFromAccount || !selectedToAccount) {
      setError("Please select both accounts");
      setIsLoading(false);
      return;
    }
    if (selectedFromAccount.id === selectedToAccount.id) {
      setError("You cannot transfer money to the same account");
      setIsLoading(false);
      return;
    }
    if (formData.amount <= 0) {
      setError("Please enter a valid amount");
      setIsLoading(false);
      return;
    }
    if (selectedFromAccount.amount < formData.amount) {
      setError("Insufficient funds in the selected account");
      setIsLoading(false);
      return;
    }

    try {
      const finalAmount = conversionDetails.convertedAmount;

      await transferFundsDefault(
        user.id,
        finalAmount,
        selectedFromAccount.id,
        selectedToAccount.id,
        TransactionType.TRANSFER,
        selectedFromAccount.currency
      );

      resetForm();
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error during transfer:", error);
      setError(
        error instanceof Error ? error.message : "Failed to transfer funds"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
        style={{
          maxWidth: isMobileScreen ? "100%" : "36rem",
          minWidth: isMobileScreen ? "auto" : "36rem",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-4 relative z-10">
          <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
          <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
          <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>

          <div className="px-6 flex items-center justify-between relative z-10">
            <div className="flex items-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🔄</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Transfer Money</h2>
                <p className="text-sm text-white/90">Move funds between accounts</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2 shadow-sm"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-blue-500 mr-1">💳</span>
                From Account<span className="text-blue-500">*</span>
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-11 bg-gray-200 rounded-xl"></div>
              ) : accounts.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                  No accounts available. Please create one first.
                </div>
              ) : (
                <>
                  <SearchWithSuggestions
                    placeholder="Search and select source account..."
                    onSearch={setFromAccountSearchTerm}
                    suggestions={accountSuggestions}
                    onSelect={handleFromAccountSelect}
                    value={selectedFromAccount?.name || fromAccountSearchTerm}
                    excludeId={selectedToAccount?.id}
                  />
                  {selectedFromAccount && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-800">
                            {selectedFromAccount.name}
                          </div>
                          <div className="text-sm text-blue-600">
                            Balance: {selectedFromAccount.amount.toFixed(2)}{" "}
                            {selectedFromAccount.currency}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearFromAccountSelection}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-blue-500 mr-1">💰</span>
                Amount<span className="text-blue-500">*</span>
              </label>
              <div className="flex border border-blue-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all bg-blue-50/50 overflow-hidden">
                <input
                  type="text"
                  className="flex-1 min-w-0 px-4 py-3 focus:outline-none bg-transparent font-bold text-xl text-gray-800"
                  placeholder="0.00"
                  value={amountString}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^[0-9]*([.,][0-9]*)?$/.test(value)) {
                      setAmountString(value);
                      if (value === "") {
                        setFormData({ amount: 0 });
                      } else {
                        const numericValue = parseFloat(value.replace(",", "."));
                        if (!isNaN(numericValue)) {
                          setFormData({ amount: numericValue });
                        }
                      }
                    }
                  }}
                  disabled={!selectedFromAccount}
                />
                <div className="px-3 py-3 bg-blue-600 text-white font-medium">
                  <span className="text-base">
                    {selectedFromAccount?.currency || "---"}
                  </span>
                </div>
              </div>
              {!selectedFromAccount && (
                <div className="mt-1 text-xs text-gray-500 flex items-center">
                  <Info size={12} className="mr-1 text-blue-500" />
                  Select a source account first
                </div>
              )}
            </div>

            {/* To Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-blue-500 mr-1">💳</span>
                To Account<span className="text-blue-500">*</span>
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-11 bg-gray-200 rounded-xl"></div>
              ) : accounts.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                  No accounts available. Please create one first.
                </div>
              ) : (
                <>
                  <SearchWithSuggestions
                    placeholder="Search and select destination account..."
                    onSearch={setToAccountSearchTerm}
                    suggestions={accountSuggestions}
                    onSelect={handleToAccountSelect}
                    value={selectedToAccount?.name || toAccountSearchTerm}
                    excludeId={selectedFromAccount?.id}
                  />
                  {selectedToAccount && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-800">
                            {selectedToAccount.name}
                          </div>
                          <div className="text-sm text-blue-600">
                            Balance: {selectedToAccount.amount.toFixed(2)}{" "}
                            {selectedToAccount.currency}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearToAccountSelection}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Transfer Summary */}
            {selectedFromAccount &&
              selectedToAccount &&
              formData.amount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm"
                >
                  <h3 className="font-bold text-blue-700 mb-3 flex items-center">
                    <span className="mr-1">💸</span>
                    Transfer Summary
                  </h3>

                  {selectedFromAccount.amount < formData.amount ? (
                    <div className="p-3 bg-red-100 rounded-lg border border-red-200">
                      <div className="flex items-center text-red-600 font-medium mb-2">
                        <AlertCircle size={16} className="mr-2" />
                        Insufficient funds
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-red-100">
                        <p className="text-sm text-gray-700">
                          Available: {selectedFromAccount.amount.toFixed(2)}{" "}
                          {selectedFromAccount.currency} | 
                          Needed: {formData.amount.toFixed(2)}{" "}
                          {selectedFromAccount.currency}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
                      <div className="grid grid-cols-1 divide-y divide-blue-50">
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">From:</span>
                            <span className="font-medium">{selectedFromAccount.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Amount:</span>
                            <span className="text-red-500 font-medium">
                              -{formData.amount.toFixed(2)} {selectedFromAccount.currency}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">New Balance:</span>
                            <span className="text-sm text-gray-700">
                              {(selectedFromAccount.amount - formData.amount).toFixed(2)} {selectedFromAccount.currency}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">To:</span>
                            <span className="font-medium">{selectedToAccount.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Amount:</span>
                            <span className="text-green-500 font-medium">
                              +{conversionDetails.convertedAmount.toFixed(2)} {selectedToAccount.currency}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">New Balance:</span>
                            <span className="text-sm text-gray-700">
                              {(selectedToAccount.amount + conversionDetails.convertedAmount).toFixed(2)} {selectedToAccount.currency}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Currency Conversion Info */}
                      {selectedFromAccount.currency !== selectedToAccount.currency &&
                        !conversionDetails.error &&
                        !fetchingRates && (
                          <div className="p-3 border-t border-blue-100 bg-blue-50/50">
                            <div className="flex items-center text-blue-700 mb-2">
                              <Info size={14} className="mr-1" />
                              <span className="font-medium">Currency Conversion</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="px-3 py-2 bg-white rounded-lg border border-blue-200 text-blue-900">
                                <p className="text-sm font-medium">
                                  {formData.amount.toFixed(2)} {selectedFromAccount.currency}
                                </p>
                              </div>

                              <div className="flex items-center justify-center px-2">
                                <ArrowRight size={16} className="text-blue-500" />
                              </div>

                              <div className="px-3 py-2 bg-blue-500 text-white rounded-lg shadow-md">
                                <p className="text-sm font-medium">
                                  {conversionDetails.convertedAmount.toFixed(2)}{" "}
                                  {selectedToAccount.currency}
                                </p>
                              </div>
                            </div>

                            <div className="text-xs mt-2 text-blue-600 text-center">
                              <p className="flex items-center justify-center">
                                <span className="mr-1">💱</span>
                                Exchange rate: 1 {selectedFromAccount.currency} ={" "}
                                {conversionDetails.rate.toFixed(4)}{" "}
                                {selectedToAccount.currency}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </motion.div>
              )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50/50 flex justify-between">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !selectedFromAccount ||
              !selectedToAccount ||
              formData.amount <= 0 ||
              (selectedFromAccount && selectedFromAccount.amount < formData.amount)
            }
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              "🔄"
            )}
            Transfer Money
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TransferDefaultAccounts;