import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { CurrencyType } from "../../interfaces/enums";
import { createUserBudgetWithCategories } from "../../services/budgetService";
import AnimatedModal from "../animations/BlurPopup";

interface CreateNewBudgetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CustomCategory[];
  onSuccess?: () => void;
}

interface SelectedCategory {
  id: number;
  name: string;
}

const CreateNewBudget: React.FC<CreateNewBudgetProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [limitAmountString, setLimitAmountString] = useState("");
  const [currency, setCurrency] = useState<CurrencyType>(CurrencyType.RON);
  const [selectedCategories, setSelectedCategories] = useState<
    SelectedCategory[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const resetForm = () => {
    setName("");
    setLimitAmount("");
    setLimitAmountString("");
    setCurrency(CurrencyType.RON);
    setSelectedCategories([]);
    setSearchTerm("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredCategories = useMemo(() => {
    const selectedIds = selectedCategories.map((cat) => cat.id);

    if (!searchTerm.trim()) {
      return categories
        .filter((cat) => !selectedIds.includes(cat.id))
        .slice(0, 10);
    }

    return categories
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !selectedIds.includes(cat.id)
      )
      .slice(0, 5);
  }, [searchTerm, categories, selectedCategories]);

  const handleAddCategory = (category: CustomCategory) => {
    setSelectedCategories([
      ...selectedCategories,
      {
        id: category.id,
        name: category.name,
      },
    ]);
    setSearchTerm("");
    setIsSearchOpen(false);
  };

  const handleRemoveCategory = (id: number) => {
    setSelectedCategories(selectedCategories.filter((cat) => cat.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log("create budget pressed");

    if (!user) {
      setError("User not found");
      setLoading(false);
      return;
    }

    try {
      if (!name.trim()) {
        throw new Error("Budget name is required");
      }

      if (
        !limitAmount ||
        isNaN(Number(limitAmount)) ||
        Number(limitAmount) <= 0
      ) {
        throw new Error("Please enter a valid budget limit");
      }

      if (selectedCategories.length === 0) {
        throw new Error("At least one category is required");
      }

      console.log({
        name,
        limitAmount: Number(limitAmount),
        currency,
        categories: selectedCategories,
        userId: user?.id,
      });

      await createUserBudgetWithCategories(
        user.id,
        name,
        Number(limitAmount),
        currency,
        selectedCategories.map((cat) => cat.id)
      );

      resetForm();
      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSearchOpen) {
      const searchInput = document.getElementById("category-search");
      if (searchInput) {
        searchInput.focus();
      }
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById("category-dropdown");
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnBackdropClick={true}
      backdropBlur="md"
      animationDuration={150}
    >
      <div
        className={`bg-white rounded-2xl shadow-lg w-full mx-auto flex flex-col ${isSmallScreen ? "max-w-full min-w-0 p-0" : "max-w-md min-w-[400px]"}`}
       
      >
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-5 py-5 relative rounded-t-xl flex-shrink-0">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20px 20px, white 3px, transparent 4px)",
                backgroundSize: "25px 25px",
              }}
            ></div>
          </div>

          <div className="relative flex items-center">
            <div className="mr-3 p-2.5 rounded-full bg-indigo-400 shadow-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Create New Budget</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-gray-500 uppercase mb-1"
              >
                Budget Name*
              </label>
              <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                <div className="p-2 bg-gray-50 m-1.5 rounded-md">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2.5 px-2 bg-transparent outline-none text-gray-800"
                  placeholder="Monthly Expenses"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="limitAmount"
                className="block text-xs font-semibold text-gray-500 uppercase mb-1"
              >
                Budget Limit*
              </label>
              <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                <div className="p-2 bg-gray-50 m-1.5 rounded-md">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="limitAmount"
                  value={limitAmountString}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "" || /^[0-9]*([.,][0-9]*)?$/.test(value)) {
                      setLimitAmountString(value);

                      if (value === "") {
                        setLimitAmount("");
                      } else {
                        const numericValue = parseFloat(
                          value.replace(",", ".")
                        );

                        if (!isNaN(numericValue)) {
                          setLimitAmount(String(numericValue));
                        }
                      }
                    }
                  }}
                  className="w-full py-2.5 px-2 bg-transparent outline-none text-gray-800"
                  placeholder="1000"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="currency"
                className="block text-xs font-semibold text-gray-500 uppercase mb-1"
              >
                Currency*
              </label>
              <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                <div className="p-2 bg-gray-50 m-1.5 rounded-md">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                  className="w-full py-2.5 px-2 bg-transparent outline-none text-gray-800 appearance-none"
                  required
                >
                  {Object.values(CurrencyType).map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
                <div className="px-2 text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">
                  Budget Categories*
                </label>
                {selectedCategories.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {selectedCategories.length} selected
                  </span>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="relative mb-3" id="category-dropdown">
                  <div
                    className="flex items-center border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <div className="p-2 bg-gray-50 m-1.5 rounded-md">
                      <svg
                        className="h-5 w-5 text-gray-500"
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
                    </div>
                    <input
                      type="text"
                      id="category-search"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isSearchOpen) setIsSearchOpen(true);
                      }}
                      className="w-full py-2.5 px-2 bg-transparent outline-none text-gray-800"
                      placeholder="Search for categories..."
                    />
                  </div>

                  {isSearchOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-32 overflow-auto">
                      {filteredCategories.length > 0 ? (
                        <ul>
                          {filteredCategories.map((category) => (
                            <li
                              key={category.id}
                              className="px-4 py-2 cursor-pointer hover:bg-indigo-50 flex items-center"
                              onClick={() => handleAddCategory(category)}
                            >
                              <span className="flex-1">{category.name}</span>
                              <button
                                type="button"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No categories available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedCategories.length === 0 ? (
                  <p className="text-gray-500 text-xs italic">Search and select</p>
                ) : (
                  <div className="relative">
                    <div className="space-y-2">
                      {selectedCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="mr-2 p-1.5 bg-indigo-50 rounded-md text-indigo-500">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                          </div>
                          <span
                            className={`flex-grow text-sm text-gray-800 ${isSmallScreen ? "text-xs" : "text-sm"}`}
                          >
                            {category.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(category.id)}
                            className="ml-2 text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors duration-200"
                          >
                            <svg
                              className="w-4 h-4"
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCategories.length === 0 && (
                  <p className="text-amber-600 text-xs mt-2 flex items-center">
                    <svg
                      className="w-3.5 h-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    At least one category is required
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        <div
          className={`flex ${isSmallScreen ? "flex-col space-y-2" : "justify-end space-x-3"} p-4 bg-white flex-shrink-0`}
        >
          <button
            type="button"
            onClick={handleClose}
            className={`${isSmallScreen ? "w-full" : "px-4"} py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium focus:outline-none shadow-sm hover:bg-gray-50`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className={`${isSmallScreen ? "w-full" : "px-5"} py-2 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-full text-sm font-medium focus:outline-none shadow-sm hover:from-indigo-600 hover:to-indigo-800 disabled:opacity-50 transform transition-transform hover:scale-105 duration-200`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </span>
            ) : (
              "Create Budget ✨"
            )}
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default CreateNewBudget;
