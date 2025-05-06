import React, { useState, useEffect, useMemo } from 'react';
// import { supabase } from '../supabaseClient'; // <-- Remove Supabase client import
import axios from 'axios'; // <-- Add axios import
import { Search, ListFilter } from 'lucide-react'; // Add ListFilter icon

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'; // <-- Ensure backend URL is available

// Define the structure of a news item based on your Supabase table
interface NewsItem {
  id: string;
  created_at: string;
  url: string;
  title: string | null;
  source: string | null;
  published_date: string | null; // Or Date if you parse it
  ai_summary: string | null;
  ai_category: string | null;
  manual_category_override: string | null;
}

// Define chapter titles (categories) - Keep consistent with backend/homepage
const chapterTitles = [
  "Foreword",
  "Chapter 1: Microplastics and Human Health – Introduction",
  "Chapter 2: Pathways into Human Biology",
  "Chapter 3: Human Health Impacts of Microplastics",
  "Chapter 4: Environmental Context - Exposure Pathways and Contamination Sources",
  "Chapter 5: Wellness Industry Blindspot - Prevention, Reduction, and Wellness Programming",
  "Chapter 6: Framework for Action",
  "Chapter 7: Conclusion and Future Directions",
];

const LatestNewsPage: React.FC = () => {
  // --- Component State ---
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Keep isLoading state
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Keep error state
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // State for category filter

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchNewsFromApi = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setNewsItems([]); // Clear previous items while loading

      try {
        const response = await axios.get<NewsItem[]>(`${BACKEND_URL}/api/latest-news`);
        // Assuming the API returns the array directly in response.data
        setNewsItems(response.data || []);
      } catch (error) {
        console.error('Error fetching news from API:', error);
        let message = 'Failed to fetch news due to an unknown error.';
        // Simplified error message extraction
        if (error && typeof error === 'object') {
            let extracted = false;
            if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data) {
                const data = error.response.data as any; // Use any for simplicity here
                if (data.error) {
                    message = `Failed to fetch news: ${String(data.error)}`;
                    extracted = true;
                } else if (data.details) {
                    message = `Failed to fetch news: ${String(data.details)}`;
                    extracted = true;
                }
            }
            // Fallback to error message if specific fields weren't found or no response data
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
  }, []); // Empty dependency array means run once on mount

  // --- Filtered News Items (Combined Search and Category) ---
  const filteredNewsItems = useMemo(() => {
    let itemsToFilter = newsItems;

    // 1. Filter by Category
    if (selectedCategory) {
      itemsToFilter = itemsToFilter.filter(item => {
        const category = item.manual_category_override || item.ai_category;
        return category === selectedCategory;
      });
    }

    // 2. Filter by Search Term
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
  }, [newsItems, searchTerm, selectedCategory]);

  // --- Removed old fetchNews function using Supabase ---

  return (
    // Use new brand colors
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 md:mb-12 text-brand-darker">Latest News</h1>

      {/* --- Filter Controls --- */}
      <div className="max-w-3xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Input */}
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
                  placeholder="Search news..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
              />
          </div>
        </div>
        {/* Category Select */}
        <div>
            <label htmlFor="category-filter" className="sr-only">Filter by Category</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ListFilter className="h-5 w-5 text-gray-400" />
                </div>
                <select 
                    id="category-filter"
                    value={selectedCategory || ''} // Use empty string for "All Categories"
                    onChange={(e) => setSelectedCategory(e.target.value || null)} // Set to null if empty string selected
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm appearance-none"
                >
                    <option value="">All Categories</option>
                    {chapterTitles.map(title => (
                        <option key={title} value={title}>{title}</option>
                    ))}
                </select>
                 {/* Custom dropdown arrow */}
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                     <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                         <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 7.03 7.78a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l2.97-2.91a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
                     </svg>
                 </div>
            </div>
        </div>
      </div>

      {/* --- News List Display --- */}
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      )}
      {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}
      {!isLoading && !errorMessage && (
        <div className="max-w-3xl mx-auto space-y-8">
          {filteredNewsItems.length === 0 ? (
            <p className="text-center text-brand-dark">
              {searchTerm || selectedCategory 
                ? `No news items found matching the current filters.` 
                : 'No news items found.'}
            </p>
          ) : (
            filteredNewsItems.map((item) => (
              // Use new brand colors
              <div key={item.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg border border-gray-200 flex flex-col transition-shadow duration-200 group">
                 {/* Container for Category and Date - Stack vertically by default, row on medium+ */}
                 <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                    {(item.manual_category_override || item.ai_category) ? (
                        // Restore original padding and add self-start
                        <p className="text-xs text-brand-dark bg-gray-100 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide mb-1 md:mb-0 self-start">
                            {item.manual_category_override || item.ai_category}
                        </p>
                     ) : <div className="hidden md:block"/> /* Use hidden div to maintain alignment on md+ when no category */} 
                     {/* Date - smaller text, slightly less prominent */}
                     <p className="text-xs text-gray-500 mt-1 md:mt-0">
                        {item.published_date ? new Date(item.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                     </p>
                 </div>
                 {/* Make Title Clickable */}
                 <button
                    type="button"
                    onClick={() => { /* Placeholder - Modal was removed */ }}
                    className="text-xl font-semibold mb-3 text-brand-darker hover:text-brand-blue transition-colors duration-150 no-underline text-left p-0 bg-transparent border-none cursor-pointer"
                 >
                    {item.title || 'No Title'}
                 </button>
                {item.source && 
                    <p className="text-xs text-gray-500 mb-3">Source: {item.source}</p>}
                <p className="text-brand-dark text-base mb-5 line-clamp-4 flex-grow">{item.ai_summary || 'No summary available.'}</p>
                {/* Change Read Full Article to a button triggering the modal */}
                <button 
                  type="button"
                  onClick={() => { /* Placeholder - Modal was removed */ }}
                  className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline mt-auto self-start transition-colors duration-150 bg-transparent border-none p-0 cursor-pointer"
                >
                  Read Full Article →
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LatestNewsPage; 