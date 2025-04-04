import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Filter, X } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  dateRange: { start: Date | null; end: Date | null };
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  externalPopupOpen?: boolean; // New prop to track external popups
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  activeTab,
  dateRange,
  setDateRange,
  externalPopupOpen = false,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [filterPosition, setFilterPosition] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (filterButtonRef.current && filtersOpen) {
      const rect = filterButtonRef.current.getBoundingClientRect();

      if (isMobile) {
        setFilterPosition({
          top: Math.max(window.innerHeight / 2 - 200, 20),
          right: 0,
        });
      } else {
        const rightPosition = window.innerWidth - rect.right - window.scrollX;
        const topPosition = rect.bottom + window.scrollY + 10;

        const spaceBelow = window.innerHeight - topPosition;
        const modalHeight = filterPanelRef.current?.offsetHeight || 300; // Default height estimate

        const finalTopPosition =
          spaceBelow < modalHeight && rect.top > modalHeight
            ? rect.top - modalHeight - 10
            : topPosition;

        setFilterPosition({
          top: finalTopPosition,
          right: rightPosition,
        });
      }
    }
  }, [filtersOpen, isMobile]);

  useEffect(() => {
    if (dateRange.start) {
      setStartDate(dateRange.start.toISOString().split("T")[0]);
    }
    if (dateRange.end) {
      setEndDate(dateRange.end.toISOString().split("T")[0]);
    }
  }, [dateRange]);

  useEffect(() => {
    const hasFilters = Boolean(dateRange.start || dateRange.end);
    setHasActiveFilters(hasFilters);
  }, [dateRange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filtersOpen &&
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setFiltersOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filtersOpen]);

  // Effect to close filters when external popup opens or component unmounts
  useEffect(() => {
    if (externalPopupOpen && filtersOpen) {
      setFiltersOpen(false);
    }

    return () => {
      // Ensure filters are closed when component unmounts
      if (filtersOpen) {
        setFiltersOpen(false);
      }
    };
  }, [externalPopupOpen, filtersOpen]);

  const getTabColor = () => {
    if (activeTab === "income") {
      return {
        border: "border-green-300",
        focusRing: "focus:ring-green-500",
        hoverBorder: "group-hover:border-green-400",
        textColor: "text-green-400",
        hoverText: "hover:text-green-600",
        bgColor: "bg-green-50",
        activeBg: "bg-green-500",
        buttonBg: "bg-green-500",
        buttonHover: "hover:bg-green-600",
        badgeBg: "bg-green-100",
        badgeText: "text-green-700",
        gradientFrom: "from-green-500",
        gradientTo: "to-emerald-600",
      };
    } else if (activeTab === "expenses") {
      return {
        border: "border-red-300",
        focusRing: "focus:ring-red-500",
        hoverBorder: "group-hover:border-red-400",
        textColor: "text-red-400",
        hoverText: "hover:text-red-600",
        bgColor: "bg-red-50",
        activeBg: "bg-red-500",
        buttonBg: "bg-red-500",
        buttonHover: "hover:bg-red-600",
        badgeBg: "bg-red-100",
        badgeText: "text-red-700",
        gradientFrom: "from-red-500",
        gradientTo: "to-pink-600",
      };
    } else {
      return {
        border: "border-blue-300",
        focusRing: "focus:ring-blue-500",
        hoverBorder: "group-hover:border-blue-400",
        textColor: "text-blue-400",
        hoverText: "hover:text-blue-600",
        bgColor: "bg-blue-50",
        activeBg: "bg-blue-500",
        buttonBg: "bg-blue-500",
        buttonHover: "hover:bg-blue-600",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-700",
        gradientFrom: "from-blue-500",
        gradientTo: "to-indigo-600",
      };
    }
  };

  const colors = getTabColor();

  const toggleFilters = () => {
    // Don't open filters if another popup is open
    if (externalPopupOpen) return;
    setFiltersOpen(!filtersOpen);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setDateRange({ start: null, end: null });
  };

  const applyFilters = () => {
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;

    setDateRange({
      start: parsedStartDate,
      end: parsedEndDate,
    });

    setFiltersOpen(false);
  };

  return (
    <div className="relative" ref={searchContainerRef}>
      <div className={`relative group transition-all duration-300`}>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Search input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={isMobile ? "Search..." : "Search transactions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full sm:w-40 md:w-48 pl-9 sm:pl-8 pr-3 py-2.5 sm:py-2 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:border-transparent text-gray-700 text-sm transition-all duration-300 ${colors.border} ${colors.focusRing} ${colors.hoverBorder}`}
            />
            <svg
              className={`absolute left-3 sm:left-2.5 top-3 sm:top-2.5 h-4 w-4 sm:h-3.5 sm:w-3.5 transition-colors duration-300 ${colors.textColor}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute right-3 sm:right-2.5 top-3 sm:top-2.5 h-4 w-4 sm:h-3.5 sm:w-3.5 transition-colors duration-300 ${colors.textColor} ${colors.hoverText}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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
            )}
          </div>

          {/* Filter button with calendar and filter icons */}
          <motion.button
            ref={filterButtonRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFilters}
            className={`relative flex items-center justify-center h-10 w-10 sm:h-8 sm:w-8 rounded-full ${
              hasActiveFilters
                ? `${colors.activeBg} text-white`
                : `${colors.bgColor} ${colors.textColor}`
            } shadow-sm transition-all duration-300 hover:shadow`}
            aria-label="Open date filters"
          >
            <div className="flex items-center justify-center">
              <Calendar size={isMobile ? 18 : 16} />
            </div>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${colors.badgeBg}`}
                ></span>
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Filter dropdown - using a portal would be better here */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            ref={filterPanelRef}
            initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, y: -10 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, y: -10 }}
            className={`${
              isMobile
                ? "fixed left-0 right-0 max-h-[90vh] overflow-auto rounded-t-xl z-[70] mx-0 bottom-0"
                : "fixed z-[70] w-80 rounded-xl"
            } bg-white shadow-xl`}
            style={
              isMobile
                ? {
                    top: "auto",
                    bottom: 0,
                    zIndex: 70,
                  }
                : {
                    top: `${filterPosition.top}px`,
                    right: `${filterPosition.right}px`,
                    maxHeight: "calc(100vh - 20px)",
                    overflowY: "auto",
                    zIndex: 70,
                  }
            }
          >
            <div
              className={`bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} px-4 py-4 ${isMobile ? "rounded-t-xl" : "rounded-t-xl"} flex justify-between items-center sticky top-0 z-10`}
            >
              <h3 className="text-base font-medium text-white flex items-center">
                <Calendar size={isMobile ? 20 : 16} className="mr-2" /> Date
                Filter
              </h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
              >
                <X size={isMobile ? 20 : 16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Calendar
                    size={isMobile ? 18 : 16}
                    className="mr-2 text-gray-500"
                  />
                  Select Date Range
                </label>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">From:</span>
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-16 pr-10 py-3 shadow-sm ${isMobile ? "mobile-date-input" : ""}`}
                      onClick={(e) => isMobile && e.currentTarget.showPicker()}
                      onTouchEnd={(e) =>
                        isMobile && e.currentTarget.showPicker()
                      }
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Calendar
                        className="h-5 w-5 text-gray-400"
                        onClick={() => {
                          if (isMobile) {
                            const input =
                              document.querySelector('input[type="date"]');
                            if (input) {
                              (input as HTMLInputElement).showPicker();
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">To:</span>
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-16 pr-10 py-3 shadow-sm ${isMobile ? "mobile-date-input" : ""}`}
                      onClick={(e) => isMobile && e.currentTarget.showPicker()}
                      onTouchEnd={(e) =>
                        isMobile && e.currentTarget.showPicker()
                      }
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Calendar
                        className="h-5 w-5 text-gray-400"
                        onClick={() => {
                          if (isMobile) {
                            const inputs =
                              document.querySelectorAll('input[type="date"]');
                            if (inputs.length > 1) {
                              (inputs[1] as HTMLInputElement).showPicker();
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center space-x-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-3 sm:py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-300 shadow-sm flex items-center justify-center"
                >
                  <X size={isMobile ? 18 : 16} className="mr-2" />
                  Clear
                </button>
                <button
                  onClick={applyFilters}
                  className={`flex-1 px-4 py-3 sm:py-2.5 bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-sm flex items-center justify-center`}
                >
                  <Calendar size={isMobile ? 18 : 16} className="mr-2" />
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal backdrop for mobile */}
      <AnimatePresence>
        {filtersOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[65]"
            onClick={() => setFiltersOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
