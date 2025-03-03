import { motion } from "framer-motion";

const LoadingState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4, ease: "easeInOut" }}
    className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8"
  >
    <motion.div
      animate={{
        rotate: 360,
        transition: {
          duration: 1.2,
          ease: "linear",
          repeat: Infinity,
        },
      }}
      className="h-16 w-16 border-4 border-gray-300 rounded-full border-t-black shadow-sm"
    ></motion.div>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="mt-4 text-gray-600 font-medium"
    >
      Loading your data...
    </motion.p>
  </motion.div>
);

export default LoadingState;