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
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  animationDuration: '3s',
                  background: `
                    conic-gradient(
                      from 0deg,
                      #3b82f6 0deg,
                      #06b6d4 30deg,
                      #10b981 60deg,
                      #8b5cf6 90deg,
                      #f43f5e 120deg,
                      #f59e0b 150deg,
                      #14b8a6 180deg,
                      #ec4899 210deg,
                      #eab308 240deg,
                      #ef4444 270deg,
                      #f97316 300deg,
                      #84cc16 330deg,
                      #6366f1 360deg
                    )
                  `
                }}
              ></div>
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