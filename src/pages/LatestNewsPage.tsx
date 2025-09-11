import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search, Grid3X3, List } from 'lucide-react';
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

// Define API response types
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface NewsApiResponse {
  data: NewsItem[];
  pagination: PaginationInfo;
}

// chapterTitles constant REMOVED

// const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x250?text=News+Image"; // REMOVED - Unused

const STORIES_PER_PAGE_GRID = 10;
const STORIES_PER_PAGE_LIST = 20;

// Function to generate a placeholder URL with specific text (if you still want to use via.placeholder.com for some cases)
// const getPlaceholderImageUrl = (text: string, width: number = 400, height: number = 250) => {
//   return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
// };

interface NewsItemCardProps {
  item: NewsItem;
  isFeatured: boolean;
}

interface ListViewItemProps {
  item: NewsItem;
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({ item, isFeatured }) => {
  const imageUrl = item.ai_image_url || fallbackPlaceholderImage;
  
  // Fix 1: Better date formatting (e.g., "31 August 2025")
  const displayDate = item.published_date ? new Date(item.published_date) : new Date(item.created_at);
  const formattedDate = displayDate.toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Fix 2: Extract domain from the actual article URL for cleaner source display
  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      // Remove 'www.' prefix if present
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      return domain;
    } catch {
      // Fallback if URL parsing fails
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
  };
  
  // Use the article URL (item.url) instead of the source field
  const cleanSource = item.url ? extractDomain(item.url) : null;
  
  // Fix 3: Remove HTML tags from title and summary
  const cleanText = (text: string): string => {
    return text.replace(/<[^>]*>/g, '');
  };

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
            {cleanSource && <span className="text-xs text-gray-500">Source: {cleanSource}</span>}
          </div>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-2xl md:text-3xl font-bold text-brand-darker mb-4 hover:text-brand-blue transition-colors duration-150 no-underline">
            {cleanText(item.title || 'No Title')}
          </a>
          <p className="text-brand-dark text-base mb-6 flex-grow">{cleanText(item.ai_summary || 'Summary unavailable.')}</p>
          <div className="mt-auto">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-base no-underline self-start transition-colors duration-150 block mb-4">
              Read Full Article →
            </a>
            <SocialShare 
              title={cleanText(item.title || 'Microplastics Research')}
              url={item.url}
              summary={cleanText(item.ai_summary || '')}
              storyId={item.id}
              imageUrl={item.ai_image_url}
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
        {cleanSource && <span className="text-xs text-gray-500 truncate max-w-[60%]">Source: {cleanSource}</span>}
      </div>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-md md:text-lg font-semibold text-brand-darker mb-2 hover:text-brand-blue transition-colors duration-150 no-underline leading-tight block">
        {cleanText(item.title || 'No Title')}
      </a>
      <p className="text-brand-dark text-sm mb-3 md:mb-4 break-words">
        {cleanText(item.ai_summary || 'Summary unavailable.')}
      </p>
      <div className="clear-left">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline block mb-3">
          Read Full Article →
        </a>
        <SocialShare 
          title={cleanText(item.title || 'Microplastics Research')}
          url={item.url}
          summary={cleanText(item.ai_summary || '')}
          storyId={item.id}
          imageUrl={item.ai_image_url}
          size="small"
          className="border-t border-gray-100 pt-3"
        />
      </div>
    </div>
  );
};

