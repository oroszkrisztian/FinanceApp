import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  ConfigProvider,
  message,
} from "antd";
import type { Dayjs } from "dayjs";
import { useAuth } from "../../context/AuthContext";




interface AddPaymentFormValues {
  onClose: () => void;
}

const AddPaymentForm: React.FC<AddPaymentFormValues> = ({ onClose }) => {
  const { user } = useAuth();
  
  const [date, setDate] = useState<Dayjs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);
    console.log("Form values:", values);
    try {
      const response = await fetch("http://localhost:3000/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          date: date ? date.format("YYYY-MM-DD") : null,
          cost: values.amount,
          currencyId: values.currency,
          userId: user?.id,
          emailNotification: values.emailNotification,
          automaticPayment: values.automaticPayment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment");
      }

      const data = await response.json();
      console.log("Payment created:", data);

      message.success("Payment created successfully!");

      onClose();
    } catch (error) {
      console.error("Error creating payment:", error);
      setError("Failed to create payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#000000",
          colorBgContainer: "#ffffff",
          colorText: "#000000",
          colorBorder: "#000000",
          colorTextBase: "#000000",
        },
        components: {
          Select: {
            optionSelectedBg: "#f3f4f6",
          },
        },
      }}
    >
      <div className="p-2 bg-white">
        <h2 className="text-xl font-semibold text-black mb-4">Add Payment</h2>
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            emailNotification: false, 
            automaticPayment: false, 
          }}
        >
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input className="w-full border border-black rounded-lg" />
          </Form.Item>
          <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
            <InputNumber className="w-full border border-black rounded-lg" />
          </Form.Item>
          <Form.Item
            label="Currency"
            name="currency"
            rules={[{ required: true }]}
          >
            <Select className="w-full border border-black rounded-lg">
              
            </Select>
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker
              className="w-full border border-black rounded-lg"
              onChange={(date) => setDate(date)}
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item
            label="Email Notification"
            name="emailNotification"
            valuePropName="checked"
          >
            <Switch className="bg-gray-300" />
          </Form.Item>
          <Form.Item
            label="Automatic Payment"
            name="automaticPayment"
            valuePropName="checked"
          >
            <Switch className="bg-gray-300" />
          </Form.Item>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button
              type="default"
              onClick={onClose}
              className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              loading={loading}
            >
              Add Payment
            </Button>
          </div>
        </Form>
      </div>
    </ConfigProvider>
  );
};

export default AddPaymentForm;