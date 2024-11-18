import { useState } from "react";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: string;
}

interface SignupFormValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: SignupFormValues) => {
    if (values.password !== values.confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          email: values.email,
          password: values.password
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        message.success("Registration successful! Please log in.");
        navigate("/home");
      } else {
        message.error(data.error || "Registration failed");
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <Form<SignupFormValues>
      form={form}
      name="signup"
      onFinish={onFinish}
      className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto bg-white p-6 sm:p-8 shadow-lg rounded-lg"
    >
      {/* First Name */}
      <Form.Item
        name="firstName"
        rules={[{ required: true, message: "Please input your First Name!" }]}
      >
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          placeholder="First Name"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-[#BFA55E]"
        />
      </Form.Item>

      {/* Last Name */}
      <Form.Item
        name="lastName"
        rules={[{ required: true, message: "Please input your Last Name!" }]}
      >
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          placeholder="Last Name"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-[#BFA55E]"
        />
      </Form.Item>

      {/* Username */}
      <Form.Item
        name="username"
        rules={[
          { required: true, message: "Please input your Username!" },
          { min: 3, message: "Username must be at least 3 characters!" }
        ]}
      >
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          placeholder="Username"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-[#BFA55E]"
        />
      </Form.Item>

      {/* Email */}
      <Form.Item
        name="email"
        rules={[
          { required: true, message: "Please input your Email!" },
          { type: "email", message: "Please enter a valid email address!" }
        ]}
      >
        <Input
          prefix={<MailOutlined className="text-gray-400" />}
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-[#BFA55E]"
        />
      </Form.Item>

      {/* Password */}
      <Form.Item
        name="password"
        rules={[
          { required: true, message: "Please input your Password!" },
          { min: 6, message: "Password must be at least 6 characters!" }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined className="text-gray-400" />}
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-[#BFA55E]"
        />
      </Form.Item>

      {/* Confirm Password */}
      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: "Please confirm your Password!" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Passwords do not match!'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined className="text-gray-400" />}
          placeholder="Confirm Password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-[#BFA55E]"
        />
      </Form.Item>

      {/* Submit Button */}
      <Form.Item className="text-center">
        <Button
          className="w-full bg-[#BFA55E] text-white py-2 rounded-lg hover:bg-[#A88F4C] focus:outline-none focus:ring-2 focus:ring-[#BFA55E]"
          block
          type="primary"
          htmlType="submit"
          loading={loading}
        >
          Sign Up
        </Button>
        <div className="mt-3">
          Already have an account?{" "}
          <a
            className="text-[#BFA55E] hover:text-[#A88F4C]"
            onClick={handleLogin}
          >
            Log in now!
          </a>
        </div>
      </Form.Item>
    </Form>
  );
};

export default SignupForm;