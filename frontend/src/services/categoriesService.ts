import { getAuthHeaders, handleApiResponse } from "./apiHelpers";

export const getAllCategoriesForUser = async () => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/categories/getAllCategoriesForUser",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      }
    );
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error("Error in getAllCategoriesForUser:", error);
    throw new Error("Failed to get all categories");
  }
};

export const createUserCategory = async (categoryName: string) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/categories/createUserCategory",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ categoryName }),
      }
    );
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error("Error in createUserCategory frontedn service:", error);
    throw new Error("Failed to get user categories");
  }
};