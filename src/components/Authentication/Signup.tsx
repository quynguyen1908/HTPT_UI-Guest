import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../../api/auth';
import 'antd/dist/reset.css';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      await signup(email, password);
      alert('Registration successful!');
      navigate('/login');
    } catch (error) {
      alert('Error registering user');
    }
  };

  return (
    <div className="bg-gray-100 h-screen flex justify-center items-center">
      <div className="flex flex-col items-center bg-white p-8 border border-gray-300 shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-4">Register</h1>
        <Form className="grid grid-cols-1 gap-2" onFinish={handleSubmit}>
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }]}
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
          >
            <Input.Password
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" className="w-min place-self-center">
            Register
          </Button>
          <Link to="/login" className="text-blue-500 hover:underline">
            Already have an account? Login here
          </Link>
        </Form>
      </div>
    </div>
  );
};

export default Register;