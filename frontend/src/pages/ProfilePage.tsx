import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAccounts, fetchSavings } from "../services/accountService";
import { AccountType } from "../interfaces/enums";
import { motion } from "framer-motion";
import "../globals.css";

const ProfilePage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'accounts' | 'savings'>('accounts');

  useEffect(() => {
    const fetchUserAccounts = async () => {
      if (!user?.id) return;

      try {
        const [defaultAccountsData, savingsAccountsData] = await Promise.all([
          fetchAccounts(user.id),
          fetchSavings(user.id),
        ]);

        setAccounts([...defaultAccountsData, ...savingsAccountsData]);
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

  const defaultAccounts = accounts.filter(
    (account) => account.type === AccountType.DEFAULT
  );
  const savingAccounts = accounts.filter(
    (account) => account.type === AccountType.SAVINGS
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  const calculateCompletionPercentage = (account: any) => {
    if (!account.savingAccount || !account.savingAccount.targetAmount) {
      return 0;
    }
    
    // In a real app, you would use actual current amount
    // For demo purposes, returning 100% if completed, otherwise a random percentage
    return account.savingAccount.isCompleted ? 100 : Math.floor(Math.random() * 90) + 10;
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 p-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-700">
          My Profile
        </h1>
      </motion.div>

      {/* User Profile Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-xl shadow-md mb-8 border border-gray-200"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Profile Avatar */}
          <div className="w-20 h-20 bg-gradient-to-r from-gray-700 to-black rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          
          {/* User Information */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {user?.firstName} {user?.lastName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>@{user?.username}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>ID: {user?.id?.toString().substring(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex mb-6 border-b border-gray-200"
      >
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-4 px-6 font-medium text-lg transition-all duration-300 relative ${
            activeTab === 'accounts' 
              ? 'text-black' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Accounts
          {activeTab === 'accounts' && (
            <motion.div 
              className="absolute bottom-0 left-0 w-full h-1 bg-black"
              layoutId="activeTab"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`pb-4 px-6 font-medium text-lg transition-all duration-300 relative ${
            activeTab === 'savings' 
              ? 'text-black' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Savings
          {activeTab === 'savings' && (
            <motion.div 
              className="absolute bottom-0 left-0 w-full h-1 bg-black"
              layoutId="activeTab"
            />
          )}
        </button>
      </motion.div>

      {/* Accounts Content */}
      <AnimatedTabPanel isActive={activeTab === 'accounts'}>
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : defaultAccounts.length === 0 ? (
          <EmptyState
            title="No Accounts Found"
            description="You don't have any accounts yet."
            buttonText="Add Account"
            onClick={() => alert("Redirect to create account page")}
          />
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {defaultAccounts.map((account) => (
              <motion.div
                key={account.id}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  {account.name}
                </h3>
                <div className="space-y-3">
                  <p className="text-gray-700 flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm">Default Account</span>
                  </p>
                  <p className="text-gray-700 flex justify-between">
                    <span className="font-medium">Currency:</span>
                    <span className="text-black">{account.currency}</span>
                  </p>
                  <p className="text-gray-700 flex justify-between">
                    <span className="font-medium">Description:</span>
                    <span className="text-gray-600">{account.description || "N/A"}</span>
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button className="w-full py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    View Transactions
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatedTabPanel>

      {/* Savings Content */}
      <AnimatedTabPanel isActive={activeTab === 'savings'}>
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : savingAccounts.length === 0 ? (
          <EmptyState
            title="No Savings Accounts Found"
            description="You don't have any savings accounts yet."
            buttonText="Create Savings Account"
            onClick={() => alert("Redirect to create savings account page")}
          />
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {savingAccounts.map((account) => {
              const completionPercentage = calculateCompletionPercentage(account);
              
              return (
                <motion.div
                  key={account.id}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <h3 className="text-xl font-bold mb-4 text-gray-900">
                    {account.name}
                  </h3>
                  <div className="space-y-3">
                    <p className="text-gray-700 flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span className="bg-black text-white px-2 py-1 rounded text-sm">Savings</span>
                    </p>
                    <p className="text-gray-700 flex justify-between">
                      <span className="font-medium">Currency:</span>
                      <span className="text-black">{account.currency}</span>
                    </p>
                    
                    {account.savingAccount && (
                      <>
                        <p className="text-gray-700 flex justify-between">
                          <span className="font-medium">Target Amount:</span>
                          <span className="text-black font-semibold">{account.savingAccount.targetAmount}</span>
                        </p>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">Progress</span>
                            <span>{completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <motion.div 
                              className="bg-black h-2.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${completionPercentage}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            ></motion.div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Start Date</p>
                            <p className="text-sm">
                              {new Date(account.savingAccount.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          
                          {account.savingAccount.targetDate && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Target Date</p>
                              <p className="text-sm">
                                {new Date(account.savingAccount.targetDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                    <button className="flex-1 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                      Add Funds
                    </button>
                    <button className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                      Details
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatedTabPanel>
    </div>
  );
};

// Reusable Components
const AnimatedTabPanel = ({ 
  children, 
  isActive 
}: { 
  children: React.ReactNode, 
  isActive: boolean 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: isActive ? 1 : 0,
      y: isActive ? 0 : 20
    }}
    transition={{ duration: 0.3 }}
    style={{ display: isActive ? 'block' : 'none' }}
  >
    {children}
  </motion.div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin h-12 w-12 border-4 border-black rounded-full border-t-transparent"></div>
  </div>
);

const ErrorState = ({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="p-6 bg-red-50 text-red-500 rounded-lg text-sm shadow-md border border-red-100 max-w-md">
      {error}
    </div>
    <button
      onClick={() => window.location.reload()}
      className="mt-6 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
    >
      Retry
    </button>
  </div>
);

const EmptyState = ({ 
  title, 
  description, 
  buttonText, 
  onClick 
}: { 
  title: string, 
  description: string, 
  buttonText: string, 
  onClick: () => void 
}) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="bg-white p-8 rounded-xl shadow-md text-center border border-gray-200 max-w-md mx-auto"
  >
    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
      {title}
    </h2>
    <p className="text-gray-600 mb-6">
      {description}
    </p>
    <button
      onClick={onClick}
      className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
    >
      {buttonText}
    </button>
  </motion.div>
);

export default ProfilePage;