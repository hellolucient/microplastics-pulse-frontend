import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  // Optional: Pass down a ref if NewsGlobe needs to interact with the input directly
  // inputRef?: React.RefObject<HTMLInputElement>; 
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
    // Optionally blur input after search
    // inputRef.current?.blur(); 
  };

  // Listen for Escape key to blur the input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFocused) {
        inputRef.current?.blur(); // Blur the input field
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocused]); // Re-run if isFocused changes

  return (
    <div 
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90000] transition-all duration-300 ease-in-out rounded-xl shadow-2xl
                  ${isFocused ? 'bg-green-600/50 backdrop-blur-md scale-105 ring-2 ring-emerald-400/70' : 'bg-green-700/30 backdrop-blur-sm scale-100'}`}
      style={{ width: 'clamp(280px, 40vw, 450px)' }} // Adjusted width and transparency
    >
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center w-full"
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search news, research, or keywords..."
          className={`w-full pl-12 pr-4 py-3 text-lg rounded-xl border-none focus:outline-none appearance-none
                      bg-transparent placeholder-green-200
                      ${isFocused ? 'text-white' : 'text-green-50'}`}
        />
        <button 
          type="submit" 
          className={`absolute left-0 top-0 bottom-0 flex items-center justify-center px-4 
                      ${isFocused ? 'text-emerald-300' : 'text-green-200 hover:text-emerald-300'}`}
          aria-label="Search"
        >
          <Search size={22} />
        </button>
      </form>
    </div>
  );
};

export default SearchBar; 