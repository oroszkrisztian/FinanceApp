
import LoginForm from "../components/LoginForm";
import { motion } from "framer-motion";
import testLogo from "../assets/testlogo.png";
import moneyImage from "../assets/money.jpg";

const LoginPage = () => {
  return (
    <div className="min-h-screen h-full w-full bg-black">
      <div className="min-h-screen w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden flex m-4"
        >
          {/* Left Column - Login Form */}
          <div className="w-full md:w-1/2 p-8 bg-white">
            {/* Logo */}
            <div className="mb-6">
              <div className="h-10 w-10">
                <img
                  src={testLogo}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            
            {/* Welcome Text */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-black mb-2">
                Welcome back
              </h2>
              <p className="text-gray-800 text-sm">
                Please enter your details to sign in
              </p>
            </div>

            {/* Login Form */}
            <LoginForm />
          </div>

          {/* Right Column - Image */}
          <div className="hidden md:block md:w-1/2 bg-black">
            <img
              src={moneyImage}
              alt="Login illustration"
              className="h-full w-full object-cover opacity-90 grayscale"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;