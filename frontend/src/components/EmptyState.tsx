import { motion } from "framer-motion";

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  darkMode?: boolean;
}

const EmptyState = ({
  title,
  description,
  buttonText,
  onClick,
  darkMode = false,
}: EmptyStateProps) => (
  <div className="flex flex-grow items-center justify-center">
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", bounce: 0.4, type: "spring" }}
      className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} 
                  p-6 rounded-lg shadow-lg text-center border max-w-md mx-auto`}
    >
      <h2 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {title}
      </h2>
      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
        {description}
      </p>
      <button
        onClick={onClick}
        className={`${
          darkMode 
            ? 'bg-white text-black hover:bg-gray-200' 
            : 'bg-black text-white hover:bg-gray-800'
        } px-4 py-2 font-semibold rounded hover:shadow-lg transition-colors transform hover:-translate-y-1`}
      >
        {buttonText}
      </button>
    </motion.div>
  </div>
);

export default EmptyState;