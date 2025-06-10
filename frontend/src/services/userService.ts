// Interface for user data
export interface UserData {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // Interface for edit user data
  export interface EditUserData {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email?: string;
    password?: string;
  }
  
  // Interface for password change
  export interface ChangePasswordData {
    userId: number;
    currentPassword: string;
    newPassword: string;
  }
  
  // Interface for availability check
  export interface AvailabilityData {
    userId: number;
    username?: string;
    email?: string;
  }
  
  // Get user by ID
  export const getUser = async (userId: number) => {
    try {
      const response = await fetch(
        "https://financeapp-bg0k.onrender.com/user/getUser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );
  
      console.log("Get user response status:", response.status);
      const responseText = await response.text();
      console.log("Raw response text:", responseText);
  
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed data type:", typeof data);
        console.log("User data:", data);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Failed to parse server response");
      }
  
      if (!response.ok) {
        throw new Error(
          (typeof data === "object" && data?.error) ||
          "Failed to get user"
        );
      }
  
      return data;
    } catch (error) {
      console.error(
        "Error /getUser in frontend userService.ts:",
        error
      );
      throw error;
    }
  };
  
  // Edit user profile
  export const editUser = async (userData: EditUserData) => {
    try {
      const response = await fetch(
        "https://financeapp-bg0k.onrender.com/user/editUser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );
  
      console.log("Edit user response status:", response.status);
      const responseText = await response.text();
      console.log("Raw response text:", responseText);
  
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed data type:", typeof data);
        console.log("Updated user data:", data);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Failed to parse server response");
      }
  
      if (!response.ok) {
        throw new Error(
          (typeof data === "object" && data?.error) || "Failed to edit user"
        );
      }
  
      return data;
    } catch (error) {
      console.error("Error editing user:", error);
      throw error;
    }
  };
  
  // Change password
  export const changePassword = async (passwordData: ChangePasswordData) => {
    try {
      const response = await fetch(
        "https://financeapp-bg0k.onrender.com/user/changePassword",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordData),
        }
      );
  
      console.log("Change password response status:", response.status);
      const responseText = await response.text();
      console.log("Raw response text:", responseText);
  
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed data type:", typeof data);
        console.log("Password change result:", data);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Failed to parse server response");
      }
  
      if (!response.ok) {
        throw new Error(
          (typeof data === "object" && data?.error) || "Failed to change password"
        );
      }
  
      return data;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  };
  
  // Check username/email availability
  export const checkAvailability = async (availabilityData: AvailabilityData) => {
    try {
      const response = await fetch(
        "https://financeapp-bg0k.onrender.com/user/checkAvailability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(availabilityData),
        }
      );
  
      console.log("Check availability response status:", response.status);
      const responseText = await response.text();
      console.log("Raw response text:", responseText);
  
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed data type:", typeof data);
        console.log("Availability result:", data);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Failed to parse server response");
      }
  
      if (!response.ok) {
        throw new Error(
          (typeof data === "object" && data?.error) || "Failed to check availability"
        );
      }
  
      return data;
    } catch (error) {
      console.error("Error checking availability:", error);
      throw error;
    }
  };
  
  // Update user in context/state (utility function for frontend)
  export const updateUserProfile = async (userData: EditUserData) => {
    try {
      console.log("Updating user profile with data:", userData);
      
      // Call the edit user API
      const result = await editUser(userData);
      
      console.log("User profile updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };
  
  // Validate user data before sending (utility function)
  export const validateUserData = (userData: Partial<EditUserData>) => {
    const errors: string[] = [];
  
    if (userData.firstName && userData.firstName.trim().length < 2) {
      errors.push("First name must be at least 2 characters long");
    }
  
    if (userData.lastName && userData.lastName.trim().length < 2) {
      errors.push("Last name must be at least 2 characters long");
    }
  
    if (userData.username && userData.username.trim().length < 3) {
      errors.push("Username must be at least 3 characters long");
    }
  
    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push("Invalid email format");
    }
  
    if (userData.password && userData.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
  
    return {
      isValid: errors.length === 0,
      errors    
    };
  };