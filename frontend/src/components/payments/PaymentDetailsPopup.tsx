import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  DollarSign,
  Tag,
  Bell,
  Zap,
  User,
  CreditCard,
  Edit,
  Trash2,
} from "lucide-react";
import { PaymentType } from "../../interfaces/enums";
import { deletePayment } from "../../services/paymentService";

interface PaymentDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: number;
    name: string;
    amount: number;
    frequency: string;
    nextExecution: string;
    currency: string;
    category: string;
    categories?: string[]; // Support for multiple categories
    account: string;
    isDue: boolean;
    type?: PaymentType;
    description?: string;
    emailNotification?: boolean;
    automaticPayment?: boolean;
  } | null;
  onEdit?: (paymentId: number) => void;
  onDelete?: (paymentId: number) => Promise<void>; 
}

const PaymentDetailsPopup: React.FC<PaymentDetailsPopupProps> = ({
  isOpen,
  onClose,
  payment,
  onEdit,
  onDelete,
}) => {
  if (!payment) return null;

  const isIncome = payment.type === PaymentType.INCOME;

  const calculateMonthlyImpact = () => {
    const multipliers = {
      WEEKLY: 4.33,
      BIWEEKLY: 2.17,
      MONTHLY: 1,
      QUARTERLY: 0.33,
      YEARLY: 0.083,
      DAILY: 30,
    };
    const factor =
      multipliers[
        payment.frequency.toUpperCase() as keyof typeof multipliers
      ] || 1;
    return payment.amount * factor;
  };

  // Get categories array - use categories if available, otherwise fallback to single category
  const categoryList = payment.categories && payment.categories.length > 0 
    ? payment.categories 
    : [payment.category];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`p-4 ${isIncome ? "bg-gradient-to-r from-green-600 to-green-500" : "bg-gradient-to-r from-red-600 to-red-500"} text-white`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className={`bg-white rounded-full p-2 shadow-md ${isIncome ? "text-green-600" : "text-red-600"}`}
                  >
                    {isIncome ? "💰" : "💸"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{payment.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold">
                        {isIncome ? "+" : "-"}
                        {payment.amount} {payment.currency}
                      </span>
                      {payment.isDue && (
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
                          Due Now
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Frequency</p>
                    <p className="font-medium">
                      {payment.frequency.charAt(0) +
                        payment.frequency.slice(1).toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="text-indigo-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Account</p>
                    <p className="font-medium">{payment.account}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Monthly Impact</p>
                    <p className="font-medium">
                      {calculateMonthlyImpact().toFixed(2)} {payment.currency}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  payment.isDue
                    ? isIncome
                      ? "bg-green-100 text-green-800 border-2 border-green-300"
                      : "bg-red-100 text-red-800 border-2 border-red-300"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  <Calendar className="text-current" size={20} />
                  <div>
                    <p className="text-sm opacity-80">Next Payment</p>
                    <p className="font-medium">
                      {new Date(payment.nextExecution).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: new Date(payment.nextExecution).getFullYear() !== new Date().getFullYear()
                          ? "numeric"
                          : undefined,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="text-purple-600" size={16} />
                  <p className="text-sm font-medium text-gray-700">
                    {categoryList.length === 1 ? 'Category' : 'Categories'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoryList.map((category, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        isIncome
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <Tag size={10} />
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              {payment.description && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    Description
                  </p>
                  <p className="text-blue-700">{payment.description}</p>
                </div>
              )}

              {/* Settings */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Settings</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-blue-600" />
                    <span className="text-sm">Email Notifications</span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      payment.emailNotification
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {payment.emailNotification ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-orange-600" />
                    <span className="text-sm">Automatic Processing</span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      payment.automaticPayment
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {payment.automaticPayment ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => onEdit?.(payment.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => onDelete?.(payment.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentDetailsPopup;