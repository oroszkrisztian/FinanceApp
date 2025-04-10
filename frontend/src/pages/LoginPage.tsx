import LoginForm from "../components/LoginForm";
import { motion } from "framer-motion";
import testLogo from "../assets/testlogo.png";
import moneyImage from "../assets/money.jpg";

const LoginPage = () => {
  return (
    <div className="min-h-screen h-full w-full bg-gradient-to-r from-gray-50 via-slate-50 to-gray-100">
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex"
        >
          {/* Left Column - Login Form */}
          <div className="w-full md:w-1/2 p-8 bg-white relative">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 opacity-10 rounded-bl-full"></div>

            {/* Logo */}
            <div className="mb-8">
              <div className="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-2 shadow-md">
                <img
                  src={testLogo}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-black to-indigo-800 mb-2">
                Welcome back
              </h2>
              <p className="text-gray-600">
                Please enter your details to sign in
              </p>
            </div>

            {/* Login Form */}
            <LoginForm />
          </div>

          {/* Right Column - Image with overlay gradient */}
          <div className="hidden md:block md:w-1/2 bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/70 to-black/90 z-10 mix-blend-multiply"></div>
            <div
              className="absolute inset-0 opacity-20 mix-blend-overlay z-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20px 20px, white 2px, transparent 3px)",
                backgroundSize: "20px 20px",
              }}
            ></div>
            <img
              src={moneyImage}
              alt="Login illustration"
              className="h-full w-full object-cover z-0"
            />
            <div className="absolute bottom-10 left-10 right-10 text-white z-30">
              <h3 className="text-2xl font-bold mb-3">Finance Management</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Track your expenses, plan your budget, and achieve your
                financial goals with our comprehensive tools.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
