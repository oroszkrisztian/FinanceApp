import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  RefreshCw,
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  ExchangeRates,
  fetchExchangeRates,
  convertAmount,
  validateCurrencyConversion,
} from "../../services/exchangeRateService";
import { CurrencyType } from "../../interfaces/enums";

interface UpcomingPaymentsSectionProps {
  futureOutgoingPayments: any[];
  futureIncomingPayments: any[];
  displayCurrency: string;
}

const UpcomingPaymentsSection: React.FC<UpcomingPaymentsSectionProps> = ({
  futureOutgoingPayments,
  futureIncomingPayments,
  displayCurrency: initialDisplayCurrency,
}) => {
  const [displayCurrency, setDisplayCurrency] = useState<string>(
    initialDisplayCurrency || CurrencyType.RON
  );
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    const loadExchangeRates = async () => {
      setFetchingRates(true);
      try {
        const ratesData = await fetchExchangeRates();
        setRates(ratesData);
        setAvailableCurrencies(Object.keys(ratesData));
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
      } finally {
        setFetchingRates(false);
      }
    };
    loadExchangeRates();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const convertToDisplayCurrency = (
    amount: number,
    currency: string
  ): number => {
    if (currency === displayCurrency || Object.keys(rates).length === 0) {
      return amount;
    }
    try {
      const validation = validateCurrencyConversion(
        currency as CurrencyType,
        displayCurrency as CurrencyType,
        rates
      );
      if (!validation.valid) {
        console.error(validation.error);
        return amount;
      }
      return convertAmount(amount, currency, displayCurrency, rates);
    } catch (err) {
      console.error("Conversion error:", err);
      return amount;
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setDisplayCurrency(currency);
    setIsCurrencyMenuOpen(false);
  };

  const sortedPayments = useMemo(() => {
    // Combine all payments and sort by date (closest first)
    const allPayments = [
      ...futureIncomingPayments.map((p) => ({ ...p, isIncome: true })),
      ...futureOutgoingPayments.map((p) => ({ ...p, isIncome: false })),
    ];

    return allPayments
      .filter((payment) => payment.nextExecution && payment.amount > 0)
      .sort((a, b) => {
        const dateA = new Date(a.nextExecution).getTime();
        const dateB = new Date(b.nextExecution).getTime();
        return dateA - dateB;
      })
      .slice(0, 8); // Show only first 8 payments
  }, [futureOutgoingPayments, futureIncomingPayments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  if (sortedPayments.length === 0) {
    return (
      <div
        className={` bg-white rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden ${
          isMobileView ? "p-4 mb-4 mx-2" : "p-6 mb-8"
        }`}
      >
        {/* Background decorative elements */}
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-20 ${
            isMobileView
              ? "w-12 h-12 -translate-y-6 translate-x-6"
              : "w-14 h-24 -translate-y-12 translate-x-12"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 bg-gradient-to-tr from-orange-200 to-pink-200 rounded-full opacity-15 ${
            isMobileView
              ? "w-8 h-8 translate-y-4 -translate-x-4"
              : "w-16 h-16 translate-y-8 -translate-x-8"
          }`}
        ></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <motion.div
              className={`bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ${
                isMobileView ? "w-8 h-8" : "w-12 h-12"
              }`}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Calendar
                className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`}
              />
            </motion.div>
            <div>
              <h3
                className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                  isMobileView ? "text-lg" : "text-xl"
                }`}
              >
                Upcoming Payments
              </h3>
              <p
                className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
              >
                Future income & expenses
              </p>
            </div>
          </div>

          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar
                className={`${isMobileView ? "w-12 h-12" : "w-16 h-16"} mx-auto`}
              />
            </div>
            <p className={`text-gray-600 ${isMobileView ? "text-sm" : ""}`}>
              No upcoming payments scheduled
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden ${
        isMobileView ? "p-4 mb-4 mx-2" : "p-6 mb-8"
      }`}
      style={{ height: "400px" }}
    >
      {/* Background decorative elements */}
      <div
        className={`absolute top-0 right-0 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-20 ${
          isMobileView
            ? "w-12 h-12 -translate-y-6 translate-x-6"
            : "w-24 h-24 -translate-y-12 translate-x-12"
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 bg-gradient-to-tr from-orange-200 to-pink-200 rounded-full opacity-15 ${
          isMobileView
            ? "w-8 h-8 translate-y-4 -translate-x-4"
            : "w-16 h-16 translate-y-8 -translate-x-8"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-10 ${
          isMobileView ? "top-3 left-16 w-6 h-6" : "top-6 left-24 w-12 h-12"
        }`}
      ></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header Section */}
        <div
          className={`flex ${isMobileView ? "flex-col space-y-3" : "justify-between items-center"} ${
            isMobileView ? "mb-4" : "mb-6"
          } flex-shrink-0`}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className={`bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ${
                isMobileView ? "w-8 h-8" : "w-12 h-12"
              }`}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Calendar
                className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`}
              />
            </motion.div>
            <div>
              <h3
                className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                  isMobileView ? "text-lg" : "text-xl"
                }`}
              >
                Upcoming Payments
              </h3>
              <p
                className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
              >
                {sortedPayments.length} scheduled payment
                {sortedPayments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="relative" ref={currencyRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors flex items-center shadow-md ${
                isMobileView ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
              }`}
              onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
              disabled={fetchingRates}
            >
              {fetchingRates ? (
                <RefreshCw
                  size={isMobileView ? 10 : 12}
                  className="animate-spin mr-1"
                />
              ) : (
                <DollarSign size={isMobileView ? 10 : 12} className="mr-1" />
              )}
              <span>{displayCurrency}</span>
              <ChevronDown size={isMobileView ? 10 : 12} className="ml-1" />
            </motion.button>

            <AnimatePresence>
              {isCurrencyMenuOpen && availableCurrencies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute ${isMobileView ? "top-full left-0" : "top-full right-0"} mt-2 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 ${
                    isMobileView ? "w-24" : "w-32"
                  }`}
                >
                  <div className="max-h-32 overflow-y-auto">
                    {availableCurrencies.map((currency) => (
                      <button
                        key={currency}
                        className={`w-full text-left px-3 py-2 transition-colors text-sm ${
                          currency === displayCurrency
                            ? "bg-purple-100 text-purple-700 font-medium"
                            : "text-gray-700 hover:bg-purple-50"
                        }`}
                        onClick={() => handleCurrencyChange(currency)}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scrollable Payment List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-2 pr-2" style={{ paddingBottom: "1rem" }}>
            {sortedPayments.map((payment, index) => {
              const originalAmount = payment.amount || 0;
              const originalCurrency = payment.currency || displayCurrency;
              const convertedAmount = convertToDisplayCurrency(
                originalAmount,
                originalCurrency
              );
              const needsConversion = originalCurrency !== displayCurrency;

              return (
                <motion.div
                  key={payment.id || index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border-l-3 ${
                    payment.isIncome
                      ? "bg-green-50/50 border-l-green-400"
                      : "bg-red-50/50 border-l-red-400"
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {/* Icon */}
                    <div
                      className={`p-1 rounded ${
                        payment.isIncome
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {payment.isIncome ? (
                        <ArrowDown size={12} />
                      ) : (
                        <ArrowUp size={12} />
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {payment.description || payment.name || "Payment"}
                        </p>
                        <div className="text-right ml-2">
                          <p
                            className={`text-sm font-bold ${
                              payment.isIncome
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {payment.isIncome ? "+" : "-"}
                            {originalAmount.toFixed(0)} {originalCurrency}
                          </p>
                          {needsConversion && (
                            <p className="text-xs text-gray-500">
                              {convertedAmount.toFixed(0)} {displayCurrency}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">
                            {formatDate(payment.nextExecution)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Show more indicator if there are more payments */}
            {futureIncomingPayments.length + futureOutgoingPayments.length >
              8 && (
              <div className="text-center mt-3 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  +
                  {futureIncomingPayments.length +
                    futureOutgoingPayments.length -
                    8}{" "}
                  more payments
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingPaymentsSection;
