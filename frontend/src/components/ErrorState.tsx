import { motion } from "framer-motion";

const ErrorState = ({ error }: { error: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8"
  >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="p-6 bg-red-50 text-red-500 rounded-lg text-sm shadow-md border border-red-100 max-w-md"
    >
      {error}
    </motion.div>
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => window.location.reload()}
      className="mt-6 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-md"
    >
      Retry
    </motion.button>
  </motion.div>
);

export default ErrorState;