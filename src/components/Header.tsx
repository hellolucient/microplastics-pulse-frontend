import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-100 h-16 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
          <Link to="/" className="font-medium no-underline text-gray-800">MicroPlastic Pulse</Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-gray-600 hover:text-gray-900 no-underline">Home</Link>
          <Link to="/whitepaper" className="text-gray-600 hover:text-gray-900 no-underline">Whitepaper</Link>
          <a href="#" className="text-gray-600 hover:text-gray-900">Latest Research</a>
          <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
        </nav>

        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          Subscribe
        </button>
      </div>
    </header>
  );
};

export default Header;