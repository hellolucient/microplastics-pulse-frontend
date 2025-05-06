import React from 'react';
import { Link } from 'react-router-dom';

// Define colors for logo letters
const logoColors = [
  'text-red-500', 'text-orange-500', 'text-amber-500', 'text-yellow-400', 'text-lime-500',
  'text-green-500', 'text-emerald-500', 'text-teal-500', 'text-cyan-500', 'text-sky-500',
  'text-blue-600', 'text-indigo-500', 'text-violet-500', 'text-purple-500', 'text-fuchsia-500',
  'text-pink-500', 'text-rose-500'
];
const logoName = "MicroPlasticPulse";

const Header: React.FC = () => {
  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-900/10 h-20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" onClick={scrollToTop} className="font-bold text-xl tracking-tight no-underline">
            {/* Apply colors to each letter */}
            {logoName.split('').map((letter, index) => (
              <span key={index} className={logoColors[index % logoColors.length]}>{letter}</span>
            ))}
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" onClick={scrollToTop} className="text-base font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Home</Link>
          <Link to="/whitepaper" className="text-base font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Whitepaper</Link>
          <Link to="/latest-news" className="text-base font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Latest News</Link>
          <Link to="/shop" className="text-base font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Shop</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;