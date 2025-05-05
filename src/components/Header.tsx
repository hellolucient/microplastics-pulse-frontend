import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-900/10 h-20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl tracking-tight text-brand-darker no-underline">
             MicroPlasticPulse 
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-base font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Home</Link>
          <Link to="/whitepaper" className="text-base font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Whitepaper</Link>
          <Link to="/latest-news" className="text-base font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Latest News</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;