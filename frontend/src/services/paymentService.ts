import { getAuthHeaders, handleApiResponse } from "./apiHelpers";

export const getAllPaymentsUser = async () => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/payment/getAllPayments",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      }
    );

    console.log("Response status:", response.status);
    const data = await handleApiResponse(response);
    
    console.log("Parsed data type:", typeof data);
    console.log("Is array:", Array.isArray(data));
    console.log("Data length:", Array.isArray(data) ? data.length : "N/A");

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
  name: string;
  amount: number;
  description?: string;
  accountId: number;
  startDate: Date;
  frequency: string;
  emailNotification: boolean;
  notificationDay: number;
  automaticPayment: boolean;
  type: string;
  currency: string;
  categoriesId?: number[];
  paymentId?: number;
}) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/payment/createPayment",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData),
      }
    );

    console.log("Create payment response status:", response.status);
    return await handleApiResponse(response);
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const deletePayment = async (paymentId: number) => {
  try {
    const response = await fetch(
      "https://financeapp-bg0k.onrender.com/payment/deletePayment",
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ paymentId }),
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};