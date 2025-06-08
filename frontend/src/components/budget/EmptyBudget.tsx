import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, TrendingUp, Target } from "lucide-react";
import CreateNewBudget from "./CreateNewBudget";
import { CustomCategory } from "../../interfaces/CustomCategory";

interface EmptyBudgetProps {
  categories: CustomCategory[];
  onSuccess?: () => void;
}

const EmptyBudget: React.FC<EmptyBudgetProps> = ({ categories, onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Enhanced mobile detection
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const handleCreateBudget = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    onSuccess?.();
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div
        className={`bg-white rounded-2xl shadow-xl border border-gray-100 transform transition-all hover:shadow-2xl relative overflow-hidden ${
          isMobileView ? "max-w-sm w-full p-6" : "max-w-md w-full p-8"
        }`}
      >
        {/* Mobile-optimized background elements */}
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-indigo-300 to-purple-500 rounded-full opacity-20 ${
            isMobileView
              ? "w-16 h-16 -translate-y-8 translate-x-8"
              : "w-24 h-24 -translate-y-12 translate-x-12"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 bg-gradient-to-tr from-purple-300 to-indigo-500 rounded-full opacity-15 ${
            isMobileView
              ? "w-12 h-12 translate-y-6 -translate-x-6"
              : "w-20 h-20 translate-y-10 -translate-x-10"
          }`}
        ></div>
        <div
          className={`absolute bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 ${
            isMobileView ? "top-4 left-20 w-8 h-8" : "top-6 left-24 w-12 h-12"
          }`}
        ></div>
        <div
          className={`absolute bg-gradient-to-br from-purple-300 to-indigo-400 rounded-full opacity-10 ${
            isMobileView
              ? "bottom-4 right-16 w-6 h-6"
              : "bottom-8 right-20 w-10 h-10"
          }`}
        ></div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {/* Enhanced animated icon */}
          <motion.div
            className={`mb-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border border-indigo-200/50 backdrop-blur-sm ${
              isMobileView ? "w-20 h-20" : "w-24 h-24"
            }`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6,
            }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <motion.div
              animate={{ 
                y: [0, -3, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Wallet size={isMobileView ? 32 : 40} className="text-indigo-600" />
            </motion.div>
          </motion.div>

          {/* Enhanced title with gradient */}
          <motion.h2
            className={`font-bold mb-3 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent ${
              isMobileView ? "text-xl" : "text-2xl"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Your Budget Journey Awaits!
          </motion.h2>

          {/* Enhanced description */}
          <motion.p
            className={`text-gray-600 mb-6 max-w-sm leading-relaxed ${
              isMobileView ? "text-sm" : "text-base"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Take control of your finances with smart budgeting. Set limits, track expenses, and achieve your financial goals.
          </motion.p>

          {/* Enhanced features list */}
          <motion.div
            className={`grid gap-3 mb-6 w-full ${isMobileView ? "grid-cols-1" : "grid-cols-1"}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl border border-indigo-100">
              <div className="bg-indigo-100 rounded-lg p-1.5">
                <Target size={16} className="text-indigo-600" />
              </div>
              <span className={`text-gray-700 font-medium ${isMobileView ? "text-sm" : "text-sm"}`}>
                Set spending limits
              </span>
            </div>
            
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-xl border border-purple-100">
              <div className="bg-purple-100 rounded-lg p-1.5">
                <TrendingUp size={16} className="text-purple-600" />
              </div>
              <span className={`text-gray-700 font-medium ${isMobileView ? "text-sm" : "text-sm"}`}>
                Track your progress
              </span>
            </div>
          </motion.div>

          {/* Enhanced CTA button */}
          <motion.button
            onClick={handleCreateBudget}
            className={`bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm ${
              isMobileView ? "px-6 py-3 text-sm w-full" : "px-8 py-4 text-base"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 10px 40px rgba(79, 70, 229, 0.3)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ rotate: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Plus size={isMobileView ? 18 : 20} />
            </motion.div>
            Create Your First Budget
          </motion.button>

          {/* Enhanced footer text */}
          <motion.p
            className={`text-gray-400 mt-4 ${isMobileView ? "text-xs" : "text-sm"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Start building better financial habits today
          </motion.p>
        </div>
      </div>

      <CreateNewBudget
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default EmptyBudget;