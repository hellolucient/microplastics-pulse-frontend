import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search } from 'lucide-react'; // Removed ListFilter icon
import fallbackPlaceholderImage from '../assets/fail whale elephant_404 overload.png'; // Import the placeholder
import SocialShare from '../components/SocialShare';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

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
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({ item, isFeatured }) => {
  const imageUrl = item.ai_image_url || fallbackPlaceholderImage;
  const displayDate = item.published_date ? new Date(item.published_date) : new Date(item.created_at);
  const formattedDate = displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (isFeatured) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col md:flex-row overflow-hidden mb-12">
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
          <div className="mt-auto">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-base no-underline self-start transition-colors duration-150 block mb-4">
              Read Full Article →
            </a>
            <SocialShare 
              title={item.title || 'Microplastics Research'}
              url={item.url}
              summary={item.ai_summary}
              size="medium"
              className="border-t border-gray-100 pt-4"
            />
          </div>
        </div>
      </div>
    );
  }

  // Secondary story card (non-featured)
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6 flow-root">
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
      <div className="clear-left">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline block mb-3">
          Read Full Article →
        </a>
        <SocialShare 
          title={item.title || 'Microplastics Research'}
          url={item.url}
          summary={item.ai_summary}
          size="small"
          className="border-t border-gray-100 pt-3"
        />
      </div>
    </div>
  );
};

const LatestNewsPage: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const location = useLocation();
  const getSearchTermFromUrl = () => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get('q') || '';
  };

  const [searchTerm, setSearchTerm] = useState(getSearchTermFromUrl());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageWindowStart, setPageWindowStart] = useState(1); // New state for pagination window

  useEffect(() => {
    // Sync search term from URL to state when URL changes (e.g., browser back/forward)
    const termFromUrl = getSearchTermFromUrl();
    if (termFromUrl !== searchTerm) {
      setSearchTerm(termFromUrl);
      setCurrentPage(1);
      setPageWindowStart(1);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchNewsFromApi = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setNewsItems([]);
      try {
        const response = await axios.get<NewsItem[]>(`${BACKEND_URL}/api/latest-news`);
        if (Array.isArray(response.data)) {
          setNewsItems(response.data);
          console.log("Fetched news items count:", response.data.length);
        } else {
          // The response was not an array. This is an unexpected API response.
          console.error('API Error: Expected an array of news items, but received:', response.data);
          setErrorMessage('Failed to fetch news: The server returned an unexpected response.');
        }
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-darker pb-2">Research, Updates & News</h1>
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
            <NewsItemCard item={featuredStory} isFeatured={true} />
          )}

          {/* Grid for secondary stories */}
          <div className={`grid grid-cols-1 ${secondaryStories.length > 0 ? 'md:grid-cols-2' : ''} gap-6 ${currentPage === 1 && featuredStory ? 'mt-8' : 'mt-0'}`}>
            {secondaryStories.map(item => (
              <NewsItemCard key={item.id || item.url} item={item} isFeatured={false} />
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
    </div>
  );
};

export default LatestNewsPage; 