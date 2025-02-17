import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import Savings from "./pages/Savings";
import Transactions from "./pages/Transactions";
import Accounts from "./pages/Accounts";
import Settings from "./pages/Settings";
import SideBar from "./components/SideBar";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen w-full">
      <SideBar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/savings"
            element={
              <ProtectedRoute>
                <Savings />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route
            path="/"
            element={<Navigate to="/home" replace />}
          />

          {/* Catch all route */}
          <Route
            path="*"
            element={<Navigate to="/home" replace />}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;