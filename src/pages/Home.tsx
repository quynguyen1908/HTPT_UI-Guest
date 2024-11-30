import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="bg-gray-100 h-screen flex justify-center items-center">
      <div className="flex flex-col items-center bg-white p-8 border border-gray-300 shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-4">Welcome to Server</h1>

        {/* Login */}
        <Link to="/login" className='mb-3'>
          <button className="w-24 place-self-center bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300">
            Login
          </button>
        </Link>

        {/* Sign up */}
        <Link to="/signup">
          <button className="w-24 place-self-center bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition duration-300">
            Sign up
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;