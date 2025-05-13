import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react'; // Removed ListFilter icon

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

// Updated NewsItem interface
interface NewsItem {
  id: string;
  created_at: string;
  url: string;
  title: string | null;
  source: string | null;
  published_date: string | null;
  ai_summary: string | null;
  // ai_category and manual_category_override REMOVED
}

// chapterTitles constant REMOVED

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x250?text=News+Image";

const LatestNewsPage: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // selectedCategory state REMOVED

  useEffect(() => {
    const fetchNewsFromApi = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setNewsItems([]);
      try {
        const response = await axios.get<NewsItem[]>(`${BACKEND_URL}/api/latest-news`);
        setNewsItems(response.data || []);
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
    // Category filtering block REMOVED
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (lowerCaseSearchTerm) {
      itemsToFilter = itemsToFilter.filter(item => {
        const title = item.title?.toLowerCase() || '';
        const summary = item.ai_summary?.toLowerCase() || ''; // Keep summary in search
        const source = item.source?.toLowerCase() || '';
        return title.includes(lowerCaseSearchTerm) || 
               summary.includes(lowerCaseSearchTerm) ||
               source.includes(lowerCaseSearchTerm);
      });
    }
    return itemsToFilter;
  }, [newsItems, searchTerm]); // selectedCategory REMOVED from dependencies

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 md:mb-12 text-brand-darker">Latest News</h1>

      {/* Filter Controls - Category filter UI REMOVED, search input centered */}
      <div className="max-w-xl mx-auto mb-8"> {/* Simplified container, max-w-xl for centering search */}
        <div>
          <label htmlFor="news-search" className="sr-only">Search News</label>
          <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                  type="search"
                  id="news-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search news by title, summary, or source..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
              />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      )}
      {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}
      {!isLoading && !errorMessage && filteredNewsItems.length > 0 && (
        <>
          {/* Featured Story */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col md:flex-row overflow-hidden mb-12">
            <div className="md:w-2/5 flex-shrink-0">
              <img src={PLACEHOLDER_IMAGE} alt="News" className="w-full h-64 md:h-full object-cover" />
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {filteredNewsItems[0].published_date ? new Date(filteredNewsItems[0].published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date(filteredNewsItems[0].created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                {filteredNewsItems[0].source && <span className="text-xs text-gray-500">Source: {filteredNewsItems[0].source}</span>}
              </div>
              <a href={filteredNewsItems[0].url} target="_blank" rel="noopener noreferrer" className="text-2xl md:text-3xl font-bold text-brand-darker mb-4 hover:text-brand-blue transition-colors duration-150 no-underline">
                {filteredNewsItems[0].title || 'No Title'}
              </a>
              <p className="text-brand-dark text-base mb-6 flex-grow">{filteredNewsItems[0].ai_summary || 'Summary unavailable.'}</p>
              <a href={filteredNewsItems[0].url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-base no-underline mt-auto self-start transition-colors duration-150">
                Read Full Article →
              </a>
            </div>
          </div>
          {/* Secondary Stories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredNewsItems.slice(1, 5).map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col md:flex-row overflow-hidden">
                <div className="flex-shrink-0 w-full md:w-[140px] h-[140px] md:h-[140px] relative">
                  <img src={PLACEHOLDER_IMAGE} alt="News" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col p-6 min-w-0">
                  <div className="flex flex-wrap items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      {item.published_date ? new Date(item.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {item.source && <span className="text-xs text-gray-500 truncate max-w-[60%]">Source: {item.source}</span>}
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-brand-darker mb-2 hover:text-brand-blue transition-colors duration-150 no-underline">
                    {item.title || 'No Title'}
                  </a>
                  <p className="text-brand-dark text-sm mb-4 flex-grow break-words">{item.ai_summary || 'Summary unavailable.'}</p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline mt-auto self-start transition-colors duration-150">
                    Read Full Article →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {!isLoading && !errorMessage && filteredNewsItems.length === 0 && (
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