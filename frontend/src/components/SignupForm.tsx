import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch("http://localhost:3000/auth/register", {
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
        // Store auth data and redirect
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Name Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-1 focus:ring-black focus:border-black 
                     transition-colors"
            placeholder="John"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-1 focus:ring-black focus:border-black 
                     transition-colors"
            placeholder="Doe"
          />
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
        <input
          id="username"
          name="username"
          type="text"
          required
          minLength={3}
          value={formData.username}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:outline-none focus:ring-1 focus:ring-black focus:border-black 
                   transition-colors"
          placeholder="johndoe"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:outline-none focus:ring-1 focus:ring-black focus:border-black 
                   transition-colors"
          placeholder="john@example.com"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:outline-none focus:ring-1 focus:ring-black focus:border-black 
                   transition-colors"
          placeholder="••••••"
        />
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:outline-none focus:ring-1 focus:ring-black focus:border-black 
                   transition-colors"
          placeholder="••••••"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-white text-black border-2 border-black rounded-lg 
                 hover:bg-black hover:text-white transition-all duration-200 ease-in-out
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {loading ? (
          <div className="flex items-center justify-center">
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
      </button>

      {/* Login Link */}
      <div className="text-center text-sm mt-4">
        <span className="text-gray-600">Already have an account?</span>{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-black hover:underline focus:outline-none"
        >
          Sign in
        </button>
      </div>
    </form>
  );
};

export default SignupForm;
