import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit, User, AtSign } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EditUserPopup from "./EditUserPopup";

const UserProfileCard: React.FC = () => {
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const handleEditUser = () => {
    setIsEditOpen(true);
  };

  const handleUserUpdated = (updatedData: any) => {
    console.log("User updated:", updatedData);
    setIsEditOpen(false);
  };

  if (!user) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
          isMobileView ? "p-4 mb-4" : "p-6 mb-6"
        }`}
      >
        {/* Background decorative elements */}
        <div
          className={`absolute top-0 right-0 bg-gradient-to-br from-blue-300 to-indigo-500 rounded-full opacity-20 ${
            isMobileView
              ? "w-12 h-12 -translate-y-6 translate-x-6"
              : "w-20 h-20 -translate-y-10 translate-x-10"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 bg-gradient-to-tr from-indigo-300 to-blue-500 rounded-full opacity-15 ${
            isMobileView
              ? "w-8 h-8 translate-y-4 -translate-x-4"
              : "w-16 h-16 translate-y-8 -translate-x-8"
          }`}
        ></div>

        <div className="relative z-10">
          <div className={`flex ${isMobileView ? "flex-col gap-4" : "flex-row items-center gap-6"}`}>
            {/* Profile Avatar */}
            <motion.div
              className={`${
                isMobileView ? "w-16 h-16 mx-auto" : "w-20 h-20"
              } bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                isMobileView ? "text-lg" : "text-2xl"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {user.firstName?.[0]}{user.lastName?.[0]}
            </motion.div>

            {/* User Information */}
            <div className={`flex-1 ${isMobileView ? "text-center" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`font-bold text-gray-900 ${isMobileView ? "text-lg" : "text-2xl"}`}>
                  {user.firstName} {user.lastName}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEditUser}
                  className={`bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all shadow-md flex items-center gap-1 ${
                    isMobileView ? "px-3 py-2 text-sm" : "px-4 py-2 text-sm"
                  }`}
                >
                  <Edit size={isMobileView ? 12 : 14} />
                  {!isMobileView && "Edit Profile"}
                </motion.button>
              </div>

              <div className={`grid ${isMobileView ? "grid-cols-1 gap-2" : "grid-cols-2 gap-4"}`}>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="bg-blue-100 rounded-lg p-1.5">
                    <AtSign size={isMobileView ? 12 : 14} className="text-blue-600" />
                  </div>
                  <span className={`${isMobileView ? "text-sm" : "text-base"}`}>
                    @{user.username}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="bg-indigo-100 rounded-lg p-1.5">
                    <User size={isMobileView ? 12 : 14} className="text-indigo-600" />
                  </div>
                  <span className={`${isMobileView ? "text-sm" : "text-base"}`}>
                    Member since {new Date(user.createdAt || Date.now()).getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <EditUserPopup
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={{ ...user, createdAt: user.createdAt?.toISOString() }}
        onSuccess={handleUserUpdated}
      />
    </>
  );
};

export default UserProfileCard;