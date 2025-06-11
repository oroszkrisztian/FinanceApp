import { getAuthHeaders, handleApiResponse } from "./apiHelpers";

export interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EditUserData {
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  password?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AvailabilityData {
  username?: string;
  email?: string;
}

export const getUser = async () => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/user/getUser",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      }
    );

    console.log("Get user response status:", response.status);
    const data = await handleApiResponse(response);
    
    console.log("Parsed data type:", typeof data);
    console.log("User data:", data);

    return data;
  } catch (error) {
    console.error(
      "Error /getUser in frontend userService.ts:",
      error
    );
    throw error;
  }
};

export const editUser = async (userData: EditUserData) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/user/editUser",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      }
    );

    console.log("Edit user response status:", response.status);
    const data = await handleApiResponse(response);
    
    console.log("Parsed data type:", typeof data);
    console.log("Updated user data:", data);

    return data;
  } catch (error) {
    console.error("Error editing user:", error);
    throw error;
  }
};

export const changePassword = async (passwordData: ChangePasswordData) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/user/changePassword",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData),
      }
    );

    console.log("Change password response status:", response.status);
    const data = await handleApiResponse(response);
    
    console.log("Parsed data type:", typeof data);
    console.log("Password change result:", data);

    return data;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

export const checkAvailability = async (availabilityData: AvailabilityData) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/user/checkAvailability",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(availabilityData),
      }
    );

    console.log("Check availability response status:", response.status);
    const data = await handleApiResponse(response);
    
    console.log("Parsed data type:", typeof data);
    console.log("Availability result:", data);

    return data;
  } catch (error) {
    console.error("Error checking availability:", error);
    throw error;
  }
};

export const updateUserProfile = async (userData: EditUserData) => {
  try {
    console.log("Updating user profile with data:", userData);
    
    const result = await editUser(userData);
    
    console.log("User profile updated successfully:", result);
    return result;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

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