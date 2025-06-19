import { api } from "./apiHelpers";

export const getAllCategoriesForUser = async () => {
  try {
    return await api.post("categories/getAllCategoriesForUser", {});
  } catch (error) {
    console.error("Error in getAllCategoriesForUser:", error);
    throw new Error("Failed to get all categories");
  }
};

export const createUserCategory = async (categoryName: string) => {
  try {
    return await api.post("categories/createUserCategory", { categoryName });
  } catch (error) {
    console.error("Error in createUserCategory frontedn service:", error);
    throw new Error("Failed to get user categories");
  }
};
