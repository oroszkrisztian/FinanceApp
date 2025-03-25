export const getAllSystemCategories = async () => {
  try {
    const response = await fetch(
      "http://localhost:3000/categories/getAllSystemCategories",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getAllSystemCategories:", error);
    throw new Error("Failed to get system categories");
  }
};
