import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to scroll to top and close mobile menu
  const handleLinkClick = () => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-900/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" onClick={handleLinkClick} className="flex items-center">
            <img src="/Microplastics Watch_verticle logo.png" alt="MicroplasticsWatch Logo" className="h-12 w-auto" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" onClick={handleLinkClick} className="text-sm font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Home</Link>
          <Link to="/latest-news" onClick={handleLinkClick} className="text-sm font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">News Archives</Link>
          <Link to="/research-library" onClick={handleLinkClick} className="text-sm font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Research Library</Link>
          <Link to="/contact" onClick={handleLinkClick} className="text-sm font-medium text-brand-dark hover:text-brand-blue transition-colors duration-150 no-underline">Contact</Link>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="text-brand-dark hover:text-brand-blue focus:outline-none">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            <Link to="/" onClick={handleLinkClick} className="block px-3 py-2 rounded-md text-base font-medium text-brand-dark hover:bg-gray-100 hover:text-brand-blue no-underline">Home</Link>
            <Link to="/latest-news" onClick={handleLinkClick} className="block px-3 py-2 rounded-md text-base font-medium text-brand-dark hover:bg-gray-100 hover:text-brand-blue no-underline">Latest News</Link>
            <Link to="/research-library" onClick={handleLinkClick} className="block px-3 py-2 rounded-md text-base font-medium text-brand-dark hover:bg-gray-100 hover:text-brand-blue no-underline">Research Library</Link>
            <Link to="/contact" onClick={handleLinkClick} className="block px-3 py-2 rounded-md text-base font-medium text-brand-dark hover:bg-gray-100 hover:text-brand-blue no-underline">Contact</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;