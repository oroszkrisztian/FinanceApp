import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAccounts } from "../services/accountService"; // Import the service function
import { AccountType } from "../interfaces/enums";

const ProfilePage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]); // Replace `any` with your Account interface
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user accounts on component mount
  useEffect(() => {
    const fetchUserAccounts = async () => {
      if (!user?.id) return;

      try {
        const data = await fetchAccounts(user.id);
        setAccounts(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch accounts"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAccounts();
  }, [user?.id]);

  // Filter accounts by type
  const defaultAccounts = accounts.filter(
    (account) => account.type === AccountType.DEFAULT
  );
  const savingAccounts = accounts.filter(
    (account) => account.type === AccountType.SAVINGS
  );

  return (
    <div className="flex-row min-h-screen bg-white">
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

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-3">Default Accounts</h2>
        {isLoading ? (
          <p>Loading accounts...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : defaultAccounts.length === 0 ? (
          <p>No default accounts found.</p>
        ) : (
          <div className="space-y-4">
            {defaultAccounts.map((account) => (
              <div
                key={account.id}
                className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <p>
                  <span className="font-medium">Account Name:</span>{" "}
                  {account.name}
                </p>
                <p>
                  <span className="font-medium">Type:</span> Default Account
                </p>
                <p>
                  <span className="font-medium">Currency:</span>{" "}
                  {account.currency}
                </p>
                <p>
                  <span className="font-medium">Description:</span>{" "}
                  {account.description || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-3">Savings Accounts</h2>
        {isLoading ? (
          <p>Loading accounts...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : savingAccounts.length === 0 ? (
          <div>
            <p>No savings accounts found.</p>
            <button
              onClick={() => {
                // Add logic to open a modal or navigate to create a savings account
                alert("Redirect to create savings account page");
              }}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create Savings Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {savingAccounts.map((account) => (
              <div
                key={account.id}
                className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <p>
                  <span className="font-medium">Account Name:</span>{" "}
                  {account.name}
                </p>
                <p>
                  <span className="font-medium">Type:</span> Savings Account
                </p>
                <p>
                  <span className="font-medium">Currency:</span>{" "}
                  {account.currency}
                </p>
                <p>
                  <span className="font-medium">Description:</span>{" "}
                  {account.description || "N/A"}
                </p>
                {account.savingAccount && (
                  <p>
                    <span className="font-medium">Target Amount:</span>{" "}
                    {account.savingAccount.targetAmount}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
