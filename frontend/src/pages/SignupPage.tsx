import React from "react";
import SignupForm from "../components/SignupForm";
import { motion } from "framer-motion";

const SignupPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative flex min-h-[30rem] overflow-hidden rounded-2xl shadow-2xl"
    >
      {/* Left Column - Signup Form with Gradient */}
      <div className="w-full md:w-[45%] p-8 lg:p-12 bg-gradient-to-r from-white via-white to-[rgb(250,223,134)]">
        <div className="h-full">
          {/* Logo Section */}
          <div className="mb-8">
            <div className="h-10 w-10">
              <img 
                src="../src/assets/testlogo.png" 
                alt="Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-10 space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 lg:text-4xl">
              Create Account
            </h1>
            <p className="text-gray-600">
              Please fill in your details to sign up
            </p>
          </div>

          {/* Signup Form */}
          <div className="w-full max-w-md">
            <SignupForm />
          </div>
        </div>
      </div>

      {/* Right Column - Image */}
      <div className="hidden md:block md:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="../src/assets/money.jpg"
            alt="Signup illustration"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default SignupPage;