import React from "react";
import { motion } from "framer-motion";
import { Calendar, DollarSign, Search, Tag, X } from "lucide-react";

interface EmptySearchResultsProps {
  searchQuery: string;
  activeTab: string;
  onClearSearch: () => void;
  dateRange?: { start: Date | null; end: Date | null };
  amountRange?: { min: number | null; max: number | null };
  clearDateRange?: () => void;
  clearAmountRange?: () => void;
}

const EmptySearchResults: React.FC<EmptySearchResultsProps> = ({
  searchQuery,
  activeTab,
  onClearSearch,
  dateRange,
  amountRange,
  clearDateRange,
  clearAmountRange
}) => {
  // Dynamic styling based on the active tab
  let iconColor, bgColor, btnColor, btnHoverColor, borderColor, badgeBg, badgeText;
  
  if (activeTab === "income") {
    iconColor = "text-green-500";
    bgColor = "bg-green-50";
    btnColor = "bg-green-100";
    btnHoverColor = "hover:bg-green-200";
    borderColor = "border-green-200";
    badgeBg = "bg-green-100";
    badgeText = "text-green-700";
  } else if (activeTab === "expenses") {
    iconColor = "text-red-500";
    bgColor = "bg-red-50";
    btnColor = "bg-red-100";
    btnHoverColor = "hover:bg-red-200";
    borderColor = "border-red-200";
    badgeBg = "bg-red-100";
    badgeText = "text-red-700";
  } else {
    iconColor = "text-blue-500";
    bgColor = "bg-blue-50";
    btnColor = "bg-blue-100";
    btnHoverColor = "hover:bg-blue-200";
    borderColor = "border-blue-200";
    badgeBg = "bg-blue-100";
    badgeText = "text-blue-700";
  }

  // Check if any filters are applied
  const hasDateFilter = dateRange && (dateRange.start || dateRange.end);
  const hasAmountFilter = amountRange && (amountRange.min !== null || amountRange.max !== null);
  const hasAnyFilter = hasDateFilter || hasAmountFilter || searchQuery;
  
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
      
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-10 md:py-12 text-center"
    >
      <div className={`p-4 rounded-full ${bgColor} mb-5 shadow-sm`}>
        <svg 
          className={`w-8 h-8 md:w-10 md:h-10 ${iconColor}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
      
      <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No matching transactions found</h3>
      <p className="text-gray-500 max-w-md mb-6">
        We couldn't find any {activeTab.slice(0, -1)} transactions that match your current filters.
      </p>
      
      {/* Active filters summary */}
      {hasAnyFilter && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className={`${bgColor} px-4 py-3 border-b ${borderColor} flex items-center justify-between`}>
            <h4 className={`text-sm font-medium ${iconColor} flex items-center`}>
              <svg 
                className={`w-4 h-4 mr-2 ${iconColor}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
                />
              </svg>
              Active Filters
            </h4>
          </div>
          
          <div className="p-4 space-y-3">          
            {/* Search query filter */}
            {searchQuery && (
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="p-1 rounded-full bg-gray-100 mr-2 flex-shrink-0">
                    <Search className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Search: </span>
                    <span className="text-gray-500">"{searchQuery}"</span>
                  </div>
                </div>
                <button 
                  onClick={onClearSearch}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            {/* Date range filter */}
            {hasDateFilter && clearDateRange && (
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="p-1 rounded-full bg-gray-100 mr-2 flex-shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Date: </span>
                    <span className="text-gray-500">
                      {dateRange?.start ? formatDate(dateRange.start) : "Any"} - {dateRange?.end ? formatDate(dateRange.end) : "Any"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={clearDateRange}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            {/* Amount range filter */}
            {hasAmountFilter && clearAmountRange && (
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="p-1 rounded-full bg-gray-100 mr-2 flex-shrink-0">
                    <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Amount: </span>
                    <span className="text-gray-500">
                      {amountRange?.min !== null ? `$${amountRange.min}` : "Any"} - {amountRange?.max !== null ? `$${amountRange.max}` : "Any"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={clearAmountRange}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            {/* Tips section */}
            <div className="pt-3 mt-3 border-t border-gray-100">
              <h5 className="text-xs font-medium text-gray-700 mb-2">Search Tips:</h5>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li className="flex items-start">
                  <svg className="h-3.5 w-3.5 text-gray-500 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Try searching by account name (e.g., "Monthly Accommodation")
                </li>
                <li className="flex items-start">
                  <svg className="h-3.5 w-3.5 text-gray-500 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Try different date ranges or broaden your amount filter
                </li>
                <li className="flex items-start">
                  <svg className="h-3.5 w-3.5 text-gray-500 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Search for partial text in transaction descriptions
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Clear filters button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          onClearSearch();
          clearDateRange && clearDateRange();
          clearAmountRange && clearAmountRange();
        }}
        className={`px-5 py-2.5 rounded-full text-gray-700 ${btnColor} ${btnHoverColor} font-medium text-sm focus:outline-none transition-all duration-300 flex items-center shadow-sm`}
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear All Filters
      </motion.button>
    </motion.div>
  );
};

export default EmptySearchResults;