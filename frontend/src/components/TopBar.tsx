import React, { useState } from "react";
import { Search, Plus } from "lucide-react";

interface TopBarProps {
  title: string;
  pageType?: "dashboard" | "payments" | "settings" | "transactions" | string; // Add more page types as needed
  searchPlaceholder?: string;
  buttonText?: string;
  onSearch?: (value: string) => void;
  onButtonClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  title,
  pageType,

  buttonText,

  onButtonClick,
}) => {
  return (
    <div className="w-full bg-black h-16">
      <div className="flex items-center justify-between max-w-7xl mx-auto h-full px-6">
        {/* Conditional rendering based on pageType */}
        {pageType === "dashboard" ? (
          // For Dashboard - Only the title centered
          <h1 className="text-2xl font-semibold text-white flex-1 text-center">
            {title}
          </h1>
        ) : pageType === "payments" ? (
          // For Accounts - Title, Search Bar, and Button
          <div className="flex items-center justify-evenly w-full max-w-7xl mx-auto h-full px-6">
            {/* Left side - Title */}
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
          </div>
        ) : pageType === "transactions" ? (
          // For Transactions - Title and Button, no search bar
          <>
            <h1 className="text-2xl font-semibold text-white flex-1">
              {title}
            </h1>
            {buttonText && onButtonClick && (
              <button
                onClick={onButtonClick}
                className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-200 text-black font-medium rounded-lg text-sm transition-colors"
              >
                <Plus className="h-5 w-5 mr-1" />
                {buttonText}
              </button>
            )}
          </>
        ) : pageType === "settings" ? (
          // For Settings - Title only
          <h1 className="text-2xl font-semibold text-white flex-1 text-center">
            {title}
          </h1>
        ) : (
          // For any other case - Default structure
          <>
            <h1 className="text-2xl font-semibold text-white flex-1">
              {title}
            </h1>
          </>
        )}
      </div>
    </div>
  );
};

export default TopBar;
