import React from "react";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/accounts/TopBar";

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-row min-h-screen bg-white">
      {/* Use the TopBar with the title set to "Dashboard" */}
      <TopBar
        title="Dashboard"
        pageType="dashboard"
      />

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-3">User Information</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Name:</span> {user?.firstName}{" "}
            {user?.lastName}
          </p>
          <p>
            <span className="font-medium">Username:</span> {user?.username}
          </p>
          <p>
            <span className="font-medium">ID:</span> {user?.id}
          </p>
        </div>
      </div>

      <p>This is your dashboard where you can manage your application.</p>
    </div>
  );
};

export default HomePage;
