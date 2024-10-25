// src/pages/HomePage.tsx
import React from "react";
import { Button } from "antd";
import SideBar from "../components/SideBar";
import { useNavigate } from "react-router-dom";
import BarChart from "../components/BarChart"; // Ensure this import is correct
import "../styles/HomePage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("User logged out");
    navigate("/");
  };

  return (
    <div className="flex">
      {/* Sidebar on the left */}
      <SideBar />
      {/* Main content area */}
      <div className="home-page flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Home Page!</h1>
        <p className="mb-6">
          This is your home page where you can manage your application.
        </p>

        {/* Add the BarChart in a styled container */}
        <div className="mb-6 max-w-md mx-auto p-4 border border-gray-300 rounded-lg shadow-md bg-white">
          <h2 className="text-xl font-semibold mb-2">Sales Overview</h2>
          <BarChart />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            style={{
              padding: "0 20px",
            }}
            type="primary"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
        {/* Additional content or spacing */}
        <div style={{ marginTop: "20px" }}></div>
      </div>
    </div>
  );
};

export default HomePage;
