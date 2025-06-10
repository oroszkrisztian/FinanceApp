import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Plus, AlertCircle, Check } from "lucide-react";
import {
  getAllCategoriesForUser,
  createUserCategory,
} from "../../services/categoriesService";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (categoryName?: string) => void;

  userId: number;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
}) => {
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadExistingCategories();
      setCategoryName("");
      setError(null);
    }
  }, [isOpen, userId]);

  const loadExistingCategories = async () => {
    try {
      const categories = await getAllCategoriesForUser(userId);
      const categoryNames = categories.map((cat: any) =>
        cat.name.toLowerCase()
      );
      setExistingCategories(categoryNames);
    } catch (err) {
      console.error("Failed to load existing categories:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }

    if (categoryName.trim().length < 2) {
      setError("Category name must be at least 2 characters long");
      return;
    }

    if (categoryName.trim().length > 50) {
      setError("Category name must be less than 50 characters");
      return;
    }

    // Check for duplicates (case-insensitive)
    if (existingCategories.includes(categoryName.trim().toLowerCase())) {
      setError("This category already exists");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createUserCategory(userId, categoryName.trim());
      onSuccess();
      onClose();
      setCategoryName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create category"
      );
    } finally {
      setLoading(false);
    }
  };

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCategoryName(value);
    setError(null);

    if (
      value.trim() &&
      existingCategories.includes(value.trim().toLowerCase())
    ) {
      setError("This category already exists");
    }
  };

  const isValidInput =
    categoryName.trim().length >= 2 &&
    categoryName.trim().length <= 50 &&
    !existingCategories.includes(categoryName.trim().toLowerCase());

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
              isMobileView
                ? "max-w-sm w-full max-h-[95vh]"
                : "max-w-md w-full max-h-[90vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
              {/* Background decorative elements */}
              <div
                className={`absolute top-0 right-0 bg-white/20 rounded-full ${
                  isMobileView
                    ? "w-12 h-12 -translate-y-6 translate-x-6"
                    : "w-16 h-16 -translate-y-8 translate-x-8"
                }`}
              ></div>
              <div
                className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${
                  isMobileView
                    ? "w-8 h-8 translate-y-4 -translate-x-4"
                    : "w-12 h-12 translate-y-6 -translate-x-6"
                }`}
              ></div>
              <div
                className={`absolute bg-white/15 rounded-full ${
                  isMobileView
                    ? "top-2 left-16 w-6 h-6"
                    : "top-2 left-16 w-8 h-8"
                }`}
              ></div>
              <div
                className={`absolute bg-white/10 rounded-full ${
                  isMobileView
                    ? "bottom-2 right-12 w-4 h-4"
                    : "bottom-2 right-12 w-6 h-6"
                }`}
              ></div>

              <div className={`relative z-10 ${isMobileView ? "p-3" : "p-4"}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`bg-white rounded-full shadow-lg ${
                        isMobileView ? "p-1.5" : "p-2"
                      } text-blue-600`}
                    >
                      <Tag size={isMobileView ? 16 : 18} />
                    </div>
                    <div>
                      <h2
                        className={`font-bold text-white ${
                          isMobileView ? "text-lg" : "text-xl"
                        }`}
                      >
                        Create Category
                      </h2>
                      <p
                        className={`opacity-90 text-white ${
                          isMobileView ? "text-sm" : "text-sm"
                        }`}
                      >
                        Add a new expense category
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={isMobileView ? 20 : 24} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Content */}
            <form
              onSubmit={handleSubmit}
              className={`${isMobileView ? "p-4" : "p-6"}`}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={categoryName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-colors shadow-sm ${
                        error
                          ? "border-red-300 focus:ring-red-500 bg-red-50"
                          : isValidInput && categoryName.trim()
                            ? "border-green-300 focus:ring-green-500 bg-green-50"
                            : "border-gray-300 focus:ring-blue-500 bg-gray-50"
                      }`}
                      placeholder="e.g., Groceries, Entertainment, Utilities"
                      maxLength={50}
                      disabled={loading}
                    />
                    {isValidInput && categoryName.trim() && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <Check size={16} className="text-green-500" />
                      </div>
                    )}
                  </div>

                  {/* Character count */}
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {categoryName.length}/50 characters
                    </span>
                    {categoryName.trim() && !error && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Available
                      </span>
                    )}
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2 shadow-sm"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}

                {/* Category Guidelines */}
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    💡 Category Tips
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Use clear, descriptive names</li>
                    <li>• Categories help organize your expenses</li>
                    <li>• You can always create more categories later</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={!isValidInput || loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  whileHover={{ scale: !isValidInput || loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {loading ? "Creating..." : "Create Category"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateCategoryModal;
