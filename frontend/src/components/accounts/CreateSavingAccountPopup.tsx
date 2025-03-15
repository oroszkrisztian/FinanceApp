import React, { useState } from "react";
import { motion } from "framer-motion";
import { AccountType, CurrencyType } from "../../interfaces/enums";
import { useAuth } from "../../context/AuthContext";
import { createSavingAccount } from "../../services/accountService";
import ErrorState from "../ErrorState";

interface CreateSavingAccountPopupProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: () => void;
}

const CreateSavingAccountPopup = ({
  setIsModalOpen,
  onSuccess,
}: CreateSavingAccountPopupProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    accountType: AccountType.SAVINGS,
    currency: CurrencyType.RON,
    targetAmount: 0,
    startDate: new Date().toISOString().split("T")[0],
    targetDate: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    let processedValue = value;

    if (name === "targetAmount") {
      processedValue = value.replace(/,/g, ".");

      if (isNaN(Number(processedValue))) {
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error("User not found. Please log in again.");
      }

      const data = await createSavingAccount(
        user.id,
        formData.accountType,
        formData.currency,
        formData.name,
        formData.description,
        Number(formData.targetAmount),
        new Date(formData.targetDate)
      );
      console.log("Saving created successfully:", data);
      setIsLoading(false);
      onSuccess();
      setIsModalOpen(false);
    } catch (err) {
      setIsLoading(false);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error creating saving account:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeInOut" } }}
      onClick={handleClickOutside}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative overflow-hidden border border-gray-200"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{
          scale: 0.9,
          opacity: 0,
          transition: { duration: 0.2, ease: "easeInOut" },
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-black mb-6">
          Create New Saving Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-black mb-1"
            >
              Account Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
              placeholder="Ex:Bike"
            />
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-black mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* Target Amount with Currency Dropdown */}
          <div>
            <label
              htmlFor="targetAmount"
              className="block text-sm font-medium text-black mb-1"
            >
              Target Amount
            </label>
            <div className="flex border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-all">
              <input
                type="text"
                id="targetAmount"
                name="targetAmount"
                value={formData.targetAmount}
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

          {/* Target Date Field */}
          <div>
            <label
              htmlFor="targetDate"
              className="block text-sm font-medium text-black mb-1"
            >
              Target Date (Optional)
            </label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-black bg-white hover:bg-gray-100 focus:outline-none focus:border-black focus:ring-0 transition-all duration-200"
              disabled={isLoading}
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
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateSavingAccountPopup;
