export const getAllPaymentsUser = async (userId: number) => {
  try {
    const response = await fetch(
      "http://localhost:3000/payment/getAllPayments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    console.log("Response status:", response.status);
    const responseText = await response.text();
    console.log("Raw response text:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Parsed data type:", typeof data);
      console.log("Is array:", Array.isArray(data));
      console.log("Data length:", Array.isArray(data) ? data.length : "N/A");
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      throw new Error("Failed to parse server response");
    }

    if (!response.ok) {
      throw new Error(
        (typeof data === "object" && data?.error) ||
          "Failed to get all payemnts"
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Error /getAllPayments in frontend paymentService.ts:",
      error
    );
    throw error;
  }
};

export const createPayment = async (paymentData: {
  userId: number;
  name: string;
  amount: number;
  description?: string;
  accountId: number;
  startDate: Date,
  frequency: string;
  emailNotification: boolean;
  notificationDay : number,
  automaticPayment: boolean;
  type: string;
  currency: string;
  categoriesId?: number[];
}) => {
  try {
    const response = await fetch(
      "http://localhost:3000/payment/createPayment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      }
    );

    console.log("Create payment response status:", response.status);
    const responseText = await response.text();
    console.log("Raw response text:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      throw new Error("Failed to parse server response");
    }

    if (!response.ok) {
      throw new Error(
        (typeof data === "object" && data?.error) || "Failed to create payment"
      );
    }

    return data;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const deletePayment = async (userId: number, paymentId: number) => {
  try {
    const response = await fetch(
      "http://localhost:3000/payment/deletePayment",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, paymentId }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Failed to delete payment");
    }
    return data;
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};
