import { motion } from "framer-motion";

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}

const EmptyState = ({
  title,
  description,
  buttonText,
  onClick,
}: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="bg-white p-8 rounded-xl shadow-md text-center border border-gray-200 max-w-md mx-auto"
  >
    <h2 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h2>
    <p className="text-gray-600 mb-6">{description}</p>
    <button
      onClick={onClick}
      className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
    >
      {buttonText}
    </button>
  </motion.div>
);

export default EmptyState;
