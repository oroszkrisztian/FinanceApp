import React from "react";
import SideBar from "../components/SideBar"; // Import your Sidebar

const Overview: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content Area */}
      <div className="flex-1  "> {/* Adjust margin-left to prevent overlap */}
        <h1 className="text-2xl font-bold mb-4">
          Welcome to the Expense Overview!
        </h1>
        <p>This is your  Expense Overview .</p>
      </div>
    </div>
  );
};

export default Overview;
