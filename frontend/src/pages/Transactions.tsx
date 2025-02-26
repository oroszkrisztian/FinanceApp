import React from "react";
import TopBar from "../components/TopBar";

const Transactions: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main Content Area */}
      <div className="flex-1  ">
        {" "}
        {/* Adjust margin-left to prevent overlap */}
        <h1 className="text-2xl font-bold mb-4">
          Welcome to the Transactions page!
        </h1>
        <p>This is your Transactions page .</p>
      </div>
    </div>
  );
};

export default Transactions;
