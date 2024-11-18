import { useState } from "react";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Col, message } from "antd";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: string;
}

interface LoginSuccessResponse {
  user: User;
  token: string;
}

interface LoginErrorResponse {
  error: string;
}

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password
        }),
      });

      const data: LoginSuccessResponse | LoginErrorResponse = await response.json();

      if (response.ok && 'user' in data) {
        // This is a successful login
        const storage = values.remember ? localStorage : sessionStorage;
        storage.setItem('token', data.token);
        storage.setItem('user', JSON.stringify(data.user));
        
        message.success(`Welcome back, ${data.user.firstName}!`);
        navigate("/home");
      } else {
        // This is an error response
        message.error('error' in data ? data.error : "Login failed");
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    message.info("Forgot password feature coming soon!");
  };

  const handleRegister = () => {
    navigate("/signup");
  };

  return (
    <Form<LoginFormValues>
      name="login"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto bg-white p-6 sm:p-8 shadow-lg rounded-lg"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please input your Username!" }]}
      >
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          placeholder="Username or email"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-[#BFA55E]"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input.Password
          prefix={<LockOutlined className="text-gray-400" />}
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-[#BFA55E]"
        />
      </Form.Item>
      <Form.Item>
        <Col className="flex justify-between items-center">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-gray-600">Remember me</Checkbox>
          </Form.Item>
          <a
            className="text-[#BFA55E] hover:text-[#A88F4C]"
            onClick={handleForgotPassword}
          >
            Forgot password
          </a>
        </Col>
      </Form.Item>

      <Form.Item className="text-center">
        <Button
          className="w-full bg-[#BFA55E] text-white py-2 rounded-lg hover:bg-[#A88F4C] focus:outline-none focus:ring-2 focus:ring-[#BFA55E]"
          block
          type="primary"
          htmlType="submit"
          loading={loading}
        >
          Log in
        </Button>
        <div className="mt-3">
          or{" "}
          <a
            className="text-[#BFA55E] hover:text-[#A88F4C]"
            onClick={handleRegister}
          >
            Register now!
          </a>
        </div>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;