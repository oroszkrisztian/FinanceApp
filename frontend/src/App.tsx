import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import AddExpense from "./pages/AddExpense";
import Savings from "./pages/Savings";
import Overview from "./pages/Overwiev";

// Removed the PageWrapper for auth pages since they need full viewport control
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/home"
          element={
            <div className="min-h-screen w-full">
              <HomePage />
            </div>
          }
        />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/overview" element={<Overview />} />
      </Routes>
    </Router>
  );
};

export default App;
