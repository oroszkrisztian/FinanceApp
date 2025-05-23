import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

interface SearchWithSuggestionsProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  suggestions?: string[];
  containerClassName?: string;
  variant?: "default" | "outgoing" | "incoming";
}

const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  placeholder = "Search...",
  onSearch,
  suggestions = [],
  containerClassName = "",
  variant = "default",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const getVariantStyles = () => {
    switch (variant) {
      case "outgoing":
        return {
          inputBg: "bg-red-50 focus:ring-red-500",
          buttonBg: "bg-red-600 hover:bg-red-700",
          highlightBg: "bg-red-100 text-red-800",
          hoverBg: "hover:bg-red-50",
        };
      case "incoming":
        return {
          inputBg: "bg-green-50 focus:ring-green-500",
          buttonBg: "bg-green-600 hover:bg-green-700",
          highlightBg: "bg-green-100 text-green-800",
          hoverBg: "hover:bg-green-50",
        };
      default:
        return {
          inputBg: "bg-gray-50 focus:ring-blue-500",
          buttonBg: "bg-blue-600 hover:bg-blue-700",
          highlightBg: "bg-blue-100 text-blue-800",
          hoverBg: "hover:bg-gray-50",
        };
    }
  };

  const styles = getVariantStyles();

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSuggestions(suggestions);
    } else {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }
  }, [searchTerm, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);

    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm("");
    onSearch("");
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    setFilteredSuggestions(suggestions);
    setShowSuggestions(true);
  };

  return (
    <div ref={searchRef} className={`relative ${containerClassName}`}>
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>

        <input
          type="text"
          className={`block w-full pl-10 pr-10 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg ${styles.inputBg} focus:outline-none focus:ring-2`}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />

        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={clearSearch}
          >
            <X size={16} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-28 overflow-y-auto"
        >
          <ul className="py-1">
            {filteredSuggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 ${styles.hoverBg}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default SearchWithSuggestions;
