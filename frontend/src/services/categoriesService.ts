export const getAllCategoriesForUser = async (userId:number) => {
  try {
    const response = await fetch(
      "http://localhost:3000/categories/getAllCategoriesForUser",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({userId})
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getAllCategoriesForUser:", error);
    throw new Error("Failed to get system categories");
  }
};
