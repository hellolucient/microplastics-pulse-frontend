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
              MicroplasticsWatch
            </Link>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} MicroplasticsWatch
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;