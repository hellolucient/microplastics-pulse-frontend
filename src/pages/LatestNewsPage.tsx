import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react'; // Removed ListFilter icon
import fallbackPlaceholderImage from '../assets/fail whale elephant_404 overload.png'; // Import the placeholder

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

// Define NewsItem type locally
interface NewsItem {
  id: string | number; // Assuming id can be string or number from DB
  url: string;
  title: string;
  created_at: string; 
  published_date: string | null;
  ai_summary: string | null;
  ai_image_url?: string | null; // Added for AI generated image URL
  source?: string | null;
}

// chapterTitles constant REMOVED

// const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x250?text=News+Image"; // REMOVED - Unused

const STORIES_PER_PAGE = 10;

// Function to generate a placeholder URL with specific text (if you still want to use via.placeholder.com for some cases)
// const getPlaceholderImageUrl = (text: string, width: number = 400, height: number = 250) => {
//   return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
// };

interface NewsItemCardProps {
  item: NewsItem;
  isFeatured: boolean;
  onDoubleClick: () => void; // Added prop for double click
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({ item, isFeatured, onDoubleClick }) => {
  const imageUrl = item.ai_image_url || fallbackPlaceholderImage;
  const displayDate = item.published_date ? new Date(item.published_date) : new Date(item.created_at);
  const formattedDate = displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (isFeatured) {
    return (
      <div 
        className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col md:flex-row overflow-hidden mb-12 cursor-pointer" // Added cursor-pointer
        onDoubleClick={onDoubleClick} // Added double click handler
      >
        <div className="md:w-2/5 flex-shrink-0">
          <img 
            src={imageUrl}
            alt={item.title || 'News image'}
            className="w-full h-64 md:h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }} // Fallback for broken AI URL
          />
        </div>
        <div className="p-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{formattedDate}</span>
            {item.source && <span className="text-xs text-gray-500">Source: {item.source}</span>}
          </div>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-2xl md:text-3xl font-bold text-brand-darker mb-4 hover:text-brand-blue transition-colors duration-150 no-underline">
            {item.title || 'No Title'}
          </a>
          <p className="text-brand-dark text-base mb-6 flex-grow">{item.ai_summary || 'Summary unavailable.'}</p>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-base no-underline mt-auto self-start transition-colors duration-150">
            Read Full Article →
          </a>
        </div>
      </div>
    );
  }

  // Secondary story card (non-featured)
  return (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6 flow-root cursor-pointer" // Added cursor-pointer
      onDoubleClick={onDoubleClick} // Added double click handler
    >
      <img 
        src={imageUrl} 
        alt={item.title || 'News image'}
        className="float-left w-36 h-36 object-cover mr-4 mb-2 rounded"
        onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }}
      />
      <div className="flex flex-wrap items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{formattedDate}</span>
        {item.source && <span className="text-xs text-gray-500 truncate max-w-[60%]">Source: {item.source}</span>}
      </div>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-md md:text-lg font-semibold text-brand-darker mb-2 hover:text-brand-blue transition-colors duration-150 no-underline leading-tight block">
        {item.title || 'No Title'}
      </a>
      <p className="text-brand-dark text-sm mb-3 md:mb-4 break-words">
        {item.ai_summary || 'Summary unavailable.'}
      </p>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline block clear-left mt-2">
        Read Full Article →
      </a>
    </div>
  );
};

