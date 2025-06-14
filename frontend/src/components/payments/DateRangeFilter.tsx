import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, X } from "lucide-react";
import { motion } from "framer-motion";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  isSmallScreen: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  colors?: {
    gradientFrom: string;
    gradientTo: string;
  };
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  setDateRange,
  isOpen,
  setIsOpen,
  buttonRef,
  colors = { gradientFrom: "from-green-600", gradientTo: "to-green-500" },
}) => {
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const createDateFromInput = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const [tempStartDate, setTempStartDate] = useState<string>(
    formatDateForInput(dateRange.start)
  );
  const [tempEndDate, setTempEndDate] = useState<string>(
    formatDateForInput(dateRange.end)
  );
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    setTempStartDate(formatDateForInput(dateRange.start));
    setTempEndDate(formatDateForInput(dateRange.end));
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        const windowWidth = window.innerWidth;
        const popupWidth = isMobileView ? 320 : 320;

        let left;
        if (isMobileView) {
          left = (windowWidth - popupWidth) / 2;
        } else {
          left = rect.right + scrollX - popupWidth;
        }

        setPosition({
          top: rect.bottom + scrollY + 4,
          left: left,
        });
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [isOpen, buttonRef, isMobileView]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempEndDate(e.target.value);
  };

  const applyFilters = () => {
    setDateRange({
      start: createDateFromInput(tempStartDate),
      end: createDateFromInput(tempEndDate),
    });
    setIsOpen(false);
  };

  const clearFilters = () => {
    setTempStartDate("");
    setTempEndDate("");
    setDateRange({ start: null, end: null });
    setIsOpen(false);
  };

  const handleMobilePicker = (index: number) => {
    if (isMobileView) {
      const inputs = document.querySelectorAll('input[type="date"]');
      if (inputs[index]) {
        (inputs[index] as HTMLInputElement).showPicker();
      }
    }
  };

  const popupContent = (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{
        opacity: isOpen ? 1 : 0,
        y: isOpen ? 0 : 10,
        scale: isOpen ? 1 : 0.95,
      }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`fixed z-20 bg-white rounded-2xl shadow-2xl border border-gray-100 date-filter-popup overflow-hidden ${
        isOpen ? "block" : "hidden"
      } ${isMobileView ? "w-80 mx-auto" : "w-80"}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Header  */}
      <div
        className={`bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} relative overflow-hidden`}
      >
        {/* Background elements */}
        <div
          className={`absolute top-0 right-0 bg-white/20 rounded-full ${
            isMobileView
              ? "w-8 h-8 -translate-y-4 translate-x-4"
              : "w-10 h-10 -translate-y-5 translate-x-5"
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
            isMobileView ? "top-1 left-12 w-4 h-4" : "top-1 left-16 w-6 h-6"
          }`}
        ></div>

        <div
          className={`relative z-10 flex justify-between items-center ${isMobileView ? "px-3 py-2" : "px-3 py-2"}`}
        >
          <h3
            className={`font-medium text-white flex items-center ${isMobileView ? "text-sm" : "text-sm"}`}
          >
            <div className="bg-white/20 rounded-lg p-1 mr-2 shadow-sm backdrop-blur-sm">
              <Calendar size={isMobileView ? 14 : 14} className="text-white" />
            </div>
            Date Filter
          </h3>
          <motion.button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={isMobileView ? 16 : 14} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div
        className={`relative overflow-hidden ${isMobileView ? "p-3" : "p-3"}`}
      >
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-6 h-6 bg-gray-100/30 rounded-full -translate-y-3 translate-x-3"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 bg-gray-100/20 rounded-full translate-y-2 -translate-x-2"></div>

        <div className="relative z-10 space-y-3">
          <div>
            <label
              className={`block font-medium text-gray-700 mb-2 flex items-center ${isMobileView ? "text-xs" : "text-xs"}`}
            >
              <Calendar
                size={isMobileView ? 14 : 14}
                className="mr-1.5 text-gray-500"
              />
              Select Date Range
            </label>
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span
                    className={`text-gray-500 ${isMobileView ? "text-xs" : "text-xs"}`}
                  >
                    From:
                  </span>
                </div>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={handleStartDateChange}
                  className={`bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm transition-colors ${
                    isMobileView
                      ? "text-xs pl-14 pr-8 py-2"
                      : "text-xs pl-14 pr-8 py-2"
                  } ${isMobileView ? "mobile-date-input" : ""}`}
                  onClick={(e) => isMobileView && e.currentTarget.showPicker()}
                  onTouchEnd={(e) =>
                    isMobileView && e.currentTarget.showPicker()
                  }
                />
                <motion.div
                  className="absolute inset-y-0 right-0 pr-2 flex items-center cursor-pointer"
                  onClick={() => handleMobilePicker(0)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                ></motion.div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span
                    className={`text-gray-500 ${isMobileView ? "text-xs" : "text-xs"}`}
                  >
                    To:
                  </span>
                </div>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={handleEndDateChange}
                  className={`bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm transition-colors ${
                    isMobileView
                      ? "text-xs pl-14 pr-8 py-2"
                      : "text-xs pl-14 pr-8 py-2"
                  } ${isMobileView ? "mobile-date-input" : ""}`}
                  onClick={(e) => isMobileView && e.currentTarget.showPicker()}
                  onTouchEnd={(e) =>
                    isMobileView && e.currentTarget.showPicker()
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <motion.button
              onClick={clearFilters}
              className={`flex-1 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center ${
                isMobileView ? "text-xs" : "text-xs"
              }`}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              <X size={isMobileView ? 14 : 14} className="mr-1.5" />
              Clear
            </motion.button>
            <motion.button
              onClick={applyFilters}
              className={`flex-1 px-3 py-2 bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} hover:opacity-90 text-white font-medium rounded-xl transition-all duration-300 shadow-md flex items-center justify-center ${
                isMobileView ? "text-xs" : "text-xs"
              }`}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar size={isMobileView ? 14 : 14} className="mr-1.5" />
              Apply
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return isOpen ? createPortal(popupContent, document.body) : null;
};

export default DateRangeFilter;
