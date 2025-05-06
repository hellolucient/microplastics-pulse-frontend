import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-brand-light border-t border-gray-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start mb-4 md:mb-0">
            <Link to="/" onClick={scrollToTop} className="font-semibold text-brand-darker hover:text-brand-blue transition-colors no-underline">
              MicroPlasticPulse
            </Link>
          </div>

          <nav className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mb-4 md:mb-0 md:ml-10">
            <Link to="/" onClick={scrollToTop} className="text-sm text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Home</Link>
            <Link to="/whitepaper" className="text-sm text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Whitepaper</Link>
            <Link to="/latest-news" className="text-sm text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Latest News</Link>
          </nav>

          <div className="text-center md:text-right">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} MicroPlastic Pulse
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;