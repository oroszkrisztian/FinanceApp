import { api } from "./apiHelpers";

export const getAllPaymentsUser = async () => {
  try {
    const data = await api.post("payment/getAllPayments", {});

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
    return await api.post("payment/createPayment", paymentData);
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const deletePayment = async (paymentId: number) => {
  try {
    return await api.delete("payment/deletePayment", {
      body: JSON.stringify({ paymentId }),
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};
