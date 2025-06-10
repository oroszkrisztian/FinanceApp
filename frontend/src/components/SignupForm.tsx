import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

interface SignupFormValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupForm = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SignupFormValues>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://financeapp-bg0k.onrender.com/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setAuthData(data.user, data.token, true);
        navigate("/home");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col  h-full">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg mb-4"
        >
          <div className="flex">
            <svg
              className="h-5 w-5 mr-2 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* Names */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name
            </label>
            <div className="p-1">
              <div className="flex items-center border border-indigo-200 rounded-xl focus-within:ring-[3px] focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full py-3 px-4 bg-transparent outline-none text-gray-800"
                  placeholder="John"
                />
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name
            </label>
            <div className="p-1">
              <div className="flex items-center border border-indigo-200 rounded-xl focus-within:ring-[3px] focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full py-3 px-4 bg-transparent outline-none text-gray-800"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <div className="p-1">
            <div className="flex items-center border border-indigo-200 rounded-xl focus-within:ring-[3px] focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50">
              <div className="p-2 bg-indigo-50 m-1.5 rounded-md">
                <svg
                  className="h-5 w-5 text-indigo-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                value={formData.username}
                onChange={handleChange}
                className="w-full py-3 px-2 bg-transparent outline-none text-gray-800"
                placeholder="johndoe"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <div className="p-1">
            <div className="flex items-center border border-indigo-200 rounded-xl focus-within:ring-[3px] focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50">
              <div className="p-2 bg-indigo-50 m-1.5 rounded-md">
                <svg
                  className="h-5 w-5 text-indigo-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full py-3 px-2 bg-transparent outline-none text-gray-800"
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="p-1">
              <div className="flex items-center border border-indigo-200 rounded-xl focus-within:ring-[3px] focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50">
                <div className="p-2 bg-indigo-50 m-1.5 rounded-md">
                  <svg
                    className="h-5 w-5 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full py-3 px-2 bg-transparent outline-none text-gray-800"
                  placeholder="••••••"
                />
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <div className="p-1">
              <div className="flex items-center border border-indigo-200 rounded-xl focus-within:ring-[3px] focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50">
                <div className="p-2 bg-indigo-50 m-1.5 rounded-md">
                  <svg
                    className="h-5 w-5 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full py-3 px-2 bg-transparent outline-none text-gray-800"
                  placeholder="••••••"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 max-w-lg mx-auto w-full lg:px-20 px-10">
          <motion.button
            whileHover={{
              scale: 1.02,
              boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.2)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all 
                     disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </div>
            ) : (
              "Sign up"
            )}
          </motion.button>

          {/* Login Link */}
          <div className="text-center pt-4">
            <span className="text-gray-600">Already have an account?</span>{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium focus:outline-none"
            >
              Sign in
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
