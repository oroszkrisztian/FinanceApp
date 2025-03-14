import React, { useEffect, useState } from "react";
import { getUserAllTransactions } from "../services/transactionService";
import { useAuth } from "../context/AuthContext";

// Define a safe type that covers all possibilities
interface Transaction {
  id?: number;
  amount?: number;
  currency?: string;
  type?: string;
  description?: string | null;
  name?: string | null;
  createdAt?: string | Date;
  [key: string]: any; // Allow any other properties
}

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch data from API
        const data = await getUserAllTransactions(user.id);
        console.log("API returned data:", data);
        
        // Ensure we have an array to work with
        let transactionsArray: Transaction[] = [];
        
        if (Array.isArray(data)) {
          transactionsArray = data;
        } else if (data && typeof data === 'object') {
          if (data.id !== undefined) {
            // Single transaction object
            transactionsArray = [data];
          } else {
            // Look for array properties
            const arrayProps = Object.values(data).filter(val => Array.isArray(val));
            if (arrayProps.length > 0) {
              transactionsArray = arrayProps[0] as Transaction[];
            }
          }
        }
        
        console.log("Processed transactions array:", transactionsArray);
        setTransactions(transactionsArray);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load transactions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  // Render loading state
  if (loading) {
    return <div>Loading transactions...</div>;
  }

  // Render error state
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Make absolutely sure we have an array before rendering
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Render empty state
  if (safeTransactions.length === 0) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>
        <p>No transactions found.</p>
      </div>
    );
  }

  // Render transactions table
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Currency</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {safeTransactions.map((transaction, index) => (
                <tr key={transaction.id || index} className="border-b border-gray-200">
                  <td className="py-3 px-4 text-sm text-gray-700">{transaction.id || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {transaction.amount !== undefined ? transaction.amount.toFixed(2) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{transaction.currency || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{transaction.type || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {transaction.description || transaction.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {transaction.createdAt 
                      ? new Date(transaction.createdAt).toLocaleDateString() 
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;