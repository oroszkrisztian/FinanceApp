import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, WifiOff } from "lucide-react";

interface ErrorStateProps {
  error: string;
  title?: string;
  showHomeButton?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = "Something went wrong",
  showHomeButton = false,
  onRetry,
  onHome,
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = '/';
    }
  };

  const getErrorType = () => {
    const errorLower = error.toLowerCase();
    if (errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('fetch')) {
      return {
        icon: WifiOff,
        bgGradient: "from-blue-50 to-indigo-50",
        cardBg: "bg-blue-50/80",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        titleColor: "text-blue-800",
        textColor: "text-blue-700",
        borderColor: "border-blue-200/50",
        buttonBg: "from-blue-600 to-indigo-600",
        buttonHover: "from-blue-700 to-indigo-700"
      };
    }
    return {
      icon: AlertTriangle,
      bgGradient: "from-red-50 to-pink-50",
      cardBg: "bg-red-50/80",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      titleColor: "text-red-800",
      textColor: "text-red-700",
      borderColor: "border-red-200/50",
      buttonBg: "from-red-600 to-pink-600",
      buttonHover: "from-red-700 to-pink-700"
    };
  };

  const errorType = getErrorType();
  const IconComponent = errorType.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${errorType.bgGradient} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className={`absolute top-0 right-0 bg-gradient-to-br ${errorType.buttonBg} rounded-full opacity-10 w-24 h-24 -translate-y-12 translate-x-12`}></div>
          <div className={`absolute bottom-0 left-0 bg-gradient-to-tr ${errorType.buttonBg} rounded-full opacity-5 w-20 h-20 translate-y-10 -translate-x-10`}></div>

          <div className="relative z-10 p-8">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200 }}
              className={`${errorType.iconBg} rounded-2xl p-4 w-fit mx-auto mb-6 shadow-inner`}
            >
              <IconComponent className={`w-8 h-8 ${errorType.iconColor}`} />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={`text-2xl font-bold ${errorType.titleColor} text-center mb-3`}
            >
              {title}
            </motion.h2>

            {/* Error message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className={`${errorType.cardBg} backdrop-blur-sm rounded-xl p-4 border ${errorType.borderColor} mb-6`}
            >
              <p className={`${errorType.textColor} text-sm leading-relaxed text-center`}>
                {error}
              </p>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="space-y-3"
            >
              {/* Retry Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRetry}
                className={`w-full px-6 py-3 bg-gradient-to-r ${errorType.buttonBg} text-white rounded-xl hover:${errorType.buttonHover} transition-all font-medium shadow-lg flex items-center justify-center gap-2`}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </motion.button>

              {/* Home Button (optional) */}
              {showHomeButton && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleHome}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </motion.button>
              )}
            </motion.div>

            {/* Help text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="text-xs text-gray-500 text-center mt-6"
            >
              If the problem persists, please contact support or try again later.
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorState;