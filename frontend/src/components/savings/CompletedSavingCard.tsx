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
  onDelete
}) => {
  return (
    <motion.div
      key={account.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative bg-white p-4 rounded-xl shadow-md border border-green-300 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Wave background at bottom with green loading effect */}
      <div className="absolute bottom-0 left-0 right-0 h-24 z-0 overflow-hidden">
        <div
          className="absolute bottom-0 left-0 w-full h-full bg-green-400 z-0"
          style={{
            opacity: 0.4,
            clipPath:
              "path('M0 43.9999C106.667 43.9999 213.333 7.99994 320 7.99994C426.667 7.99994 533.333 43.9999 640 43.9999C746.667 43.9999 853.333 7.99994 960 7.99994C1066.67 7.99994 1173.33 43.9999 1280 43.9999C1386.67 43.9999 1440 19.0266 1440 9.01329V100H0V43.9999Z')",
          }}
        ></div>

        {/* Gradient overlay for smooth transition */}
        <div
          className="absolute bottom-0 left-0 h-full z-1"
          style={{
            width: "100%",
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 90%, rgba(255,255,255,1) 100%)",
            transition: "width 0.5s ease-in-out",
          }}
        ></div>
      </div>

      {/* Card content with higher z-index to appear above the background */}
      <div className="relative">
        <h3 className="text-xl font-bold mb-3 text-green-700">
          {account.name || "Unnamed Account"}
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        </h3>
        <div className="space-y-2">
          <p className="text-gray-700 flex justify-between">
            <span className="font-medium">Currency:</span>
            <span className="text-gray-800">
              {account.currency || "N/A"}
            </span>
          </p>

          {/* Current Amount */}
          <p className="text-gray-700 flex justify-between">
            <span className="font-medium">
              Current Amount:
            </span>
            <span className="font-semibold text-green-600">
              {(account.amount || 0).toFixed(2)}
            </span>
          </p>

          {account.savingAccount && (
            <p className="text-gray-700 flex justify-between">
              <span className="font-medium">
                Target Amount:
              </span>
              <span className="text-gray-800 font-semibold">
                {account.savingAccount.targetAmount
                  ? account.savingAccount.targetAmount.toFixed(2)
                  : "Not set"}
              </span>
            </p>
          )}
          
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">
                Progress
              </span>
              <span>
                100%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-green-500 h-2.5 rounded-full"
                style={{
                  width: "100%",
                }}
              ></div>
            </div>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="text-xs text-green-600">
                Start Date
              </p>
              <p className="text-sm">
                {account.savingAccount?.startDate
                  ? new Date(account.savingAccount.startDate).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>

            {account.savingAccount?.targetDate && (
              <div className="text-right">
                <p className="text-xs text-green-600">
                  Completion Date
                </p>
                <p className="text-sm">
                  {new Date(account.savingAccount.targetDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Delete button */}
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 py-2 bg-green-50 text-red-700 rounded-lg hover:bg-red-100 focus:outline-none transition-colors text-sm font-medium border border-red-200"
            onClick={() => onDelete(account.id, account.name)}
          >
            Delete Goal
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CompletedSavingCard;