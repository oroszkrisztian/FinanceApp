import React from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface SavingsEmptyStateProps {
  onCreateSavings: () => void;
}

const SavingsEmptyState: React.FC<SavingsEmptyStateProps> = ({ onCreateSavings }) => {
  return (
    <div className="h-full flex items-center justify-center py-4">
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-4 sm:p-8 bg-white rounded-2xl shadow-lg border border-gray-100 mx-auto max-w-2xl w-full sm:w-11/12 md:w-4/5"
    >
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4 sm:mb-6">
          {/* Lottie Piggy Bank Animation */}
          <DotLottieReact
            src="/src/assets/animations/piggybank.lottie"
            loop
            autoplay
          />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">Start Your Savings Journey</h2>
        
        <p className="text-gray-600 text-center mb-4 sm:mb-6 max-w-md text-sm sm:text-base px-2">
          Create a savings goal to track your progress and watch your money grow.
          Set target amounts, dates, and easily add funds to reach your financial dreams.
        </p>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 w-full mb-4 sm:mb-6">
          <motion.div 
            className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center"
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Set Goals</h3>
            <p className="text-xs sm:text-sm text-gray-600">Define what you're saving for</p>
          </motion.div>
          
          <motion.div 
            className="bg-green-50 p-3 sm:p-4 rounded-lg text-center"
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Track Progress</h3>
            <p className="text-xs sm:text-sm text-gray-600">Monitor your savings growth</p>
          </motion.div>
          
          <motion.div 
            className="bg-purple-50 p-3 sm:p-4 rounded-lg text-center"
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Achieve Dreams</h3>
            <p className="text-xs sm:text-sm text-gray-600">Celebrate your milestones</p>
          </motion.div>
        </div>
        
        <motion.button
          onClick={onCreateSavings}
          whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base sm:text-lg font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
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
          <span>Create Your First Savings Goal</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SavingsEmptyState;