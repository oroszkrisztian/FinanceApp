import React from "react";


const Settings: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Main Content Area */}
      <div className="flex-1  ">
        {" "}
        {/* Adjust margin-left to prevent overlap */}
        <h1 className="text-2xl font-bold mb-4">
          Welcome to the Settings page!
        </h1>
        <p>This is your Settings page .</p>
      </div>
    </div>
  );
};

export default Settings;
