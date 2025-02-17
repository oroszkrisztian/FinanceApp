import React from "react";
import SideBar from "../components/SideBar"; // Import your Sidebar

const HomePage: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content Area */}
      <div className="flex-1  "> {/* Adjust margin-left to prevent overlap */}
        <h1 className="text-2xl font-bold mb-4">
          Welcome to the Home Page!
        </h1>
        <p>This is your home page where you can manage your application.</p>
      </div>
    </div>
  );
};

export default HomePage;
