import React from "react";
import SideBar from "../components/SideBar"; // Import your Sidebar

const AddExpense: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content Area */}
      <div className="flex-1 p-5 ml-[240px]">
        <h1 className="text-2xl font-bold mb-4">Add Expense</h1>
        <p>This is where you can add a new expense.</p>
      </div>
    </div>
  );
};

export default AddExpense;