const ListViewItem: React.FC<ListViewItemProps> = ({ item }) => {
  const imageUrl = item.ai_image_url || fallbackPlaceholderImage;
  
  // Date formatting
  const displayDate = item.published_date ? new Date(item.published_date) : new Date(item.created_at);
  const formattedDate = displayDate.toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Extract domain from URL
  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      return domain;
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
  };
  
  const cleanSource = item.url ? extractDomain(item.url) : null;
  
  // Remove HTML tags
  const cleanText = (text: string): string => {
    return text.replace(/<[^>]*>/g, '');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <img 
          src={imageUrl} 
          alt={item.title || 'News image'}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 space-y-1 sm:space-y-0">
            <span className="text-xs text-gray-500">{formattedDate}</span>
            {cleanSource && <span className="text-xs text-gray-500 truncate">Source: {cleanSource}</span>}
          </div>
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-base sm:text-lg font-semibold text-brand-darker hover:text-brand-blue transition-colors duration-150 no-underline block mb-2 line-clamp-2"
          >
            {cleanText(item.title || 'No Title')}
          </a>
          <p className="text-brand-dark text-sm mb-3 line-clamp-2">
            {cleanText(item.ai_summary || 'Summary unavailable.')}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline self-start"
            >
              Read Full Article →
            </a>
            <SocialShare 
              title={cleanText(item.title || 'Microplastics Research')}
              url={item.url}
              summary={cleanText(item.ai_summary || '')}
              storyId={item.id}
              imageUrl={item.ai_image_url}
              size="small"
              className="self-start sm:self-auto"
            />
          </div>
        </div>
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // New state for view toggle

  useEffect(() => {
    // Sync search term from URL to state when URL changes (e.g., browser back/forward)
    const termFromUrl = getSearchTermFromUrl();
    if (termFromUrl !== searchTerm) {
      setSearchTerm(termFromUrl);
      setCurrentPage(1);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchAllNewsFromApi = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setNewsItems([]);
      try {
        // Try new paginated API format first
        const firstResponse = await axios.get(`${BACKEND_URL}/api/latest-news?page=1&limit=1000`);
        
        // Check if response is new paginated format
        if (firstResponse.data && typeof firstResponse.data === 'object' && 'data' in firstResponse.data) {
          const { data: firstPageData, pagination } = firstResponse.data;
          
          if (!Array.isArray(firstPageData)) {
            throw new Error('Expected data to be an array');
          }

          console.log("Using new paginated API format");
          console.log("Total articles in database:", pagination?.total);
          console.log("Total pages:", pagination?.totalPages);

          let allNewsItems = [...firstPageData];

          // If there are more pages, fetch them
          if (pagination?.totalPages > 1) {
            console.log(`Fetching additional pages (2 to ${pagination.totalPages})...`);
            
            for (let page = 2; page <= pagination.totalPages; page++) {
              try {
                const pageResponse = await axios.get(`${BACKEND_URL}/api/latest-news?page=${page}&limit=1000`);
                if (pageResponse.data && pageResponse.data.data && Array.isArray(pageResponse.data.data)) {
                  allNewsItems = [...allNewsItems, ...pageResponse.data.data];
                  console.log(`Fetched page ${page}: ${pageResponse.data.data.length} articles`);
                }
              } catch (pageError) {
                console.error(`Error fetching page ${page}:`, pageError);
                // Continue with other pages even if one fails
              }
            }
          }

          setNewsItems(allNewsItems);
          console.log("Total fetched articles:", allNewsItems.length);
          console.log("Expected total:", pagination?.total);
          
        } else if (Array.isArray(firstResponse.data)) {
          // Fallback to old API format (backward compatibility)
          console.log("Using legacy API format - pagination features may be limited");
          setNewsItems(firstResponse.data);
          console.log("Fetched news items count (legacy format):", firstResponse.data.length);
          
        } else {
          throw new Error('Invalid API response format');
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
    fetchAllNewsFromApi();
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
  const storiesPerPage = viewMode === 'grid' ? STORIES_PER_PAGE_GRID : STORIES_PER_PAGE_LIST;
  
  const totalPages = viewMode === 'grid' 
    ? (totalStories <= 1 ? 1 : Math.ceil((totalStories - 1) / storiesPerPage) + 1)
    : Math.ceil(totalStories / storiesPerPage);

  // Get stories for current page
  let featuredStory: NewsItem | null = null;
  let secondaryStories: NewsItem[] = [];
  let listStories: NewsItem[] = [];
  
  if (viewMode === 'grid') {
    if (currentPage === 1) {
      featuredStory = filteredNewsItems[0] || null;
      secondaryStories = filteredNewsItems.slice(1, 1 + storiesPerPage);
    } else {
      const startIdx = 1 + (currentPage - 2) * storiesPerPage;
      secondaryStories = filteredNewsItems.slice(startIdx, startIdx + storiesPerPage);
    }
  } else {
    // List view: no featured story, just paginated list
    const startIdx = (currentPage - 1) * storiesPerPage;
    listStories = filteredNewsItems.slice(startIdx, startIdx + storiesPerPage);
  }

  // Pagination controls
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Smart pagination for large datasets
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7; // Show up to 7 page numbers
    const sidePages = 2; // Pages to show on each side of current page
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      const current = currentPage;
      const total = totalPages;
      
      // Always show first page
      pages.push(1);
      
      if (current > sidePages + 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, current - sidePages);
      const end = Math.min(total - 1, current + sidePages);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== total) {
          pages.push(i);
        }
      }
      
      if (current < total - sidePages - 2) {
        pages.push('...');
      }
      
      // Always show last page (if more than 1 page)
      if (total > 1) {
        pages.push(total);
      }
    }
    
    return pages;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="sticky top-0 z-20 bg-brand-light px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-brand-darker">Research, Updates & News</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 hidden sm:block">View:</span>
              <div className="flex bg-white rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
                  className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 ${
                    viewMode === 'grid' 
                      ? 'bg-brand-blue text-white' 
                      : 'text-gray-600 hover:text-brand-blue hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => { setViewMode('list'); setCurrentPage(1); }}
                  className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 ${
                    viewMode === 'list' 
                      ? 'bg-brand-blue text-white' 
                      : 'text-gray-600 hover:text-brand-blue hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>
          </div>
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
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
          {viewMode === 'grid' ? (
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
            </>
          ) : (
            /* List view */
            <div className="space-y-4">
              {listStories.map(item => (
                <ListViewItem key={item.id || item.url} item={item} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col items-center mt-12 space-y-4">
            {/* Page Info */}
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * storiesPerPage) + 1} to {Math.min(currentPage * storiesPerPage, totalStories)} of {totalStories} articles
              {viewMode === 'grid' && currentPage === 1 && featuredStory && ` (${totalStories - 1} after featured story)`}
            </div>
            
            {/* Pagination Buttons */}
            <div className="flex flex-wrap justify-center items-center space-x-1 md:space-x-2">
              {/* First Page */}
              {totalPages > 1 && currentPage > 1 && (
                <button
                  onClick={handleFirstPage}
                  className="px-3 py-1 rounded-md border text-sm font-medium bg-white text-brand-blue border-brand-blue hover:bg-brand-blue hover:text-white transition-colors duration-150"
                >
                  First
                </button>
              )}
              
              {/* Previous Page */}
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md border text-sm font-medium ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-brand-blue border-brand-blue hover:bg-brand-blue hover:text-white transition-colors duration-150'}`}
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {generatePageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page as number)}
                    className={`px-3 py-1 rounded-md border text-sm font-medium ${currentPage === page ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-brand-blue border-brand-blue hover:bg-brand-blue hover:text-white transition-colors duration-150'}`}
                  >
                    {page}
                  </button>
                )
              ))}
              
              {/* Next Page */}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md border text-sm font-medium ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-brand-blue border-brand-blue hover:bg-brand-blue hover:text-white transition-colors duration-150'}`}
              >
                Next
              </button>
              
              {/* Last Page */}
              {totalPages > 1 && currentPage < totalPages && (
                <button
                  onClick={handleLastPage}
                  className="px-3 py-1 rounded-md border text-sm font-medium bg-white text-brand-blue border-brand-blue hover:bg-brand-blue hover:text-white transition-colors duration-150"
                >
                  Last
                </button>
              )}
            </div>
            
            {/* Quick Page Jump */}
            {totalPages > 10 && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                />
                <span className="text-gray-600">of {totalPages}</span>
              </div>
            )}
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