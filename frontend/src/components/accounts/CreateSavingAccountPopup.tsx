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
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
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
    // Calculate progress based on required fields
    let progress = 0;
    const totalRequiredFields = 3; // name, targetAmount, targetDate
    
    if (formData.name.trim() !== "") {
      progress += 1;
    }
    
    if (formData.targetAmount.toString().trim() !== "") {
      progress += 1;
    }
    
    if (formData.targetDate.trim() !== "") {
      progress += 1;
    }
    
    // Calculate percentage
    const percentage = (progress / totalRequiredFields) * 100;
    setProgressPercentage(percentage);
    
    // Set hasChanges if all required fields are filled
    setHasChanges(percentage === 100);
  }, [formData]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AnimatedModal
      isOpen={isOpen && !isClosing}
      onClose={handleClose}
      closeOnBackdropClick={true}
      backdropBlur="md"
      animationDuration={300}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          maxWidth: isMobileScreen ? "100%" : "28rem",
          minWidth: isMobileScreen ? "auto" : "28rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
      >
        {/* Header with fixed height that won't overlap content */}
        <div className="bg-indigo-500 h-20 relative">
          {/* Decorative circles */}
          <div className="absolute top-4 left-6 bg-white/20 h-16 w-16 rounded-full"></div>
          <div className="absolute top-8 left-16 bg-white/10 h-10 w-10 rounded-full"></div>
          <div className="absolute -top-2 right-12 bg-white/10 h-12 w-12 rounded-full"></div>
          
          {/* Title is now part of the header, not overlapping */}
          <div className="absolute bottom-0 left-0 w-full px-6 pb-3 flex items-center">
            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <motion.svg
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.3 }}
                className="w-6 h-6 text-indigo-600"
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
              </motion.svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                New Goal! ✨
              </h2>
              
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Error message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"
            >
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
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">🏷️</span>
                Goal Name<span className="text-indigo-500">*</span>
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                placeholder="Vacation in Bali"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className=" text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">📝</span>
                Description (Optional)
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                placeholder="My dream vacation with family..."
              />
            </div>

            {/* Target Amount */}
            <div>
              <label
                htmlFor="targetAmount"
                className="text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">💰</span>
                Target Amount<span className="text-indigo-500">*</span>
              </label>
              <div className="flex border border-indigo-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50 overflow-hidden">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  type="number"
                  id="targetAmount"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="flex-1 px-4 py-3 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="5000"
                  required
                />
                <motion.select
                  //whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="px-3 py-3 bg-indigo-500 text-white font-medium focus:outline-none"
                  required
                >
                  {Object.values(CurrencyType).map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </motion.select>
              </div>
            </div>

            {/* Target Date */}
            <div>
              <label
                htmlFor="targetDate"
                className="text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                <span className="text-indigo-500 mr-1">🗓️</span>
                Target Date<span className="text-indigo-500">*</span>
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                type="date"
                id="targetDate"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-indigo-50/50"
                required
              />
            </div>

            {/* Dynamic Progress Bar */}
            <div className="pt-2">
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.3 }}
                  style={{ background: `linear-gradient(to right, #4f46e5 ${progressPercentage}%, #818cf8)` }}
                  className="absolute top-0 left-0 h-full"
                ></motion.div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  {progressPercentage < 100 
                    ? `${Math.round(progressPercentage)}% complete` 
                    : "Ready !"}
                </p>
                <p className="text-xs text-indigo-500 font-medium">
                  {progressPercentage === 0 && "Start filling the form"}
                  {progressPercentage > 0 && progressPercentage < 100 && "Keep going..."}
                  {progressPercentage === 100 && "All set! 🚀"}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-4 border-2 border-indigo-200 rounded-xl text-indigo-600 font-medium bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all shadow-sm"
                disabled={loading}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.2)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                type="submit"
                className="flex-1 py-3 px-4 bg-indigo-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                disabled={loading || !hasChanges}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  <>Create My Goal</>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatedModal>
  );
};

export default CreateSavingAccountPopup;