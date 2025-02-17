import React from "react";
import { useAuth } from "../context/AuthContext";

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-row min-h-screen bg-white">
      <h1 className="text-2xl font-bold mb-4">Welcome to the Home Page!</h1>
      
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-3">User Information</h2>
        <div className="space-y-2">
          <p><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</p>
          <p><span className="font-medium">Username:</span> {user?.username}</p>
          <p><span className="font-medium">ID:</span> {user?.id}</p>
        </div>
      </div>

      <p>This is your home page where you can manage your application.</p>
    </div>
  );
};

export default HomePage;