const LatestNewsPage: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageWindowStart, setPageWindowStart] = useState(1); // New state for pagination window
  const [activeCardId, setActiveCardId] = useState<string | number | null>(null); // State for active card modal

  useEffect(() => {
    const fetchNewsFromApi = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setNewsItems([]);
      try {
        const response = await axios.get<NewsItem[]>(`${BACKEND_URL}/api/latest-news`);
        setNewsItems(response.data || []);
        console.log("Fetched news items count:", (response.data || []).length);
      } catch (error) {
        console.error('Error fetching news from API:', error);
        let message = 'Failed to fetch news due to an unknown error.';
        if (error && typeof error === 'object') {
            let extracted = false;
            if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data) {
                const data = error.response.data as any;
                if (data.error) {
                    message = `Failed to fetch news: ${String(data.error)}`;
                    extracted = true;
                } else if (data.details) {
                    message = `Failed to fetch news: ${String(data.details)}`;
                    extracted = true;
                }
            }
            if (!extracted && 'message' in error) {
                message = `Failed to fetch news: ${String(error.message)}`;
            }
        }
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNewsFromApi();
  }, []);

  // Updated filteredNewsItems logic
  const filteredNewsItems = useMemo(() => {
    let itemsToFilter = newsItems;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (lowerCaseSearchTerm) {
      itemsToFilter = itemsToFilter.filter(item => {
        const title = item.title?.toLowerCase() || '';
        const summary = item.ai_summary?.toLowerCase() || '';
        const source = item.source?.toLowerCase() || '';
        return title.includes(lowerCaseSearchTerm) || 
               summary.includes(lowerCaseSearchTerm) ||
               source.includes(lowerCaseSearchTerm);
      });
    }
    return itemsToFilter;
  }, [newsItems, searchTerm]);

  // Pagination logic
  const totalStories = filteredNewsItems.length;
  const totalPages = totalStories <= 1
    ? 1
    : Math.ceil((totalStories - 1) / STORIES_PER_PAGE) + 1;

  // Get stories for current page
  let featuredStory: NewsItem | null = null;
  let secondaryStories: NewsItem[] = [];
  if (currentPage === 1) {
    featuredStory = filteredNewsItems[0] || null;
    secondaryStories = filteredNewsItems.slice(1, 1 + STORIES_PER_PAGE);
  } else {
    const startIdx = 1 + (currentPage - 2) * STORIES_PER_PAGE;
    secondaryStories = filteredNewsItems.slice(startIdx, startIdx + STORIES_PER_PAGE);
  }

  // Pagination controls
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const maxPagesToShow = 10; // Number of page links to show

  const handlePreviousBlock = () => {
    const newWindowStart = Math.max(1, pageWindowStart - maxPagesToShow);
    setPageWindowStart(newWindowStart);
    setCurrentPage(newWindowStart);
  };

  const handleNextBlock = () => {
    const newWindowStart = pageWindowStart + maxPagesToShow;
    if (newWindowStart <= totalPages) {
      setPageWindowStart(newWindowStart);
      setCurrentPage(newWindowStart);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="sticky top-20 z-20 bg-brand-light px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-darker pb-2">Latest News</h1>
          <div className="max-w-xl mx-auto">
            <label htmlFor="news-search" className="sr-only">Search News</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="search"
                    id="news-search"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); setPageWindowStart(1); }}
                    placeholder="Search news by title, summary, or source..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                />
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      )}
      {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}
      {!isLoading && !errorMessage && totalStories > 0 && (
        <>
          {/* Featured Story - only on page 1 and if search is not active or shows the first item */}
          {currentPage === 1 && featuredStory && (
            <NewsItemCard 
              item={featuredStory} 
              isFeatured={true} 
              onDoubleClick={() => setActiveCardId(featuredStory.id)} // Pass double click handler
            />
          )}

          {/* Grid for secondary stories */}
          <div className={`grid grid-cols-1 ${secondaryStories.length > 0 ? 'md:grid-cols-2' : ''} gap-6 ${currentPage === 1 && featuredStory ? 'mt-8' : 'mt-0'}`}>
            {secondaryStories.map(item => (
              <NewsItemCard 
                key={item.id || item.url} 
                item={item} 
                isFeatured={false} 
                onDoubleClick={() => setActiveCardId(item.id)} // Pass double click handler
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-wrap justify-center items-center mt-12 space-x-1 md:space-x-2">
            <button
              onClick={() => handlePreviousBlock()}
              disabled={pageWindowStart === 1}
              className={`px-3 py-1 rounded-md border text-sm font-medium ${pageWindowStart === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-brand-blue border-brand-blue hover:bg-brand-blue hover:text-white transition-colors duration-150'}`}
            >
              Previous
            </button>
            {
              (() => {
                const pageNumbers = [];
                const endPageForWindow = Math.min(totalPages, pageWindowStart + maxPagesToShow - 1);

                for (let i = pageWindowStart; i <= endPageForWindow; i++) {
                  pageNumbers.push(
                    <button
                      key={i}
                      onClick={() => goToPage(i)}
                      className={`px-3 py-1 rounded-md border text-sm font-medium ${currentPage === i ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-brand-blue border-brand-blue hover:bg-brand-blue hover:text-white transition-colors duration-150'}`}
                    >
                      {i}
                    </button>
                  );
                }
                return pageNumbers;
              })()
            }
            <button
              onClick={() => handleNextBlock()}
              disabled={pageWindowStart + maxPagesToShow > totalPages}
              className={`px-3 py-1 rounded-md border text-sm font-medium ${pageWindowStart + maxPagesToShow > totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-brand-blue border-brand-blue hover:bg-brand-blue hover:text-white transition-colors duration-150'}`}
            >
              Next
            </button>
          </div>
        </>
      )}
      {!isLoading && !errorMessage && totalStories === 0 && (
        <p className="text-center text-brand-dark">
          {searchTerm 
            ? `No news items found matching "${searchTerm}".` 
            : 'No news items found.'}
        </p>
      )}

      {/* Modal for Active Card */}
      {activeCardId && (() => {
        const activeItem = newsItems.find(news => news.id === activeCardId);
        if (!activeItem) return null;

        const modalImageUrl = activeItem.ai_image_url || fallbackPlaceholderImage;
        const modalDisplayDate = activeItem.published_date ? new Date(activeItem.published_date) : new Date(activeItem.created_at);
        const modalFormattedDate = modalDisplayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });


        return (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setActiveCardId(null)} // Close on backdrop click
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
            >
              <button 
                onClick={() => setActiveCardId(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
                aria-label="Close news details"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <img 
                src={modalImageUrl} 
                alt={activeItem.title || 'News image'} 
                className="w-full h-64 object-cover rounded-t-lg mb-4"
                onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }}
              />
              <h2 className="text-2xl md:text-3xl font-bold text-brand-darker mb-3">
                {activeItem.title || 'No Title'}
              </h2>
              <div className="flex flex-wrap items-center justify-between text-sm text-gray-500 mb-2">
                <span>{modalFormattedDate}</span>
                {activeItem.source && <span>Source: {activeItem.source}</span>}
              </div>
              <p className="text-brand-dark text-base leading-relaxed mb-6 whitespace-pre-line"> 
                {activeItem.ai_summary || 'Full summary unavailable.'}
              </p>
              <a 
                href={activeItem.url}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-md font-semibold text-brand-blue hover:text-sky-700 no-underline"
              >
                <span>Read full article on source</span>
                {/* Using a generic link icon, assuming lucide-react is available or add specific import */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default LatestNewsPage; 