import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./globals.css";

// Page imports
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import Savings from "./pages/Savings";
import Transactions from "./pages/Transactions";
import Accounts from "./pages/Payments";
import Settings from "./pages/Settings";
import Profile from "./pages/ProfilePage";
import SideBar from "./components/SideBar";
import TopBar from "./components/TopBar";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  

  const [collapsed, setCollapsed] = useState(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    return savedState ? JSON.parse(savedState) : window.innerWidth < 768;
  });
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Toggle sidebar function to pass to TopBar
  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
    
      if (mobile && !collapsed) {
        setCollapsed(true);
        localStorage.setItem("sidebar-collapsed", JSON.stringify(true));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed]);

  const getTitle = (pathname: string) => {
    switch (pathname) {
      case "/home":
        return "Home";
      case "/savings":
        return "Savings";
      case "/transactions":
        return "Transactions";
      case "/payments":
        return "Payments";
      case "/settings":
        return "Settings";
      case "/profile":
        return "Profile";
      default:
        return "My App";
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const contentMarginLeft = isMobile ? 0 : '5rem'; 

  return (
    <div className="h-screen w-full overflow-hidden">
      {/* Fixed TopBar at the top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBar 
          title={getTitle(location.pathname)} 
          collapsed={collapsed} 
          toggleSidebar={toggleSidebar} 
        />
      </div>
      
      {/* Sidebar - with smooth animation - original positioning */}
      <div 
        className="fixed top-14 left-0 z-40 transition-all duration-300 ease-in-out"
        style={{
          transform: (collapsed && isMobile) ? 'translateX(-100%)' : 'translateX(0)',
          width: collapsed ? '5rem' : '10rem'
        }}
      >
        <SideBar collapsed={collapsed} />
      </div>
      
      {/* Main content - with adjusted margin for desktop closed sidebar */}
      <div 
        className="overflow-auto h-full pt-14 transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: contentMarginLeft,
          width: isMobile ? '100%' : `calc(100% - ${contentMarginLeft})`,
        }}
      >
        {/* Optional overlay when sidebar is open on mobile */}
        {!collapsed && isMobile && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ease-in-out"
            onClick={toggleSidebar}
            style={{ top: "3.5rem" }} 
          />
        )}
        {children}
      </div>
    </div>
  );
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || "/home";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

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
            path="/payments"
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;