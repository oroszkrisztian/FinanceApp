import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { Account } from "../interfaces/Account";
import CreateDefaultAccountPopup from "../components/accounts/CreateDefaultAccountPopup";
import { fetchAccounts } from "../services/accountService"; // Import the service

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

        await new Promise((resolve) => setTimeout(resolve, 500));

        try {
          const data = await fetchAccounts(user.id, signal);
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
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center border border-gray-700">
            <h2 className="text-xl font-semibold mb-3 text-white">
              No Accounts Found
            </h2>
            <p className="text-gray-300">
              Please create an account to get started.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4"
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

      {/* Modal for creating account */}
      {isModalOpen && (
        <CreateDefaultAccountPopup setIsModalOpen={setIsModalOpen} />
      )}
    </div>
  );
};

export default HomePage;
