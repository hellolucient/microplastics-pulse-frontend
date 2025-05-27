import React, { useState, useEffect } from 'react';
import { NewsItem } from './NewsGlobe'; // Assuming NewsItem is exported from NewsGlobe
import NewsCard from './NewsCard';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface SearchResultsCarouselProps {
  results: NewsItem[];
  onClose: () => void; // Function to close the carousel
  onCardSelect: (item: NewsItem) => void; // Function to handle when a card is selected (e.g., for modal)
}

const SearchResultsCarousel: React.FC<SearchResultsCarouselProps> = ({ results, onClose, onCardSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset to first item if results change and current index is out of bounds
    setCurrentIndex(0);
  }, [results]);

  if (!results || results.length === 0) {
    return null; // Or some 'no results' message if preferred within the carousel UI
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % results.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + results.length) % results.length);
  };

  const currentItem = results[currentIndex];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60000] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="relative bg-slate-800/80 p-6 rounded-xl shadow-2xl w-full max-w-xl md:max-w-2xl flex flex-col items-center">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-300 hover:text-white z-10"
          aria-label="Close search results"
        >
          <X size={28} />
        </button>

        <h3 className="text-2xl font-semibold text-white mb-6">Search Results ({currentIndex + 1} of {results.length})</h3>

        <div className="relative w-full flex items-center justify-center px-10 md:px-12"> 
          {results.length > 1 && (
            <button 
              onClick={handlePrevious} 
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-slate-700/50 hover:bg-slate-600/70 rounded-full text-white shadow-md z-10"
              aria-label="Previous result"
            >
              <ChevronLeft size={30} />
            </button>
          )}

          {/* NewsCard takes up the central space */} 
          {/* We might need to adjust NewsCard for this context or wrap it */} 
          <div 
            className="w-[320px] h-[400px] cursor-pointer" // Fixed size for consistency in carousel
            onClick={() => onCardSelect(currentItem)} 
            title="View details"
          >
            <NewsCard item={currentItem} />
          </div>

          {results.length > 1 && (
            <button 
              onClick={handleNext} 
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-slate-700/50 hover:bg-slate-600/70 rounded-full text-white shadow-md z-10"
              aria-label="Next result"
            >
              <ChevronRight size={30} />
            </button>
          )}
        </div>
        
        {/* Optional: Add dots for navigation if many results */} 
        {results.length > 1 && results.length <= 7 && (
          <div className="flex justify-center mt-6 space-x-2">
            {results.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors
                            ${index === currentIndex ? 'bg-brand-blue' : 'bg-slate-600 hover:bg-slate-500'}`}
                aria-label={`Go to result ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsCarousel; 