import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { Fund } from "../types/funds";

const HomePage = () => {
  const { user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getFunds = async () => {
      setLoading(true);
      setError(null);

      const url = `http://localhost:3000/fund/funds?userId=${user?.id}`;
      console.log("URL:", url);

      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Funds data:", data); // Log the data here
        if (response.ok) {
          setFunds(data);
        } else {
          setError(data.error || "Failed to load funds");
        }
      } catch (error) {
        console.error("Error loading funds:", error);
        setError("Failed to load funds");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      getFunds();
    }
  }, [user]);

  return (
    <div className="flex-row min-h-screen bg-white">
      <TopBar title="Dashboard" pageType="dashboard" />

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

      <h2 className="text-xl font-semibold mb-3">Funds</h2>
      {loading ? (
        <p>Loading funds...</p>
      ) : error ? (
        <p>Error loading funds: {error}</p>
      ) : (
        <ul>
          {funds.map((fund) => (
            <li key={fund.id}>
              {fund.name} - {fund.amount} {fund.currency.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HomePage;
