import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { createSavingAccount } from "../../services/accountService";
import { CurrencyType, AccountType } from "../../interfaces/enums";
import AnimatedModal from "../animations/BlurPopup";

interface CreateSavingAccountPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSavingAccountPopup: React.FC<CreateSavingAccountPopupProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    currency: CurrencyType.EUR,
    accountType: AccountType.SAVINGS,
    targetAmount: "",
    targetDate: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error creating saving account:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasFormChanged =
      formData.name.trim() !== "" &&
      formData.targetAmount.toString().trim() !== "" &&
      formData.targetDate.trim() !== "";

    setHasChanges(hasFormChanged);
  }, [formData]);

  return (
    <AnimatedModal
      isOpen={isOpen && !isClosing}
      onClose={handleClose}
      closeOnBackdropClick={true}
      backdropBlur="sm"
      animationDuration={150}
    >
      <div className="bg-white rounded-lg shadow-xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-indigo-50 w-10 h-10 rounded-full flex items-center justify-center mr-3">
              <svg
                className="w-5 h-5 text-indigo-600"
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
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create Savings Goal
              </h2>
              <p className="text-indigo-600 mt-1">Set up a new savings goal</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            <div className="flex">
              <svg
                className="h-5 w-5 mr-2 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Account Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label
              htmlFor="targetAmount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Amount<span className="text-red-500">*</span>
            </label>
            <div className="flex border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent transition-all">
              <input
                type="number"
                id="targetAmount"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="flex-1 px-4 py-3 focus:outline-none rounded-l-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="px-3 py-3 bg-indigo-50 text-indigo-700 focus:outline-none rounded-r-lg"
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

          {/* Target Date */}
          <div>
            <label
              htmlFor="targetDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Date<span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading || !hasChanges}
            >
              {loading ? (
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
                "Create Goal"
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </AnimatedModal>
  );
};

export default CreateSavingAccountPopup;
