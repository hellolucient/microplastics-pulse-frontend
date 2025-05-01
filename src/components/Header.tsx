import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
          <span className="font-medium">MicroPlastic Pulse</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
          <a href="#" className="text-gray-600 hover:text-gray-900">Whitepaper</a>
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