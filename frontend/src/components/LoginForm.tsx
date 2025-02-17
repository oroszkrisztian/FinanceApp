import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: string;
}

interface LoginSuccessResponse {
  user: User;
  token: string;
}

interface LoginErrorResponse {
  error: string;
}

const LoginForm = () => {
  const navigate = useNavigate();
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
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
      });

      const data: LoginSuccessResponse | LoginErrorResponse = await response.json();

      if (response.ok && 'user' in data) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('token', data.token);
        storage.setItem('user', JSON.stringify(data.user));
        navigate("/home");
      } else {
        setError('error' in data ? data.error : "Login failed");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          /* Remove autofill background */
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
          }

          /* Style checkbox */
          .custom-checkbox {
            appearance: none;
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            border: 2px solid #e5e7eb;
            border-radius: 4px;
            outline: none;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
          }

          .custom-checkbox:checked {
            background-color: black;
            border-color: black;
          }

          .custom-checkbox:checked::after {
            content: '';
            position: absolute;
            left: 4px;
            top: 1px;
            width: 4px;
            height: 8px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }

          .custom-checkbox:hover {
            border-color: #d1d5db;
          }

          .custom-checkbox:focus {
            ring: 2px;
            ring-offset: 2px;
            ring-black;
          }
        `}
      </style>
      
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto bg-white p-6 sm:p-8 shadow-lg rounded-lg"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username or Email
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
            placeholder="Enter your username or email"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="custom-checkbox"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
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

        <div className="space-y-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-white text-black border-2 border-black rounded-lg 
                     hover:bg-black hover:text-white transition-all duration-200 ease-in-out
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
        </div>
      </form>
    </>
  );
};

export default LoginForm;