import React, { useState, useEffect, useRef } from "react";
import AnimatedModal from "../animations/BlurPopup";
import { Account } from "../../interfaces/Account";
import { CategoryType, CurrencyType } from "../../interfaces/enums";
import { CustomCategory } from "../../interfaces/CustomCategory";
import { getAllSystemCategories } from "../../services/categoriesService";
import { createPortal } from "react-dom";

interface CreateTransactionPopupProps {
  onClose: () => void;
  isOpen: boolean;
  accounts: Account[];
  accountsLoading: boolean;
}

const CreateTransactionPopup: React.FC<CreateTransactionPopupProps> = ({
  onClose,
  isOpen,
  accounts,
  accountsLoading,
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    selectedAccount: string;
    selectedCategory: string;
    amount: number;
    currency: CurrencyType;
  }>({
    name: "",
    description: "",
    selectedAccount: "",
    selectedCategory: "",
    amount: 0,
    currency: CurrencyType.RON,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [accountInput, setAccountInput] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CustomCategory | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const accountInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Handle clicks outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // For category dropdown
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node) &&
        showCategoryDropdown
      ) {
        setShowCategoryDropdown(false);
      }

      // For account dropdown
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node) &&
        showAccountDropdown
      ) {
        setShowAccountDropdown(false);
      }
    };

    // Add event listener for mousedown
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCategoryDropdown, showAccountDropdown]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const categoryData = await getAllSystemCategories();
      setCategories(categoryData);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCategoryInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCategoryInput(value);
    setSelectedCategory(null);
    setShowCategoryDropdown(true);
    setFormData((prev) => ({ ...prev, selectedCategory: "" }));
  };

  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountInput(value);
    setSelectedAccount(null);
    setShowAccountDropdown(true);
    setFormData((prev) => ({ ...prev, selectedAccount: "" }));
  };

  const selectCategory = (category: CustomCategory) => {
    setSelectedCategory(category);
    setFormData((prev) => ({
      ...prev,
      selectedCategory: String(category.id),
    }));
    setCategoryInput("");
    setShowCategoryDropdown(false);
  };

  const selectAccount = (account: Account) => {
    setSelectedAccount(account);
    setFormData((prev) => ({
      ...prev,
      selectedAccount: String(account.id),
    }));
    setAccountInput("");
    setShowAccountDropdown(false);
  };

  const clearCategorySelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCategory(null);
    setCategoryInput("");
    setFormData((prev) => ({ ...prev, selectedCategory: "" }));
  };

  const clearAccountSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAccount(null);
    setAccountInput("");
    setFormData((prev) => ({ ...prev, selectedAccount: "" }));
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(accountInput.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    onClose();
  };

  // Calculate dropdown positions
  const getCategoryDropdownStyle = () => {
    if (!categoryInputRef.current) return {};

    const rect = categoryInputRef.current.getBoundingClientRect();
    return {
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
    };
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdropClick={true}
      backdropBlur="sm"
      animationDuration={300}
    >
      <div className="bg-white rounded-lg shadow-xl p-5" ref={modalRef}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Add an Expense
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Expense Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                placeholder="Enter expense name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-black mb-1"
              >
                Amount*
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="amount"
                  name="amount"
                  value={
                    formData.amount === 0 ? "" : formData.amount.toString()
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    const regex = /^[0-9]*([.,][0-9]*)?$/;
                    if (value === "" || regex.test(value)) {
                      setFormData((prev) => ({
                        ...prev,
                        amount:
                          value === ""
                            ? 0
                            : parseFloat(value.replace(",", ".")),
                      }));
                    }
                  }}
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="0.00"
                  autoComplete="off"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-gray-500">{formData.currency}</span>
                </div>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="flexitems-center">
              <label
                htmlFor="categoryInput"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category*
              </label>
              {categoriesLoading ? (
                <div className="animate-pulse h-10 bg-gray-200 rounded-md"></div>
              ) : categories.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                  No categories available.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-grow" ref={categoryRef}>
                    <div
                      className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-black focus-within:border-black h-[42px]"
                      onClick={() =>
                        setShowCategoryDropdown(!showCategoryDropdown)
                      }
                    >
                      <div className="px-3 text-gray-400">
                        <svg
                          className="h-5 w-5"
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

                      <div className="flex-grow">
                        {selectedCategory ? (
                          <input
                            ref={categoryInputRef}
                            type="text"
                            className="w-full py-2 px-0 bg-transparent outline-none text-gray-900 font-semibold"
                            value={selectedCategory.name}
                            readOnly
                            onClick={() => setShowCategoryDropdown(true)}
                          />
                        ) : (
                          <input
                            ref={categoryInputRef}
                            type="text"
                            value={categoryInput}
                            onChange={handleCategoryInputChange}
                            className="w-full py-2 px-0 bg-transparent outline-none text-gray-900"
                            placeholder="Type to search categories"
                            onClick={() => {
                              setShowCategoryDropdown(true);
                            }}
                          />
                        )}
                      </div>

                      {(categoryInput || selectedCategory) && (
                        <button
                          type="button"
                          className="px-3 text-gray-400 hover:text-gray-600"
                          onClick={clearCategorySelection}
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
                      )}

                      <div className="px-2 text-gray-400">
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            showCategoryDropdown ? "transform rotate-180" : ""
                          }`}
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

                    {showCategoryDropdown && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-28 overflow-y-auto">
                        {filteredCategories.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">
                            No matching categories
                          </div>
                        ) : (
                          filteredCategories.map((category) => (
                            <div
                              key={category.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                                selectedCategory?.id === category.id
                                  ? "bg-gray-100"
                                  : ""
                              }`}
                              onClick={() => selectCategory(category)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {category.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {category.type === CategoryType.SYSTEM
                                    ? "(System)"
                                    : "(Custom)"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Plus button */}
                  <div className="sm:self-center">
                    {" "}
                    <button
                      type="button"
                      className="h-[42px] w-full sm:w-10 flex items-center justify-center text-white bg-black hover:bg-gray-200 hover:text-slate-600 rounded-lg border border-black shadow-md transition-colors duration-100"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        console.log("Create new category clicked");
                      }}
                      title="Create new category"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 5v14m7-7H5"
                        />
                      </svg>
                      <span className="sm:hidden ml-2">Add Category</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Account Dropdown */}
            <div>
              <label
                htmlFor="accountInput"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Account*
              </label>
              {accountsLoading ? (
                <div className="animate-pulse h-10 bg-gray-200 rounded-md"></div>
              ) : accounts.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                  No default accounts available. Please create an account first.
                </div>
              ) : (
                <div className="relative" ref={accountRef}>
                  <div
                    className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-black focus-within:border-black"
                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  >
                    <div className="px-3 text-gray-400">
                      <svg
                        className="h-5 w-5"
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

                    <div className="flex-grow">
                      {selectedAccount ? (
                        <input
                          ref={accountInputRef}
                          type="text"
                          className="w-full py-2 px-0 bg-transparent outline-none text-gray-900 font-semibold"
                          value={[
                            selectedAccount.name +
                              " (" +
                              selectedAccount.amount.toFixed(2) +
                              " " +
                              selectedAccount.currency +
                              ")",
                          ]}
                          readOnly
                          onClick={() => setShowAccountDropdown(true)}
                        />
                      ) : (
                        <input
                          ref={accountInputRef}
                          type="text"
                          value={accountInput}
                          onChange={handleAccountInputChange}
                          className="w-full py-2 px-0 bg-transparent outline-none text-gray-900"
                          placeholder="Type to search accounts"
                          onClick={() => {
                            setShowAccountDropdown(true);
                          }}
                        />
                      )}
                    </div>

                    {(accountInput || selectedAccount) && (
                      <button
                        type="button"
                        className="px-3 text-gray-400 hover:text-gray-600"
                        onClick={clearAccountSelection}
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
                    )}

                    <div className="px-2 text-gray-400">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${showAccountDropdown ? "transform rotate-180" : ""}`}
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

                  {showAccountDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-28 overflow-auto">
                      {filteredAccounts.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          No matching accounts
                        </div>
                      ) : (
                        filteredAccounts.map((account) => (
                          <div className="max-h-60 ">
                            <div
                              key={account.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                                selectedAccount?.id === account.id
                                  ? "bg-gray-100"
                                  : ""
                              }`}
                              onClick={() => selectAccount(account)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {account.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {account.amount !== undefined
                                    ? `${account.amount.toFixed(2)} ${account.currency}`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                placeholder="Add details about this expense"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-black bg-white hover:bg-gray-100 focus:outline-none focus:border-black focus:ring-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:border-white focus:ring-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                  </>
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AnimatedModal>
  );
};

export default CreateTransactionPopup;
