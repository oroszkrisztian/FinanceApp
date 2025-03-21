import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { deleteSavingAccount } from "../../services/accountService";
import { useAuth } from "../../context/AuthContext";
import AnimatedModal from "../animations/BlurPopup";
import { Account } from "../../interfaces/Account";

interface DeleteSavingAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  accountId: number | null;
  accountName: string;
  onSuccess: () => void;
}

const DeleteSavingAccountModal: React.FC<DeleteSavingAccountModalProps> = ({
  isOpen,
  onClose,
  accounts,
  accountId,
  accountName,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const account = accounts.find((acc) => acc.id === accountId);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setConfirmText("");
      setError(null);
      onClose();
    }, 150);
  };

  useEffect(() => {}, []);

  const handleConfirmDelete = async () => {
    if (confirmText !== "Delete" || !accountId || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      await deleteSavingAccount(user.id, accountId);
      setLoading(false);
      onSuccess();
      handleClose();
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error deleting saving account:", err);
    }
  };

  return (
    <AnimatedModal
      isOpen={isOpen && !isClosing}
      onClose={handleClose}
      closeOnBackdropClick={true}
      backdropBlur="sm"
      animationDuration={150}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4 text-red-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="text-xl font-semibold">Delete Savings Goal</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            <div className="flex">
              <svg
                className="h-5 w-5 mr-2 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the savings goal{" "}
            <span className="font-semibold">{accountName}</span>? This action
            cannot be undone.
          </p>
          <p className="text-gray-700 mb-4">
            To confirm, please type{" "}
            <span className="font-semibold text-red-600">Delete</span> below:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            placeholder="Type 'Delete' to confirm"
          />
        </div>

        <div>
          {!account?.savingAccount?.isCompleted && (
            <p className="text-gray-700 mb-4">
              goal not yet completed, implement where to send funds
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleConfirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={confirmText !== "Delete" || loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting...
              </>
            ) : (
              "Delete Savings Goal"
            )}
          </motion.button>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default DeleteSavingAccountModal;
