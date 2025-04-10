import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const LoginForm = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user && data.token) {
        const user = {
          ...data.user,
          createdAt:
            typeof data.user.createdAt === "string"
              ? data.user.createdAt
              : new Date(data.user.createdAt).toISOString(),
        };

        setAuthData(user, data.token, remember);

        const location = window.location as any;
        const from = location.state?.from?.pathname || "/home";
        navigate(from, { replace: true });
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 ">
      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"
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

      {/* Username field */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
        >

          Username
        </label>
        <div className="flex items-center border border-indigo-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50">
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
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full py-3 px-2 bg-transparent outline-none text-gray-800"
            placeholder="Enter your username"
            required
          />
        </div>
      </div>

      {/* Password field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
        >
         
          Password
        </label>
        <div className="flex items-center border border-indigo-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-indigo-50/50">
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
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full py-3 px-2 bg-transparent outline-none text-gray-800"
            placeholder="Enter your password"
            required
          />
        </div>
      </div>

      {/* Remember me and forgot password */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label
            htmlFor="remember"
            className="ml-2 block text-sm text-gray-700"
          >
            Remember me
          </label>
        </div>
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit button */}
      <div className="pt-4">
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
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </motion.button>
      </div>

      {/* Sign up link */}
      <div className="text-center pt-4">
        <span className="text-gray-600">Don't have an account?</span>{" "}
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium focus:outline-none"
        >
          Sign up
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
