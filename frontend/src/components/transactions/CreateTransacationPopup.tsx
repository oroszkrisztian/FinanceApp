import React, { useState } from "react";
import AnimatedModal from "../animations/BlurPopup";
import { Account } from "../../interfaces/Account";

import { CurrencyType } from "../../interfaces/enums";

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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedAccount: "",
    amount: 0,
    currency: CurrencyType.RON,
  });
  const [isLoading, setIsLoading] = useState(false);
  

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form submitted:", formData);

    onClose();
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdropClick={true}
      backdropBlur="sm"
      animationDuration={300}
    >
      <div className="bg-white rounded-lg shadow-xl p-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Add an Expense
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Transaction Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Exense Name*
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

            {/* Description */}
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

            <div>
              <label
                htmlFor="targetAmount"
                className="block text-sm font-medium text-black mb-1"
              >
                Amount*
              </label>
              <div className="flex border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-transparent ">
                <input
                  type="text"
                  id="targetAmount"
                  name="targetAmount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 focus:outline-none rounded-l-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="px-3 py-3 bg-gray-50 text-gray-700 focus:outline-none rounded-r-lg"
                  required
                >
                  {Object.values(CurrencyType).map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Selection */}

            {/* Account Selection */}
            <div>
              <label
                htmlFor="selectedAccount"
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
                <select
                  id="selectedAccount"
                  name="selectedAccount"
                  value={formData.selectedAccount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  required
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}{" "}
                      {account.amount !== undefined
                        ? `(${account.amount.toFixed(2)})`
                        : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-black bg-white hover:bg-gray-100 focus:outline-none focus:border-black focus:ring-0 "
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