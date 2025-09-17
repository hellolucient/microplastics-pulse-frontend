import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search, Grid3X3, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import NewsItemCard from '../components/NewsItemCard';
import SocialShare from '../components/SocialShare';
import fallbackPlaceholderImage from '../assets/fail whale elephant_404 overload.png';

// Types
interface NewsItem {
  id: string;
  title: string;
  ai_summary: string;
  ai_image_url: string;
  url: string;
  source: string;
  processed_at: string;
  published_date?: string;
}

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

interface ListViewItemProps {
  item: NewsItem;
}

// Constants
const STORIES_PER_PAGE_GRID = 10;
const STORIES_PER_PAGE_LIST = 20;
const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

// List View Item Component
const ListViewItem: React.FC<ListViewItemProps> = ({ item }) => {
  const imageUrl = item.ai_image_url || fallbackPlaceholderImage;
  
  return (
    <div className="flex items-start space-x-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0">
        <img
          src={imageUrl}
          alt={item.title}
          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 mb-1">
          {item.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
          {item.ai_summary}
        </p>
        <div className="mb-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
          >
            Read Full Article
            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{item.source}</span>
          <span>{new Date(item.processed_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <SocialShare url={item.url} title={item.title} />
      </div>
    </div>
  );
};

// Pagination Component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const generatePageNumbers = () => {
    const maxVisiblePages = 7;
    const sidePages = 2;
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > sidePages + 2) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - sidePages);
      const end = Math.min(totalPages - 1, currentPage + sidePages);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - sidePages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={`px-3 py-2 rounded-md border ${
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : page === '...'
              ? 'border-gray-300 bg-white text-gray-500 cursor-default'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const LatestNewsPage: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const location = useLocation();

  // Get search term from URL
  const getSearchTermFromUrl = () => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get('q') || '';
  };

  // Initialize search term from URL
  useEffect(() => {
    const termFromUrl = getSearchTermFromUrl();
    if (termFromUrl !== searchTerm) {
      setSearchTerm(termFromUrl);
      setSearchInput(termFromUrl);
      setCurrentPage(1);
    }
  }, [location.search]);

  // Debounce search term - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch current page from API
  useEffect(() => {
    const fetchCurrentPageFromApi = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setNewsItems([]);
      
      try {
        let storiesPerPage = viewMode === 'grid' ? STORIES_PER_PAGE_GRID : STORIES_PER_PAGE_LIST;
        
        // For grid view, page 1 needs 11 items (1 featured + 10 regular)
        // Subsequent pages need 10 items each
        if (viewMode === 'grid' && currentPage === 1) {
          storiesPerPage = STORIES_PER_PAGE_GRID + 1; // 11 items for first page
        }
        
        let response;
        
        if (debouncedSearchTerm.trim()) {
          // Use search endpoint when there's a search term
          response = await axios.get<NewsApiResponse>(`${BACKEND_URL}/api/latest-news/search?q=${encodeURIComponent(debouncedSearchTerm)}&page=${currentPage}&limit=${storiesPerPage}`);
        } else {
          // Use regular endpoint when no search term
          response = await axios.get<NewsApiResponse>(`${BACKEND_URL}/api/latest-news?page=${currentPage}&limit=${storiesPerPage}`);
        }
        
        if (!response.data || typeof response.data !== 'object' || !('data' in response.data)) {
          throw new Error('Invalid API response format');
        }

        const { data: pageData, pagination } = response.data;
        if (!Array.isArray(pageData)) {
          throw new Error('Expected data to be an array');
        }

        console.log("Fetched page:", currentPage, "Articles:", pageData.length);
        console.log("Total articles in database:", pagination?.total);
        console.log("Total pages:", pagination?.totalPages);
        if (debouncedSearchTerm.trim()) {
          console.log("Search term:", debouncedSearchTerm);
        }

        setNewsItems(pageData);
        setTotalPages(pagination?.totalPages || 1);

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

    fetchCurrentPageFromApi();
  }, [currentPage, viewMode, debouncedSearchTerm]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle view mode changes
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    setCurrentPage(1); // Reset to first page when changing view
  };

  // Handle search
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  // Handle Enter key in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Get stories for current page
  let featuredStory: NewsItem | null = null;
  let secondaryStories: NewsItem[] = [];
  let listStories: NewsItem[] = [];
  
  if (viewMode === 'grid') {
    if (currentPage === 1) {
      featuredStory = newsItems[0] || null;
      secondaryStories = newsItems.slice(1, 1 + STORIES_PER_PAGE_GRID); // 10 secondary stories
    } else {
      // For page 2+: each page has 10 items
      secondaryStories = newsItems.slice(0, STORIES_PER_PAGE_GRID); // Take all 10 items from current page
    }
  } else {
    listStories = newsItems; // All items for list view
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading latest news...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading News</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Latest News</h1>
          <p className="text-gray-600">Stay updated with the latest microplastics research and news</p>
        </div>

        {/* Search Bar and View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <label htmlFor="news-search" className="sr-only">Search News</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="news-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search news by title, summary, or source..."
                className="block w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
              <button
                onClick={handleSearch}
                className="absolute inset-y-0 right-0 px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex justify-center sm:justify-end">
            <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200 flex">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grid View</span>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          <div className="space-y-8">
            {/* Featured Story (only on first page) */}
            {currentPage === 1 && featuredStory && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <NewsItemCard item={featuredStory} isFeatured={true} />
              </div>
            )}

            {/* Secondary Stories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {secondaryStories.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <NewsItemCard item={item} isFeatured={false} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {listStories.map((item) => (
              <ListViewItem key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMessage && newsItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {debouncedSearchTerm ? `No results found for "${debouncedSearchTerm}"` : 'No news articles found'}
            </h3>
            <p className="text-gray-600">
              {debouncedSearchTerm 
                ? 'Try adjusting your search terms or browse all articles.' 
                : 'There are currently no news articles available.'}
            </p>
            {debouncedSearchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* Page Info */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Page {currentPage} of {totalPages}
          {debouncedSearchTerm && <span> for "{debouncedSearchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default LatestNewsPage;
