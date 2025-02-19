// src/pages/Accounts.tsx
import React from "react";
import TopBar from "../components/accounts/TopBar";

const Accounts: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 flex-col">
      <TopBar
        title="Accounts"
        pageType="accounts"
        searchPlaceholder="Search accounts..."
        buttonText="Add Account"
        onSearch={(value) => console.log("Searching accounts:", value)}
        onButtonClick={() => console.log("Add Account Clicked")}
      />

      {/* Main Content Area */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">This is your Accounts page.</p>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
