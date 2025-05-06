import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient'; // <-- Remove Supabase client import
import axios from 'axios'; // <-- Add axios import

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

const LatestNewsPage: React.FC = () => {
  // --- Component State ---
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Keep isLoading state
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Keep error state

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchNewsFromApi = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setNewsItems([]); // Clear previous items while loading

      try {
        const response = await axios.get<NewsItem[]>(`${BACKEND_URL}/api/latest-news`);
        // Assuming the API returns the array directly in response.data
        setNewsItems(response.data);
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

  // --- Removed old fetchNews function using Supabase ---

  return (
    // Use new brand colors
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 md:mb-12 text-brand-darker">Latest News</h1>

      {/* --- News List Display --- */}
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      )}
      {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}
      {!isLoading && !errorMessage && (
        <div className="max-w-3xl mx-auto space-y-8">
          {newsItems.length === 0 ? (
            <p className="text-center text-brand-dark">No news items found.</p>
          ) : (
            newsItems.map((item) => (
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
                 <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xl font-semibold mb-3 text-brand-darker hover:text-brand-blue transition-colors duration-150 no-underline"
                 >
                    {item.title || 'No Title'}
                 </a>
                {item.source && 
                    <p className="text-xs text-gray-500 mb-3">Source: {item.source}</p>}
                <p className="text-brand-dark text-base mb-5 line-clamp-4 flex-grow">{item.ai_summary || 'No summary available.'}</p>
                <a 
                  href={item.url} 
                  className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline mt-auto self-start transition-colors duration-150"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Read Full Article →
                </a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LatestNewsPage; 