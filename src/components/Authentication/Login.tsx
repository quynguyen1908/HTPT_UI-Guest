import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button, Form } from 'antd';
import { login } from '../../api/auth';
import 'antd/dist/reset.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      await login(email, password);
      alert('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="bg-gray-100 h-screen flex justify-center items-center">
      <div className="flex flex-col items-center bg-white p-8 border border-gray-300 shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-4">Login</h1>
        <Form className="grid grid-cols-1 gap-2" onFinish={handleSubmit}>
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }]}
            className="w-full"
          >
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
            className="w-full"
          >
            <Input.Password
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" className="w-min place-self-center mb-4">
            Login
          </Button>
          <Link to="/signup" className="text-blue-500 hover:underline">
            Don't have an account? Register here.
          </Link>
        </Form>
      </div>
    </div>
  );
};

export default Login;
