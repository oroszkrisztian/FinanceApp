import React from "react";
import SignupForm from "../components/SignupForm";
import { motion } from "framer-motion";

const SignupPage = () => {
  return (
    <div className="min-h-screen h-full w-full bg-black">
      <div className="min-h-screen w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden flex m-4"
        >
          {/* Left Column - Signup Form */}
          <div className="w-full md:w-1/2 p-8 lg:p-12 bg-white">
            {/* Logo Section */}
            <div className="mb-6">
              <div className="h-10 w-10">
                <img
                  src="../src/assets/testlogo.png"
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black mb-2 lg:text-4xl">
                Create Account
              </h1>
              <p className="text-gray-600">
                Please fill in your details to sign up
              </p>
            </div>

            {/* Signup Form */}
            <SignupForm />
          </div>

          {/* Right Column - Image */}
          <div className="hidden md:block md:w-1/2 bg-black">
            <img
              src="../src/assets/money.jpg"
              alt="Signup illustration"
              className="h-full w-full object-cover opacity-90 grayscale"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;