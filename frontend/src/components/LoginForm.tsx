import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


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
        // Convert the createdAt to string if it's a Date
        const user = {
          ...data.user,
          createdAt:
            typeof data.user.createdAt === "string"
              ? data.user.createdAt
              : new Date(data.user.createdAt).toISOString(),
        };

        // Pass the remember state
        setAuthData(user, data.token, remember);

        // Get the redirect path from location state or default to home
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
          placeholder="Enter your username"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
          placeholder="Enter your password"
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
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
          className="text-sm text-gray-600 hover:text-black transition-colors"
        >
          Forgot password?
        </button>
      </div>

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
            Signing in...
          </div>
        ) : (
          "Sign in"
        )}
      </button>

      <div className="text-center text-sm">
        <span className="text-gray-600">Don't have an account?</span>{" "}
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="text-black hover:underline focus:outline-none"
        >
          Sign up
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
