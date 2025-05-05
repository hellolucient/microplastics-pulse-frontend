import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start mb-4 md:mb-0">
            <Link to="/" className="font-medium text-slate-700 hover:text-slate-900 no-underline">
              MicroPlastic<span className="text-blue-600">Pulse</span>
            </Link>
          </div>

          <nav className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mb-4 md:mb-0 md:ml-10">
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors no-underline">Home</Link>
            <Link to="/whitepaper" className="text-sm text-slate-600 hover:text-slate-900 transition-colors no-underline">Whitepaper</Link>
            <Link to="/latest-news" className="text-sm text-slate-600 hover:text-slate-900 transition-colors no-underline">Latest News</Link>
          </nav>

          <div className="text-center md:text-right">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} MicroPlastic Pulse
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;