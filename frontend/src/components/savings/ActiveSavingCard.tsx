import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Account } from "../../interfaces/Account";

interface ActiveSavingCardProps {
  account: Account;
  index: number;
  activeMenu: string | null;
  setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
  onAddFunds: (accountId: number) => void;
  onTransfer: (accountId: number) => void;
  onEdit: (accountId: number) => void;
  onDelete: (accountId: number, accountName: string) => void;
}

const ActiveSavingCard: React.FC<ActiveSavingCardProps> = ({
  account,
  index,
  activeMenu,
  setActiveMenu,
  onAddFunds,
  onTransfer,
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
          el.style.transition =
            "opacity 0.2s ease-in-out, transform 0.2s ease-in-out";
          el.style.transform = "scale(1)";
        });
      }
    }
  }, [activeMenu, account.id]);

  const getColorScheme = () => {
    if (completionPercentage < 33) {
      return {
        primary: "indigo",
        accent: "bg-indigo-500",
        gradient: "from-indigo-500 to-purple-500",
      };
    } else if (completionPercentage < 66) {
      return {
        primary: "blue",
        accent: "bg-blue-500",
        gradient: "from-blue-500 to-cyan-500",
      };
    } else {
      return {
        primary: "green",
        accent: "bg-green-500",
        gradient: "from-emerald-500 to-green-500",
      };
    }
  };

  const colors = getColorScheme();

  const waveColor = "bg-green-400";
  const progressBarColor = "bg-green-500";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account.currency || "USD",
      maximumFractionDigits: 2,
      currencyDisplay: "code",
    }).format(amount);
  };

  return (
    <motion.div
      key={account.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative bg-white p-4 rounded-xl shadow-md border border-indigo-100 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Decorative corner accent */}
      <div
        className={`absolute top-0 right-0 w-20 h-20 ${colors.accent} opacity-10 rounded-bl-full`}
      ></div>

      {/* Wave background - positioned at the bottom like original */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 z-0 overflow-hidden">
        <div
          className={`absolute bottom-0 left-0 w-full h-full ${waveColor} z-0`}
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
            transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        ></div>

        <div
          className="absolute bottom-0 right-0 h-full bg-white z-1"
          style={{
            width: `${100 - completionPercentage}%`,
            transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        ></div>
      </div>

      <div className="relative">
        {/* Top section with account name and menu button */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className={`text-xl font-bold text-gray-900 tracking-tight`}>
              {account.name || "Unnamed Account"}
            </h3>
          </div>
          
          {/* Three-dot menu moved to top right */}
          <div className="relative">
            <button
              id={`menu-button-${account.id}`}
              ref={buttonRef}
              onClick={() =>
                setActiveMenu(
                  activeMenu === String(account.id) ? null : String(account.id)
                )
              }
              className={`p-2 rounded-lg  hover:bg-gray-100 transition-all duration-100 group -mr-2 -mt-1`}
              aria-label="More options"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600 group-hover:text-gray-900 transition-colors duration-300"
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
                className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 z-50 opacity-0 w-64 transform scale-95 backdrop-blur-sm bg-white/95"
                onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                  e.stopPropagation()
                }
                style={{
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="px-1 py-1.5">
                  {/* Menu Header */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                    Account Options
                  </div>

                  <button
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:translate-x-1"
                    onClick={() => onEdit(account.id)}
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium">Edit Account</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Modify account details and settings
                      </p>
                    </div>
                  </button>

                  <button
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:translate-x-1 mt-1 mb-1"
                    onClick={() => onDelete(account.id, account.name)}
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-50 text-red-600 mr-3">
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
                    </div>
                    <div>
                      <span className="font-medium">Delete Account</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Remove this account permanently
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Completion percentage moved under the name */}
        <div className="mb-4">
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${colors.primary}-100 text-${colors.primary}-800`}
          >
            {completionPercentage.toFixed(0)}% Complete
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
              <p
                className={`text-2xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}
              >
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
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`${progressBarColor} h-3 rounded-full`}
              ></motion.div>
            </div>
          </div>

          {/* Dates and Timeline */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {account.savingAccount?.startDate && (
              <div className="bg-gray-50 rounded-lg p-2 justify-self-start">
                <p className={`text-xs text-${colors.primary}-600 font-medium`}>
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
              <div className="bg-white-50 rounded-lg p-2 justify-self-end">
                <p className={`text-xs text-${colors.primary}-600 font-medium`}>
                  Target Date
                </p>
                <div className="flex justify-between items-center">
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
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2">
          <button
            className={`flex-1 py-2.5 px-4 bg-${colors.primary}-50 text-${colors.primary}-700 rounded-lg hover:bg-${colors.primary}-100 focus:ring-2 focus:ring-${colors.primary}-500 focus:ring-opacity-50 focus:outline-none transition-all duration-200 text-sm font-medium flex items-center justify-center gap-1.5`}
            onClick={() => onAddFunds(account.id)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Funds
          </button>

          <button
            className={`flex-1 py-2.5 px-4 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 focus:outline-none transition-all duration-200 text-sm font-medium flex items-center justify-center gap-1.5`}
            onClick={() => onTransfer(account.id)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
            Transfer
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveSavingCard;