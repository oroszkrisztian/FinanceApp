import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  AlertCircle,
  Edit,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
} from "lucide-react";
import { checkAvailability, editUser, changePassword } from "../../services/userService";

interface EditUserPopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email?: string;
    createdAt?: string;
  };
  onSuccess: (updatedData: any) => void;
}

const EditUserPopup: React.FC<EditUserPopupProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  // Profile form data
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    username: user.username || "",
    email: user.email || "",
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  // Enhanced mobile detection
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setError(null);
      setShowSuccessPopup(false);
      setFieldErrors({});
      setLoading(false);
      setActiveTab('profile');
    }
  }, [isOpen, user]);

  const handleInputChange = (field: string, value: string) => {
    if (activeTab === 'profile') {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      setPasswordData((prev) => ({ ...prev, [field]: value }));
    }
    setError(null);
    // Clear field-specific error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateProfileForm = async () => {
    const errors: {[key: string]: string} = {};

    // Basic validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Check availability if username or email changed
    if (!errors.username && formData.username !== user.username) {
      try {
        const availabilityResult = await checkAvailability({
          userId: user.id,
          username: formData.username
        });
        if (!availabilityResult.usernameAvailable) {
          errors.username = "Username is already taken";
        }
      } catch (err) {
        console.error("Error checking username availability:", err);
      }
    }

    if (!errors.email && formData.email && formData.email !== (user.email || "")) {
      try {
        const availabilityResult = await checkAvailability({
          userId: user.id,
          email: formData.email
        });
        if (!availabilityResult.emailAvailable) {
          errors.email = "Email is already taken";
        }
      } catch (err) {
        console.error("Error checking email availability:", err);
      }
    }

    return errors;
  };

  const validatePasswordForm = () => {
    const errors: {[key: string]: string} = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = "New password must be different from current password";
    }

    return errors;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      // Validate form
      const validationErrors = await validateProfileForm();
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        setLoading(false);
        return;
      }

      // Prepare data for API call
      const updateData = {
        userId: user.id,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
      };

      console.log("Submitting user update:", updateData);

      // Call the API
      const result = await editUser(updateData);

      console.log("User update successful:", result);

      // Call onSuccess with the updated data
      onSuccess({
        ...user,
        ...formData,
        updatedAt: new Date().toISOString(),
      });

      // Close the popup
      onClose();

    } catch (err) {
      console.error("Error updating user:", err);
      
      let errorMessage = "An unexpected error occurred while updating your profile";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      // Validate form
      const validationErrors = validatePasswordForm();
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        setLoading(false);
        return;
      }

      // Prepare data for API call
      const updateData = {
        userId: user.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };

      console.log("Submitting password change...");

      // Call the API
      const result = await changePassword(updateData);

      console.log("Password change successful:", result);

      // Reset password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Show success popup
      setShowSuccessPopup(true);
      
    } catch (err) {
      console.error("Error changing password:", err);
      
      let errorMessage = "An unexpected error occurred while changing your password";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canSubmitProfile = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.username.trim() &&
      (formData.firstName !== user.firstName ||
        formData.lastName !== user.lastName ||
        formData.username !== user.username ||
        formData.email !== (user.email || ""))
    );
  };

  const canSubmitPassword = () => {
    return (
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.confirmPassword &&
      passwordData.newPassword === passwordData.confirmPassword &&
      passwordData.newPassword.length >= 6
    );
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSuccessConfirm = () => {
    setShowSuccessPopup(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
              isMobileView
                ? "max-w-sm w-full max-h-[95vh]"
                : "max-w-md w-full max-h-[90vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              {/* Background elements */}
              <div className={`absolute top-0 right-0 bg-white/20 rounded-full ${isMobileView ? "w-12 h-12 -translate-y-6 translate-x-6" : "w-16 h-16 -translate-y-8 translate-x-8"}`}></div>
              <div className={`absolute bottom-0 left-0 bg-white/10 rounded-full ${isMobileView ? "w-8 h-8 translate-y-4 -translate-x-4" : "w-12 h-12 translate-y-6 -translate-x-6"}`}></div>
              <div className={`absolute bg-white/15 rounded-full ${isMobileView ? "top-2 left-16 w-6 h-6" : "top-2 left-16 w-8 h-8"}`}></div>
              <div className={`absolute bg-white/10 rounded-full ${isMobileView ? "bottom-2 right-12 w-4 h-4" : "bottom-2 right-12 w-6 h-6"}`}></div>

              <div className={`relative z-10 ${isMobileView ? "p-3" : "p-4"}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`bg-white text-blue-600 rounded-full shadow-lg ${isMobileView ? "p-1.5 w-7 h-7" : "p-1.5 w-10 h-10"} flex items-center justify-center`}>
                      {activeTab === 'profile' ? <Edit size={isMobileView ? 14 : 18} /> : <Shield size={isMobileView ? 14 : 18} />}
                    </div>
                    <div>
                      <h2 className={`font-semibold ${isMobileView ? "text-base" : "text-lg"}`}>
                        {activeTab === 'profile' ? 'Edit Profile' : 'Change Password'}
                      </h2>
                      <p className={`opacity-90 ${isMobileView ? "text-xs" : "text-sm"}`}>
                        {activeTab === 'profile' ? 'Update your personal information' : 'Update your account password'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={isMobileView ? 20 : 20} />
                  </motion.button>
                </div>

                {/* Tab Navigation */}
                <div className="flex mt-4 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'profile'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <User size={14} />
                      Profile
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'password'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Lock size={14} />
                      Password
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className={`${isMobileView ? "p-3" : "p-4"} flex-1 overflow-y-auto`}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2 mb-4 shadow-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {activeTab === 'profile' ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm ${
                            fieldErrors.firstName ? "border-red-300" : "border-gray-300"
                          }`}
                          placeholder="John"
                          required
                          disabled={loading}
                        />
                      </div>
                      {fieldErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm ${
                            fieldErrors.lastName ? "border-red-300" : "border-gray-300"
                          }`}
                          placeholder="Doe"
                          required
                          disabled={loading}
                        />
                      </div>
                      {fieldErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <div className="relative">
                      <AtSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm ${
                          fieldErrors.username ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="johndoe"
                        required
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.username && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm ${
                          fieldErrors.email ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="john.doe@example.com"
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Preview</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {formData.firstName?.[0]}{formData.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p className="text-xs text-blue-700">@{formData.username}</p>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm ${
                          fieldErrors.currentPassword ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="Enter current password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.currentPassword && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.currentPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => handleInputChange("newPassword", e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm ${
                          fieldErrors.newPassword ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="Enter new password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm ${
                          fieldErrors.confirmPassword ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="Confirm new password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Security Notice */}
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={14} className="text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Security Notice</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      Make sure your new password is strong and unique. Avoid using personal information or common words.
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className={`${isMobileView ? "p-3" : "p-4"} border-t bg-gray-50/50 flex gap-2`}>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={activeTab === 'profile' ? handleProfileSubmit : handlePasswordSubmit}
                disabled={activeTab === 'profile' ? !canSubmitProfile() || loading : !canSubmitPassword() || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    {activeTab === 'profile' ? 'Updating...' : 'Changing...'}
                  </>
                ) : (
                  <>
                    {activeTab === 'profile' ? <Edit size={16} /> : <Shield size={16} />}
                    {activeTab === 'profile' ? 'Save Changes' : 'Change Password'}
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Success Popup */}
          <AnimatePresence>
            {showSuccessPopup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-black bg-opacity-30"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
                    isMobileView ? "max-w-xs w-full" : "max-w-sm w-full"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Success Header */}
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white text-green-600 rounded-full p-2 shadow-lg">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Success!</h3>
                        <p className="text-green-100 text-sm">Password updated successfully</p>
                      </div>
                    </div>
                  </div>

                  {/* Success Content */}
                  <div className="p-4">
                    <p className="text-gray-700 text-sm mb-4">
                      Your password has been changed successfully. Your account is now more secure.
                    </p>
                    
                    <button
                      onClick={handleSuccessConfirm}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      OK
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditUserPopup;