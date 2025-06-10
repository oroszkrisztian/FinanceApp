export const getAllCategoriesForUser = async (userId: number) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/categories/getAllCategoriesForUser",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getAllCategoriesForUser:", error);
    throw new Error("Failed to get all categories");
  }
};

export const createUserCategory = async (
  userId: number,
  categoryName: string
) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/categories/createUserCategory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, categoryName }),
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error in createUserCategory frontedn service:", error);
    throw new Error("Failed to get user categories");
  }
};
