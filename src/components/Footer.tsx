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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: MicroplasticsWatch */}
          <div className="flex justify-center md:justify-start">
            <Link to="/" onClick={scrollToTop} className="font-semibold text-brand-darker hover:text-brand-blue transition-colors no-underline">
              MicroplasticsWatch
            </Link>
          </div>

          {/* Center: Powered by Lucient */}
          <div className="flex justify-center items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-blue-400/25 animate-pulse" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400/20 animate-ping" style={{ animationDuration: '2.5s' }}></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400/30 animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '2.8s' }}></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-violet-400/20 animate-ping" style={{ animationDelay: '1.2s', animationDuration: '3.2s' }}></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-rose-400/25 animate-pulse" style={{ animationDelay: '1.8s', animationDuration: '2.7s' }}></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400/20 animate-ping" style={{ animationDelay: '2.1s', animationDuration: '3.5s' }}></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-teal-400/30 animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '2.9s' }}></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-pink-400/20 animate-ping" style={{ animationDelay: '3s', animationDuration: '3.1s' }}></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-yellow-400/50 animate-pulse" style={{ animationDelay: '3.5s', animationDuration: '2.6s' }}></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-400/45 animate-ping" style={{ animationDelay: '4s', animationDuration: '3.3s' }}></div>
            </div>
            <p className="text-xs text-gray-500 font-light">
              powered by{' '}
              <span className="font-medium text-gray-600">lucient</span>
            </p>
          </div>

          {/* Right: Copyright */}
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