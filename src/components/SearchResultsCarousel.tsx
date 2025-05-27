import React, { useState } from 'react'; // Import useState
import { NewsItem } from './NewsGlobe';
import NewsCard from './NewsCard';
import { X } from 'lucide-react';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow'; // If we use coverflow

// import required modules
import { Navigation, Pagination, EffectCoverflow, A11y } from 'swiper/modules';

interface SearchResultsCarouselProps {
  results: NewsItem[];
  onClose: () => void;
  onCardSelect: (item: NewsItem) => void;
}

const SearchResultsCarousel: React.FC<SearchResultsCarouselProps> = ({ results, onClose, onCardSelect }) => {
  const [activeIndex, setActiveIndex] = useState(0); // State for active slide index

  if (!results || results.length === 0) {
    // Consider a more explicit "No results found" message within the styled container
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60000] flex items-center justify-center p-4">
        <div className="relative bg-slate-800/80 p-6 rounded-xl shadow-2xl w-full max-w-md flex flex-col items-center">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-300 hover:text-white z-10"
            aria-label="Close search results"
          >
            <X size={28} />
          </button>
          <h3 className="text-xl font-semibold text-white mb-4">Search Results</h3>
          <p className="text-slate-300">No matching articles found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-blue-700/50 backdrop-blur-md z-[60000] flex flex-col items-center justify-center p-4 transition-opacity duration-300">
      {/* Close button at the top right of the screen, outside the Swiper container for better access */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-200 hover:text-white z-[60001] bg-slate-700/50 hover:bg-slate-600/70 p-2 rounded-full shadow-lg"
        aria-label="Close search results"
      >
        <X size={28} />
      </button>

      <Swiper
        effect={'coverflow'} // Enable coverflow effect
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'} // Adjust based on desired peek amount, 'auto' is good with coverflow
        loop={results.length > 2} // Loop if more than 2 slides, to avoid issues with fewer slides
        coverflowEffect={{
          rotate: 30,       // Rotation of side slides (further reduced)
          stretch: 0,       // Stretch space between slides (px) - reverted
          depth: 60,       // Depth offset of side slides (significantly reduced to bring them closer)
          modifier: 1,      // Effect multiplier
          slideShadows: true,
        }}
        pagination={results.length > 1 ? { clickable: true, dynamicBullets: true } : false}
        navigation={results.length > 1}
        modules={[EffectCoverflow, Pagination, Navigation, A11y]}
        className="w-full max-w-4xl py-8" // Adjust max-width as needed, py for pagination space
        style={{ overflow: 'visible' }} // Important for seeing shadows or parts of slides outside main Swiper box if not using coverflow shadows
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)} // Update activeIndex on slide change
      >
        {results.map((item, index) => (
          <SwiperSlide 
            key={item.id || index} 
            onClick={() => onCardSelect(item)} // Make the whole slide clickable for selection
            className="flex justify-center items-center group"
            style={{ 
                width: '320px', // Explicit width for the slide content (NewsCard)
                height: '420px' // Explicit height + some padding for shadows/effects
            }}
          >
            {/* Apply scaling to non-active slides for coverflow peek effect */}
            {(swiper) => (
                <div className={`transition-transform duration-300 ease-out ${swiper.isActive ? 'scale-100' : 'scale-90 opacity-70 group-hover:opacity-90 group-hover:scale-95'}`}>
                    <NewsCard item={item} />
                </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      {results.length > 0 && (
        <p className="text-slate-300 text-sm mt-2">
          {results.length === 1 
            ? "1 result found." 
            : `Viewing ${activeIndex + 1} of ${results.length} results.`}
        </p>
      )}
    </div>
  );
};

export default SearchResultsCarousel; 