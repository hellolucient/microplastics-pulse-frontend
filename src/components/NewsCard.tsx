import React from 'react';
import { NewsItem } from './NewsGlobe'; // Import the NewsItem interface

interface NewsCardProps {
  item: NewsItem;
  isModalVersion?: boolean; // Optional prop for modal styling/behavior adjustments
}

const NewsCard: React.FC<NewsCardProps> = ({ item, isModalVersion }) => {
  // Function to format date, can be expanded later
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date N/A'; // Return 'Date N/A' if no date string
    try {
      return new Date(dateString).toLocaleDateString('en-GB', { // Example: DD/MM/YYYY
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Failed to parse date:", dateString, e);
      return 'Date Invalid'; // Fallback if parsing fails
    }
  };

  // Reverted to simpler whitespace normalization
  const processedTitle = item.title ? item.title.replace(/\s+/g, ' ').trim() : 'No Title';

  // State to track image loading errors
  const [imageError, setImageError] = React.useState(false);

  // Reset imageError when item changes (specifically, when ai_image_url changes)
  React.useEffect(() => {
    setImageError(false);
  }, [item.ai_image_url]);

  // Basic styles for the modal version, can be expanded
  const modalStyles: React.CSSProperties = isModalVersion ? {
    height: 'auto', // Auto height for modal content
    maxHeight: '80vh', // Max height to prevent overly long modals
    overflowY: 'auto' // Scroll if content exceeds max height
  } : {};

  return (
    <div 
      className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 m-2 grid grid-rows-[auto_1fr] ${isModalVersion ? '' : 'h-[400px]'}`}
      style={{ 
        width: isModalVersion ? '100%' : '320px', 
        ...modalStyles 
      }}
    >
      {/* Grid Row 1: Image */}
      {item.ai_image_url && !imageError ? (
        <img 
          src={item.ai_image_url} 
          alt={`${processedTitle}`}
          className={`w-full object-cover ${isModalVersion ? 'h-64 rounded-t-lg' : 'h-48 rounded-t-lg'}`}
          draggable="false"
          onError={() => setImageError(true)} // Set imageError to true on failure
        />
      ) : (
        <div className={`w-full bg-gray-200 flex items-center justify-center ${isModalVersion ? 'h-64 rounded-t-lg' : 'h-48 rounded-t-lg'}`}>
          <span className="text-gray-500">No Image Available</span>
        </div>
      )}
      {/* Grid Row 2: Text Content - this div will take remaining space and scroll */}
      <div 
        className="p-4 overflow-y-auto min-h-0" 
      >
        {/* Text content */}
        <p className="text-xs text-gray-500 mb-1">
          {formatDate(item.created_at)}
        </p>
        <h3 className="text-base font-semibold text-gray-800 mb-2">
          {processedTitle}
        </h3>
        <p 
          className="text-sm text-gray-600 mb-2"
          style={isModalVersion ? {} : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {item.ai_summary || 'No summary available.'}
        </p>
        {isModalVersion && item.url && (
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-2 inline-block"
          >
            Read full article
          </a>
        )}
      </div>
    </div>
  );
};

export default NewsCard; 