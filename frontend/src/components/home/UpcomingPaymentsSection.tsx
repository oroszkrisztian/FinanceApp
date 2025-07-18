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
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expenses'>('all');
  const [displayCurrency, setDisplayCurrency] = useState<string>(
    initialDisplayCurrency || CurrencyType.RON
  );
  const [rates, setRates] = useState<ExchangeRates>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
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

  const openPreview = (payment: any) => {
    setPreviewItem(payment);
  };

  const closePreview = () => {
    setPreviewItem(null);
  };

  const allPayments = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const combined = [
      ...futureIncomingPayments.map((p) => ({ ...p, isIncome: true })),
      ...futureOutgoingPayments.map((p) => ({ ...p, isIncome: false })),
    ];

    return combined
      .filter((payment) => {
        if (!payment.nextExecution || !payment.amount || payment.amount <= 0) {
          return false;
        }
        
        const paymentDate = new Date(payment.nextExecution);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      })
      .sort((a, b) => {
        const dateA = new Date(a.nextExecution).getTime();
        const dateB = new Date(b.nextExecution).getTime();
        return dateA - dateB;
      });
  }, [futureOutgoingPayments, futureIncomingPayments]); // NO rates dependency

  const sortedPayments = useMemo(() => {
    let filtered = allPayments;
    
    if (activeTab === 'income') {
      filtered = allPayments.filter(payment => payment.isIncome);
    } else if (activeTab === 'expenses') {
      filtered = allPayments.filter(payment => !payment.isIncome);
    }
    
    return filtered;
  }, [allPayments, activeTab]);

  const incomeCount = allPayments.filter(p => p.isIncome).length;
  const expenseCount = allPayments.filter(p => !p.isIncome).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const paymentDate = new Date(dateString);
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPaymentUrgency = (daysUntil: number) => {
    if (daysUntil <= 1) return 'urgent';
    if (daysUntil <= 3) return 'soon';
    if (daysUntil <= 7) return 'upcoming';
    return 'future';
  };

  if (allPayments.length === 0) {
    return (
      <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
          isMobileView 
            ? "p-3 mb-4 mx-2" 
            : "p-6 mb-8"
        }`}
        style={{ 
          height: isMobileView ? "350px" : "400px",
          overflowX: "hidden"
        }}
      >
        {/* Mobile-optimized background elements */}
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-violet-300 to-purple-500 rounded-full opacity-20 ${
            isMobileView
              ? "w-12 h-12 -translate-y-6 translate-x-6"
              : "w-28 h-28 -translate-y-14 translate-x-14"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 bg-gradient-to-tr from-emerald-300 to-teal-500 rounded-full opacity-15 ${
            isMobileView
              ? "w-8 h-8 translate-y-4 -translate-x-4"
              : "w-20 h-20 translate-y-10 -translate-x-10"
          }`}
        ></div>
        <div
          className={`absolute bg-gradient-to-br from-pink-300 to-rose-500 rounded-full opacity-10 ${
            isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
          }`}
        ></div>

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-3">
            <motion.div
              className={`bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md ${
                isMobileView ? "w-8 h-8" : "w-12 h-12"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
                This month's payments
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <motion.div 
                className="text-gray-400 mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Calendar
                  className={`${isMobileView ? "w-8 h-8" : "w-12 h-12"} mx-auto`}
                />
              </motion.div>
              <p className={`text-gray-600 ${isMobileView ? "text-sm" : ""}`}>
                No payments scheduled this month
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
        isMobileView 
          ? "p-3 mb-4 mx-2" 
          : "p-6 mb-8"
      }`}
      style={{ 
        height: isMobileView ? "350px" : "400px",
        overflowX: "hidden"
      }}
    >
      {/* Background elements */}
      <div
        className={`absolute top-0 right-0 bg-gradient-to-br from-violet-300 to-purple-500 rounded-full opacity-20 ${
          isMobileView
            ? "w-12 h-12 -translate-y-6 translate-x-6"
            : "w-28 h-28 -translate-y-14 translate-x-14"
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 bg-gradient-to-tr from-emerald-300 to-teal-500 rounded-full opacity-15 ${
          isMobileView
            ? "w-8 h-8 translate-y-4 -translate-x-4"
            : "w-20 h-20 translate-y-10 -translate-x-10"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-pink-300 to-rose-500 rounded-full opacity-10 ${
          isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
        }`}
      ></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className={`flex-shrink-0 ${isMobileView ? "mb-3" : "mb-6"}`}>
          {/* Title Section*/}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <motion.div
                className={`bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md ${
                  isMobileView ? "w-8 h-8" : "w-12 h-12"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
                  {(() => {
                    const totalForFilter = activeTab === 'income' ? incomeCount : 
                                         activeTab === 'expenses' ? expenseCount : 
                                         allPayments.length;
                    return `${totalForFilter} payment${totalForFilter !== 1 ? 's' : ''} this month`;
                  })()}
                </p>
              </div>
            </div>

            {/* Currency Selector*/}
            <div className="relative" ref={currencyRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full transition-all duration-200 flex items-center shadow-md ${
                  isMobileView ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
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
                    className={`absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 ${
                      isMobileView ? "w-20" : "w-32"
                    }`}
                  >
                    <div className="max-h-32 overflow-y-auto">
                      {availableCurrencies.map((currency) => (
                        <motion.button
                          key={currency}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full text-left px-3 py-2 transition-colors ${isMobileView ? "text-xs" : "text-sm"} ${
                            currency === displayCurrency
                              ? "bg-indigo-100 text-indigo-700 font-medium"
                              : "text-gray-700 hover:bg-indigo-50 active:bg-indigo-100"
                          }`}
                          onClick={() => handleCurrencyChange(currency)}
                        >
                          {currency}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/*Mobile Tab System */}
          <div className="relative">
            <div className={`flex ${isMobileView ? "space-x-1" : "space-x-1"} bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1 shadow-inner`}>
              <motion.button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-indigo-400 to-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 active:bg-white/70'
                }`}
                whileHover={{ scale: activeTab !== 'all' ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>📋</span>
                  <span className={isMobileView ? "text-xs" : ""}>All</span>
                  {allPayments.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full ${isMobileView ? "text-xs" : "text-xs"} ${
                      activeTab === 'all' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {allPayments.length}
                    </span>
                  )}
                </div>
              </motion.button>

              <motion.button
                onClick={() => setActiveTab('income')}
                className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'income'
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 active:bg-white/70'
                }`}
                whileHover={{ scale: activeTab !== 'income' ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>💰</span>
                  <span className={isMobileView ? "text-xs" : ""}>Income</span>
                  {incomeCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full ${isMobileView ? "text-xs" : "text-xs"} ${
                      activeTab === 'income' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {incomeCount}
                    </span>
                  )}
                </div>
              </motion.button>

              <motion.button
                onClick={() => setActiveTab('expenses')}
                className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'expenses'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 active:bg-white/70'
                }`}
                whileHover={{ scale: activeTab !== 'expenses' ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>💸</span>
                  <span className={isMobileView ? "text-xs" : ""}>Expenses</span>
                  {expenseCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full ${isMobileView ? "text-xs" : "text-xs"} ${
                      activeTab === 'expenses' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {expenseCount}
                    </span>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Scrollable Payment List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="pr-2" style={{ paddingBottom: "1rem" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} 
                className="space-y-2 overflow-x-hidden"
              >
                {sortedPayments.length === 0 ? (
                  <div className="text-center py-6">
                    <motion.div 
                      className="text-gray-400 mb-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Calendar className={`${isMobileView ? "w-8 h-8" : "w-12 h-12"} mx-auto`} />
                    </motion.div>
                    <p className={`text-gray-600 ${isMobileView ? "text-sm" : ""}`}>
                      No {activeTab === 'income' ? 'income' : activeTab === 'expenses' ? 'expense' : ''} payments scheduled this month
                    </p>
                  </div>
                ) : (
                  <>
                    {sortedPayments.map((payment, index) => {
                      const originalAmount = payment.amount || 0;
                      const originalCurrency = payment.currency || displayCurrency;
                      const convertedAmount = convertToDisplayCurrency(
                        originalAmount,
                        originalCurrency
                      );
                      const needsConversion = originalCurrency !== displayCurrency;
                      const daysUntil = getDaysUntil(payment.nextExecution);
                      const urgency = getPaymentUrgency(daysUntil);

                      return (
                        <motion.div
                          key={payment.id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }} 
                          whileTap={{ scale: 0.98 }}
                          onClick={() => openPreview(payment)}
                          className={`p-3 rounded-xl border-l-4 shadow-sm hover:shadow-md active:shadow-lg transition-all cursor-pointer w-full ${
                            payment.isIncome
                              ? urgency === 'urgent'
                                ? 'bg-gradient-to-r from-emerald-50 to-green-100 border-l-emerald-500 hover:from-emerald-100 hover:to-green-150'
                                : urgency === 'soon'
                                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-l-emerald-400 hover:from-emerald-100 hover:to-teal-100'
                                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-green-400 hover:from-green-100 hover:to-emerald-100'
                              : urgency === 'urgent'
                                ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-red-500 hover:from-red-100 hover:to-red-150'
                                : urgency === 'soon'
                                ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-red-400 hover:from-red-100 hover:to-red-150'
                                : 'bg-gradient-to-r from-red-50 to-red-100 border-l-red-400 hover:from-red-100 hover:to-red-150'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              
                              <div
                                className={`${isMobileView ? "p-2" : "p-2"} rounded-xl shadow-sm ${
                                  payment.isIncome
                                    ? urgency === 'urgent'
                                      ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white'
                                      : 'bg-emerald-100 text-emerald-600'
                                    : urgency === 'urgent'
                                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                                      : 'bg-red-100 text-red-600'
                                }`}
                              >
                                {payment.isIncome ? (
                                  <ArrowDown size={14} />
                                ) : (
                                  <ArrowUp size={14} />
                                )}
                              </div>

                              {/*Payment Info */}
                              <div className="flex-1 min-w-0 max-w-full">
                                <div className="flex items-start justify-between">
                                  <div className="min-w-0 flex-1 max-w-full">
                                    <div className="flex items-center gap-2 flex-wrap max-w-full">
                                      <p className={`font-semibold text-gray-900 truncate max-w-full ${isMobileView ? "text-sm" : "text-sm"}`}>
                                        {payment.description || payment.name || "Payment"}
                                      </p>
                                      {urgency === 'urgent' && (
                                        <span className={`px-1.5 py-0.5 rounded-full font-medium ${isMobileView ? "text-xs" : "text-xs"} ${
                                          payment.isIncome 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          {daysUntil === 0 ? '⚡' : '🔥'}
                                        </span>
                                      )}
                                      {payment.frequency && (
                                        <span className={`bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-normal ${isMobileView ? "text-xs" : "text-xs"}`}>
                                          {payment.frequency}
                                        </span>
                                      )}
                                    </div>

                                    {/* Compact Date and Days Until */}
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className={`text-gray-600 font-medium ${isMobileView ? "text-xs" : "text-xs"}`}>
                                        📅 {formatDate(payment.nextExecution)}
                                      </span>
                                      <span className={`font-medium ${isMobileView ? "text-xs" : "text-xs"} ${
                                        urgency === 'urgent' 
                                          ? 'text-red-600' 
                                          : urgency === 'soon'
                                          ? 'text-red-500'
                                          : 'text-gray-500'
                                      }`}>
                                        ({daysUntil === 0 ? 'Today' : 
                                          daysUntil === 1 ? 'Tomorrow' : 
                                          `${daysUntil}d`})
                                      </span>
                                    </div>
                                  </div>

                                  {/*Amount Display */}
                                  <div className="text-right ml-3 flex-shrink-0 max-w-[40%]">
                                    <p
                                      className={`font-bold break-words ${isMobileView ? "text-sm" : "text-sm"} ${
                                        payment.isIncome
                                          ? "text-emerald-700"
                                          : "text-red-700"
                                      }`}
                                    >
                                      {payment.isIncome ? "+" : "-"}
                                      {originalAmount.toFixed(0)} {originalCurrency}
                                    </p>
                                    {needsConversion && (
                                      <p className={`text-gray-500 font-normal break-words ${isMobileView ? "text-xs" : "text-xs"}`}>
                                        ({convertedAmount.toFixed(0)} {displayCurrency})
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Preview Popup */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4 ${
              isMobileView 
                ? "fixed inset-0" 
                : "absolute inset-0"
            }`}
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: isMobileView ? 20 : 0 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: isMobileView ? 20 : 0 }}
              className={`bg-white rounded-2xl shadow-2xl relative overflow-hidden ${
                isMobileView 
                  ? "w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto" 
                  : "w-full max-w-md"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`bg-gradient-to-r ${
                  previewItem.isIncome
                    ? "from-emerald-500 to-teal-600"
                    : "from-red-500 to-red-600"
                } p-4`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      {previewItem.isIncome ? (
                        <ArrowDown className="w-5 h-5 text-white" />
                      ) : (
                        <ArrowUp className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {previewItem.description || previewItem.name || "Payment"}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {previewItem.isIncome ? "Incoming Payment" : "Outgoing Payment"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closePreview}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Payment Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-medium">
                      Amount
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {(previewItem.amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {previewItem.currency || displayCurrency}
                    </p>
                    {previewItem.currency !== displayCurrency && (
                      <p className="text-xs text-gray-500 mt-1">
                        ≈{" "}
                        {convertToDisplayCurrency(
                          previewItem.amount || 0,
                          previewItem.currency || displayCurrency
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {displayCurrency}
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-medium">
                      Days Until
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {(() => {
                        const days = getDaysUntil(previewItem.nextExecution);
                        return days === 0 ? 'Today' : 
                               days === 1 ? 'Tomorrow' : 
                               `${days} days`;
                      })()}
                    </p>
                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Payment Date
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatFullDate(previewItem.nextExecution)}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 gap-4 pt-2">
                  {previewItem.frequency && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Frequency</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {previewItem.frequency}
                      </p>
                    </div>
                  )}
                  
                  {previewItem.category && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Category</p>
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {previewItem.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Urgency Status */}
                <div className="text-center">
                  {(() => {
                    const days = getDaysUntil(previewItem.nextExecution);
                    const urgency = getPaymentUrgency(days);
                    
                    if (urgency === 'urgent') {
                      return (
                        <div className={`flex items-center justify-center space-x-1 ${
                          previewItem.isIncome ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L4.064 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            {days === 0 ? 'Due Today!' : 'Due Tomorrow!'}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-sm text-gray-600">
                          {previewItem.isIncome ? 'Incoming' : 'Outgoing'} in {days} days
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UpcomingPaymentsSection;