import React from "react";
import { motion } from "framer-motion";
import { Account } from "../../interfaces/Account";

interface CompletedSavingCardProps {
  account: Account;
  index: number;
  onDelete: (accountId: number, accountName: string) => void;
}

const CompletedSavingCard: React.FC<CompletedSavingCardProps> = ({
  account,
  index,
  onDelete,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account.currency || "USD",
      maximumFractionDigits: 2,
      currencyDisplay: "code"
    }).format(amount);
  };

  return (
    <motion.div
      key={account.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative bg-white p-4 rounded-xl shadow-md border border-green-100 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-10 rounded-bl-full"></div>

      {/* Wave background at bottom with green loading effect */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 z-0 overflow-hidden">
        <div
          className="absolute bottom-0 left-0 w-full h-full bg-green-400 z-0"
          style={{
            opacity: 0.4,
            clipPath:
              "path('M0 43.9999C106.667 43.9999 213.333 7.99994 320 7.99994C426.667 7.99994 533.333 43.9999 640 43.9999C746.667 43.9999 853.333 7.99994 960 7.99994C1066.67 7.99994 1173.33 43.9999 1280 43.9999C1386.67 43.9999 1440 19.0266 1440 9.01329V100H0V43.9999Z')",
          }}
        ></div>
      </div>

      {/* Card content with higher z-index to appear above the background */}
      <div className="relative">
        {/* Account Name with Completion Badge */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            {account.name || "Unnamed Account"}
          </h3>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            100% Complete
          </div>
        </div>

        {/* Main info area */}
        <div className="space-y-4">
          {/* Amount Display */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-1">
                Current Amount
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
                {formatCurrency(account.amount || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-1">
                Target
              </p>
              <p className="text-lg font-semibold text-gray-700">
                {account.savingAccount?.targetAmount
                  ? formatCurrency(account.savingAccount.targetAmount)
                  : "Not set"}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.2 }}
                className="bg-green-500 h-3 rounded-full"
              ></motion.div>
            </div>
          </div>

          {/* Dates and Timeline */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {account.savingAccount?.startDate && (
              <div className="bg-gray-50 rounded-lg p-2 justify-self-start">
                <p className="text-xs text-green-600 font-medium">
                  Started
                </p>
                <p className="text-sm font-medium">
                  {new Date(account.savingAccount.startDate).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            )}
            {account.savingAccount?.targetDate && (
              <div className="bg-gray-50 rounded-lg p-2 justify-self-end">
                <p className="text-xs text-green-600 font-medium">
                  Completion Date
                </p>
                <p className="text-sm font-medium">
                  {new Date(
                    account.savingAccount.targetDate
                  ).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex gap-2">
          <button
            className="flex-1 py-2.5 px-4 bg-white text-red-700 rounded-lg border border-red-200 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 focus:outline-none transition-all duration-200 text-sm font-medium flex items-center justify-center gap-1.5"
            onClick={() => onDelete(account.id, account.name)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Delete Goal
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CompletedSavingCard;