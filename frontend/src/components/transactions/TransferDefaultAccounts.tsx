import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Search, ArrowRight, ArrowLeft, AlertCircle, Info, DollarSign } from "lucide-react";
import { Account } from "../../interfaces/Account";
import { TransactionType } from "../../interfaces/enums";
import {
  convertAmount,
  getExchangeRate,
  validateCurrencyConversion,
  ExchangeRates,
} from "../../services/exchangeRateService";
import { transferFundsDefault } from "../../services/transactionService";

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
          className="w-full pl-8 pr-3 py-2.5 text-sm border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors shadow-sm bg-blue-50/50"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-28 overflow-y-auto"
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
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [amountString, setAmountString] = useState("");
  const [selectedFromAccount, setSelectedFromAccount] = useState<Account | null>(null);
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(null);
  const [fromAccountSearchTerm, setFromAccountSearchTerm] = useState("");
  const [toAccountSearchTerm, setToAccountSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setIsClosing] = useState(false);
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

  const steps = ["Source & Amount", "Destination & Review"];

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
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

  const resetForm = () => {
    setCurrentStep(1);
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

  const clearFromAccountSelection = () => {
    setSelectedFromAccount(null);
    setFromAccountSearchTerm("");
  };

  const clearToAccountSelection = () => {
    setSelectedToAccount(null);
    setToAccountSearchTerm("");
  };

  const accountSuggestions = accounts.map(acc => ({
    id: acc.id,
    name: acc.name,
    amount: acc.amount,
    currency: acc.currency
  }));

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedFromAccount && formData.amount > 0;
      case 2:
        return selectedToAccount;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

   
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
      await transferFundsDefault(
        
        formData.amount,
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            {/* From Account */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-blue-500 mr-1">💳</span>
                From Account<span className="text-blue-500">*</span>
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-11 bg-gray-200 rounded-xl"></div>
              ) : accounts.length === 0 ? (
                <div className="p-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
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
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-800 text-sm">
                            {selectedFromAccount.name}
                          </div>
                          <div className="text-xs text-blue-600">
                            Balance: {selectedFromAccount.amount.toFixed(2)}{" "}
                            {selectedFromAccount.currency}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearFromAccountSelection}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-blue-500 mr-1">💰</span>
                Amount<span className="text-blue-500">*</span>
              </label>
              <div className="relative">
                <DollarSign
                  size={14}
                  className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-blue-400"
                />
                <input
                  type="text"
                  className="w-full pl-8 pr-20 py-2.5 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-blue-50/50 shadow-sm font-medium text-sm"
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
                  required
                />
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-sm font-medium text-blue-600">
                  {selectedFromAccount?.currency || "---"}
                </div>
              </div>
              {!selectedFromAccount && (
                <div className="mt-1 text-xs text-gray-500 flex items-center">
                  <Info size={12} className="mr-1 text-blue-500" />
                  Select a source account first
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* To Account */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <span className="text-blue-500 mr-1">💳</span>
                To Account<span className="text-blue-500">*</span>
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-11 bg-gray-200 rounded-xl"></div>
              ) : accounts.length === 0 ? (
                <div className="p-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
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
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-800 text-sm">
                            {selectedToAccount.name}
                          </div>
                          <div className="text-xs text-blue-600">
                            Balance: {selectedToAccount.amount.toFixed(2)}{" "}
                            {selectedToAccount.currency}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearToAccountSelection}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Preview Section */}
            {selectedFromAccount && selectedToAccount && (
              <div className="space-y-3">
                {/* Transfer Summary */}
                <div className="p-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-base mb-2 text-blue-800">
                    Transfer Details
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">From:</span>
                      <span className="ml-2 font-medium">
                        {selectedFromAccount?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">To:</span>
                      <span className="ml-2 font-medium">
                        {selectedToAccount?.name}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Amount:</span>
                      <span className="ml-2 font-medium">
                        {formData.amount} {selectedFromAccount.currency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Minimal Transaction Summary */}
                {formData.amount > 0 && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm">
                    <h3 className="font-bold text-blue-700 mb-2 flex items-center text-sm">
                      <span className="mr-1">💸</span>
                      Transaction Summary
                    </h3>

                    {selectedFromAccount.amount < formData.amount ? (
                      <div className="p-2 bg-red-100 rounded-lg border border-red-200">
                        <div className="flex items-center text-red-600 font-medium mb-1">
                          <AlertCircle size={14} className="mr-2" />
                          Insufficient funds
                        </div>
                        <div className="text-xs text-red-700">
                          Available: {selectedFromAccount.amount.toFixed(2)} {selectedFromAccount.currency} | 
                          Needed: {formData.amount.toFixed(2)} {selectedFromAccount.currency}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <div className="flex items-center justify-between text-sm">
                          {/* From Account New Balance */}
                          <div className="text-left">
                            <div className="text-gray-600 text-xs">{selectedFromAccount.name}</div>
                            <div className="font-bold text-gray-800">
                              {(selectedFromAccount.amount - formData.amount).toFixed(2)} {selectedFromAccount.currency}
                            </div>
                          </div>

                          {/* Transfer Amount */}
                          <div className="text-center px-4">
                            <div className="h-px bg-blue-300 w-full mb-1"></div>
                            <div className="text-blue-700 font-medium text-xs">
                              {formData.amount.toFixed(2)} {selectedFromAccount.currency}
                              {selectedFromAccount.currency !== selectedToAccount.currency && (
                                <div className="text-gray-500 mt-0.5">
                                  ({conversionDetails.convertedAmount.toFixed(2)} {selectedToAccount.currency})
                                </div>
                              )}
                            </div>
                            <div className="h-px bg-blue-300 w-full mt-1"></div>
                          </div>

                          {/* To Account New Balance */}
                          <div className="text-right">
                            <div className="text-gray-600 text-xs">{selectedToAccount.name}</div>
                            <div className="font-bold text-gray-800">
                              {(selectedToAccount.amount + conversionDetails.convertedAmount).toFixed(2)} {selectedToAccount.currency}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 "
        onClick={handleClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
        style={{
          width: isMobileView ? "90%" : "28rem",
          minHeight: "50vh",
          maxHeight: "90vh",
        }}
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
          {/* Mobile-optimized background elements */}
          <div
            className={`absolute top-0 right-0 bg-white/20 rounded-full ${
              isMobileView
                ? "w-10 h-10 -translate-y-5 translate-x-5"
                : "w-12 h-12 -translate-y-6 translate-x-6"
            }`}
          ></div>
          <div
            className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${
              isMobileView
                ? "w-6 h-6 translate-y-3 -translate-x-3"
                : "w-8 h-8 translate-y-4 -translate-x-4"
            }`}
          ></div>
          <div
            className={`absolute bg-white/15 rounded-full ${
              isMobileView ? "top-1 left-12 w-4 h-4" : "top-1 left-14 w-6 h-6"
            }`}
          ></div>

          <div className={`${isMobileView ? "px-4 py-3" : "px-4 py-3"} flex items-center justify-between relative z-10 mb-2`}>
            <div className="flex items-center">
              <div className={`bg-white rounded-full flex items-center justify-center mr-3 shadow-lg ${isMobileView ? "w-8 h-8" : "w-10 h-10"}`}>
                <span className={isMobileView ? "text-base" : "text-lg"}>🔄</span>
              </div>
              <div>
                <h2 className={`font-bold text-white ${isMobileView ? "text-base" : "text-lg"}`}>
                  Transfer Money
                </h2>
                <p className={`text-white/90 ${isMobileView ? "text-xs" : "text-sm"}`}>
                  {steps[currentStep - 1]}
                </p>
              </div>
            </div>

            <motion.button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={isMobileView ? 18 : 20} />
            </motion.button>
          </div>

          {/* Progress */}
          <div className={`${isMobileView ? "px-4 pb-3" : "px-4 pb-3"} relative z-10`}>
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded transition-all duration-300 ${
                    index < currentStep ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${isMobileView ? "p-3" : "p-4"}`}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 shadow-sm"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 backdrop-blur-sm flex justify-between`}>
          <motion.button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            whileHover={{ scale: currentStep === 1 ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft size={14} />
            Back
          </motion.button>

          {currentStep < 2 ? (
            <motion.button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-sm"
              whileHover={{ scale: !canProceed() ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue
              <ArrowRight size={14} />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                !selectedFromAccount ||
                !selectedToAccount ||
                formData.amount <= 0 ||
                (selectedFromAccount && selectedFromAccount.amount < formData.amount)
              }
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-sm"
              whileHover={{ scale: isLoading || !selectedFromAccount || !selectedToAccount || formData.amount <= 0 || (selectedFromAccount && selectedFromAccount.amount < formData.amount) ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
              ) : (
                "🔄"
              )}
              Transfer Money
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TransferDefaultAccounts;