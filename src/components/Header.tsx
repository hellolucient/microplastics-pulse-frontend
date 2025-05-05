import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 h-20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl tracking-tight text-slate-900 no-underline">
             MicroPlastic<span className="text-blue-600">Pulse</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors no-underline">Home</Link>
          <Link to="/whitepaper" className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors no-underline">Whitepaper</Link>
          <Link to="/latest-news" className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors no-underline">Latest News</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;