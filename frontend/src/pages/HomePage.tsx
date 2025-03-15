import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { Account } from "../interfaces/Account";
import CreateDefaultAccountPopup from "../components/accounts/CreateDefaultAccountPopup";
import { fetchAllAccounts } from "../services/accountService";

import EmptyState from "../components/EmptyState";

const HomePage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadAccounts = async () => {
      if (user?.id) {
        setLoading(true);
        setError(null);

        try {
          const data = await fetchAllAccounts(user.id, signal);
          setAccounts(data);
        } catch (error) {
          if (error instanceof Error && error.name !== "AbortError") {
            console.error("Error fetching accounts:", error);
            setError("Failed to fetch accounts. Please try again later.");
          }
        } finally {
          setLoading(false);
        }
      }
    };

    loadAccounts();
    return () => controller.abort();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin h-8 w-8 border-4 border-black rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="p-4 bg-red-50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {accounts.length === 0 ? (
        <div className="flex flex-grow items-center justify-center bg-white">
         <EmptyState
          title="No Accounts Found"
          description="You don't have any accounts yet."
          buttonText="Add Account"
          onClick={() => setIsModalOpen(true)}
        />
        </div>
      ) : (
        <div className="p-6">
          {accounts.map((account, index) => (
            <div
              key={account.id}
              className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p>
                <span className="font-medium">Account ID:</span> {account.id}
              </p>
              <p>
                <span className="font-medium">Name:</span> {account.name}
              </p>
              <p>
                <span className="font-medium">Desc:</span> {account.description}
              </p>
              <p>
                <span className="font-medium">Currency:</span>{" "}
                {account.currency}
              </p>
              <p>
                <span className="font-medium">Type:</span> {account.type}
              </p>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <CreateDefaultAccountPopup setIsModalOpen={setIsModalOpen} />
      )}
    </div>
  );
};

export default HomePage;
