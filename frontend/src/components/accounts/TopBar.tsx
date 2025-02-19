import React, { useState } from "react";
import { Search, Plus } from "lucide-react";

interface TopBarProps {
  title: string;
  pageType?: "dashboard" | "accounts" | "settings" | "transactions" | string; // Add more page types as needed
  searchPlaceholder?: string;
  buttonText?: string;
  onSearch?: (value: string) => void;
  onButtonClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  title,
  pageType,
  searchPlaceholder,
  buttonText,
  onSearch,
  onButtonClick,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className="w-full bg-black h-16">
      <div className="flex items-center justify-between max-w-7xl mx-auto h-full px-6">
        {/* Conditional rendering based on pageType */}
        {pageType === "dashboard" ? (
          // For Dashboard - Only the title centered
          <h1 className="text-2xl font-semibold text-white flex-1 text-center">
            {title}
          </h1>
        ) : pageType === "accounts" ? (
          // For Accounts - Title, Search Bar, and Button
          <div className="flex items-center justify-evenly w-full max-w-7xl mx-auto h-full px-6">
            {/* Left side - Title */}
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            {/* Middle - Search Bar */}
            {searchPlaceholder && onSearch && (
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  placeholder={searchPlaceholder}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2 border border-white rounded-lg bg-black text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-white focus:outline-none text-sm"
                />
              </div>
            )}
            {/* Right side - Button */}
            {buttonText && onButtonClick && (
              <button
                onClick={onButtonClick}
                className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-200 text-black font-medium rounded-lg text-sm transition-colors"
              >
                <Plus className="h-5 w-5 mr-1" />
                {buttonText}
              </button>
            )}
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