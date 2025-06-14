import React, { useState, useRef, useEffect } from "react";
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(true);

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.05 + 0.3, 
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account.currency || "USD",
      maximumFractionDigits: 2,
      currencyDisplay: "code",
    }).format(amount);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setShowMenu(false);
        }
      }
    };

    const handleScroll = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showMenu]);

  useEffect(() => {
    if (showMenu && menuRef.current) {
      const button = document.getElementById(`menu-button-${account.id}`);
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        const el = menuRef.current;

        el.style.left = `${buttonRect.right - el.offsetWidth}px`;
        el.style.top = `${buttonRect.bottom + 8}px`;

        const spaceBelow = window.innerHeight - buttonRect.bottom;

        if (
          spaceBelow < el.offsetHeight + 10 &&
          buttonRect.top > el.offsetHeight + 10
        ) {
          el.style.top = `${buttonRect.top - el.offsetHeight - 8}px`;
          el.style.transformOrigin = "bottom right";
        } else {
          el.style.transformOrigin = "top right";
        }

        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.transition =
            "opacity 0.2s ease-in-out, transform 0.2s ease-in-out";
          el.style.transform = "scale(1)";
        });
      }
    }
  }, [showMenu, account.id]);

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "visible"}
      variants={cardVariants}
      className="relative bg-white p-4 rounded-xl shadow-md border border-green-100 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-10 rounded-bl-full"></div>

      {/* Wave background*/}
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

      {/* Card content */}
      <div className="relative">
        {/* Top section with account name and menu button */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              {account.name || "Unnamed Account"}
            </h3>
          </div>

          {/* Three-dot menu in top right */}
          <div className="relative">
            <button
              id={`menu-button-${account.id}`}
              ref={buttonRef}
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-100 group -mr-2 -mt-1"
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

            {showMenu && (
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
                        Remove this completed goal permanently
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Completion percentage*/}
        <div className="mb-4">
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
                transition={{ duration: 1, delay: 0.3 }}
                className="bg-green-500 h-3 rounded-full w-full"
              ></motion.div>
            </div>
          </div>

          {/* Dates and Timeline */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {account.savingAccount?.startDate && (
              <div className="bg-gray-50 rounded-lg p-2 justify-self-start">
                <p className="text-xs text-green-600 font-medium">Started</p>
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

        <div className="mt-5 flex gap-2">
          <button className="flex-1 py-2.5 px-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 focus:outline-none transition-all duration-200 text-sm font-medium flex items-center justify-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            View Achievement
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CompletedSavingCard;
