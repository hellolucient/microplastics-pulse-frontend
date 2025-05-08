import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-900/10 h-20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" onClick={scrollToTop} className="flex items-center">
            <img src="/MicroPlasticsWatch-logo.png" alt="MicroplasticsWatch Logo" className="h-20 w-auto" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" onClick={scrollToTop} className="text-base font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Home</Link>
          <Link to="/latest-news" className="text-base font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Latest News</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;