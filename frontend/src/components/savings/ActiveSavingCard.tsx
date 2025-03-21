import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Account } from "../../interfaces/Account";

interface ActiveSavingCardProps {
  account: Account;
  index: number;
  activeMenu: string | null;
  setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
  onAddFunds: (accountId: number) => void;
  onEdit: (accountId: number) => void;
  onDelete: (accountId: number, accountName: string) => void;
}

const ActiveSavingCard: React.FC<ActiveSavingCardProps> = ({
  account,
  index,
  activeMenu,
  setActiveMenu,
  onAddFunds,
  onEdit,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const calculateCompletionPercentage = () => {
    if (!account.savingAccount || !account.savingAccount.targetAmount) {
      return 0;
    }

    const currentAmount = account.amount || 0;
    const targetAmount = account.savingAccount.targetAmount || 0;

    if (targetAmount <= 0) {
      return 0;
    }

    const percentage = (currentAmount / targetAmount) * 100;
    return Math.min(parseFloat(percentage.toFixed(2)), 99.99);
  };

  const completionPercentage = calculateCompletionPercentage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu === String(account.id)) {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setActiveMenu(null);
        }
      }
    };

    const handleScroll = () => {
      if (activeMenu === String(account.id)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [activeMenu, account.id, setActiveMenu]);

  useEffect(() => {
    if (activeMenu === String(account.id) && menuRef.current) {
      const button = document.getElementById(`menu-button-${account.id}`);
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        const el = menuRef.current;

        // Position menu
        el.style.left = `${buttonRect.right - el.offsetWidth}px`;
        el.style.top = `${buttonRect.bottom + 8}px`;

        // Calculate available space
        const spaceBelow = window.innerHeight - buttonRect.bottom;

        // Adjust position if not enough space below
        if (
          spaceBelow < el.offsetHeight + 10 &&
          buttonRect.top > el.offsetHeight + 10
        ) {
          el.style.top = `${buttonRect.top - el.offsetHeight - 8}px`;
          el.style.transformOrigin = "bottom right";
        } else {
          el.style.transformOrigin = "top right";
        }

        // Animate in
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.transition = "opacity 0.2s ease-in-out";
        });
      }
    }
  }, [activeMenu, account.id]);

  return (
    <motion.div
      key={account.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative bg-white p-4 rounded-xl shadow-md border border-indigo-100 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 z-0 overflow-hidden">
        <div
          className="absolute bottom-0 left-0 w-full h-full bg-green-400 z-0"
          style={{
            opacity: 0.4,
            clipPath:
              "path('M0 43.9999C106.667 43.9999 213.333 7.99994 320 7.99994C426.667 7.99994 533.333 43.9999 640 43.9999C746.667 43.9999 853.333 7.99994 960 7.99994C1066.67 7.99994 1173.33 43.9999 1280 43.9999C1386.67 43.9999 1440 19.0266 1440 9.01329V100H0V43.9999Z')",
          }}
        ></div>

        <div
          className="absolute bottom-0 left-0 h-full z-1"
          style={{
            width: `${completionPercentage}%`,
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 80%, rgba(255,255,255,1) 100%)",
            transition: "width 0.5s ease-in-out",
          }}
        ></div>

        <div
          className="absolute bottom-0 right-0 h-full bg-white z-1"
          style={{
            width: `${100 - completionPercentage}%`,
            transition: "width 0.5s ease-in-out",
          }}
        ></div>
      </div>

      <div className="relative">
        <h3 className="text-xl font-bold mb-3 text-gray-900">
          {account.name || "Unnamed Account"}
        </h3>
        <div className="space-y-2">
          <p className="text-gray-700 flex justify-between">
            <span className="font-medium">Currency:</span>
            <span className="text-gray-800">{account.currency || "N/A"}</span>
          </p>

          {/* Current Amount */}
          <p className="text-gray-700 flex justify-between">
            <span className="font-medium">Current Amount:</span>
            <span className="text-indigo-600 font-semibold">
              {(account.amount || 0).toFixed(2)}
            </span>
          </p>

          {account.savingAccount && (
            <p className="text-gray-700 flex justify-between">
              <span className="font-medium">Target Amount:</span>
              <span className="text-gray-800 font-semibold">
                {account.savingAccount.targetAmount
                  ? account.savingAccount.targetAmount.toFixed(2)
                  : "Not set"}
              </span>
            </p>
          )}

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Progress</span>
              <span>{completionPercentage.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-green-500 h-2.5 rounded-full"
                style={{
                  width: `${completionPercentage}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="text-xs text-indigo-600">Start Date</p>
              <p className="text-sm">
                {account.savingAccount?.startDate
                  ? new Date(
                      account.savingAccount.startDate
                    ).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>

            {account.savingAccount?.targetDate && (
              <div className="text-right">
                <p className="text-xs text-indigo-600">Target Date</p>
                <p className="text-sm">
                  {new Date(
                    account.savingAccount.targetDate
                  ).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Buttons area with three-dot menu */}
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 focus:outline-none transition-colors text-sm font-medium border border-indigo-200"
            onClick={() => onAddFunds(account.id)}
          >
            Add Funds
          </button>

          {/* Three-dot menu button */}
          <div className="relative">
            <button
              id={`menu-button-${account.id}`}
              ref={buttonRef}
              onClick={() =>
                setActiveMenu(
                  activeMenu === String(account.id) ? null : String(account.id)
                )
              }
              className="p-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 focus:outline-none transition-colors border border-indigo-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {activeMenu === String(account.id) && (
              <div
                id={`menu-${account.id}`}
                ref={menuRef}
                className="fixed bg-white rounded-lg shadow-lg border border-indigo-100 z-50 opacity-0 w-48"
                onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                  e.stopPropagation()
                }
              >
                <div className="py-1">
                  <button
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                    onClick={() => onEdit(account.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-3 text-indigo-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <span>Edit Account</span>
                  </button>

                  <div className="border-t border-indigo-100"></div>

                  <button
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => onDelete(account.id, account.name)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-3 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveSavingCard;
