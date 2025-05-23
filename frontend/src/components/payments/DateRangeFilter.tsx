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
  isSmallScreen,
  isOpen,
  setIsOpen,
  buttonRef,
  colors = { gradientFrom: "from-green-600", gradientTo: "to-green-500" },
}) => {
  const [tempStartDate, setTempStartDate] = useState<string>(
    dateRange.start ? dateRange.start.toISOString().split("T")[0] : ""
  );
  const [tempEndDate, setTempEndDate] = useState<string>(
    dateRange.end ? dateRange.end.toISOString().split("T")[0] : ""
  );
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        const windowWidth = window.innerWidth;
        const popupWidth = isSmallScreen ? 320 : 320; 
        
        let left;
        if (isSmallScreen) {
          
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
  }, [isOpen, buttonRef, isSmallScreen]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempEndDate(e.target.value);
  };

  const applyFilters = () => {
    setDateRange({
      start: tempStartDate ? new Date(tempStartDate) : null,
      end: tempEndDate ? new Date(tempEndDate) : null,
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
    if (isSmallScreen) {
      const inputs = document.querySelectorAll('input[type="date"]');
      if (inputs[index]) {
        (inputs[index] as HTMLInputElement).showPicker();
      }
    }
  };

  const popupContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 10 }}
      exit={{ opacity: 0, y: 10 }}
      className={`fixed z-20 bg-white rounded-lg shadow-lg date-filter-popup ${
        isOpen ? "block" : "hidden"
      } ${isSmallScreen ? "w-80 mx-auto" : "w-80"}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div
        className={`bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} px-3 py-2 rounded-t-lg flex justify-between items-center sticky top-0 z-10`}
      >
        <h3 className="text-sm font-medium text-white flex items-center">
          <Calendar size={isSmallScreen ? 18 : 14} className="mr-1.5" />
          Date Filter
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
        >
          <X size={isSmallScreen ? 18 : 14} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
            <Calendar
              size={isSmallScreen ? 16 : 14}
              className="mr-1.5 text-gray-500"
            />
            Select Date Range
          </label>
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">From:</span>
              </div>
              <input
                type="date"
                value={tempStartDate}
                onChange={handleStartDateChange}
                className={`bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-md focus:ring-green-500 focus:border-green-500 block w-full pl-14 pr-8 py-2 shadow-sm ${
                  isSmallScreen ? "mobile-date-input" : ""
                }`}
                onClick={(e) => isSmallScreen && e.currentTarget.showPicker()}
                onTouchEnd={(e) =>
                  isSmallScreen && e.currentTarget.showPicker()
                }
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <Calendar
                  className="h-4 w-4 text-gray-400"
                  onClick={() => handleMobilePicker(0)}
                />
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">To:</span>
              </div>
              <input
                type="date"
                value={tempEndDate}
                onChange={handleEndDateChange}
                className={`bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-md focus:ring-green-500 focus:border-green-500 block w-full pl-14 pr-8 py-2 shadow-sm ${
                  isSmallScreen ? "mobile-date-input" : ""
                }`}
                onClick={(e) => isSmallScreen && e.currentTarget.showPicker()}
                onTouchEnd={(e) =>
                  isSmallScreen && e.currentTarget.showPicker()
                }
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <Calendar
                  className="h-4 w-4 text-gray-400"
                  onClick={() => handleMobilePicker(1)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center space-x-2">
          <button
            onClick={clearFilters}
            className="flex-1 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-md transition-colors duration-300 shadow-sm flex items-center justify-center"
          >
            <X size={isSmallScreen ? 16 : 14} className="mr-1.5" />
            Clear
          </button>
          <button
            onClick={applyFilters}
            className={`flex-1 px-3 py-2 bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} hover:opacity-90 text-white text-xs font-medium rounded-md transition-all duration-300 shadow-sm flex items-center justify-center`}
          >
            <Calendar size={isSmallScreen ? 16 : 14} className="mr-1.5" />
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );

  return isOpen ? createPortal(popupContent, document.body) : null;
};

export default DateRangeFilter;