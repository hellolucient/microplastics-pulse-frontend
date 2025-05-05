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
    // Use consistent max-width and padding
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 md:mb-12">Latest News</h1>

      {/* --- News List Display --- */}
      {/* Spinner (keep as is) */}
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {/* Error message (keep as is) */}
      {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}
      {!isLoading && !errorMessage && (
        // Use a slightly different max-width for the list itself if desired, or keep page max-width
        <div className="max-w-3xl mx-auto space-y-8">
          {newsItems.length === 0 ? (
            <p className="text-center text-slate-500">No news items found.</p>
          ) : (
            newsItems.map((item) => (
              // Apply card styling consistent with HomePage
              <div key={item.id} className="bg-white p-8 rounded-xl shadow-md border border-slate-100 flex flex-col">
                {/* Category/Date Area */}
                 <div className="flex items-center justify-between mb-3">
                    {(item.manual_category_override || item.ai_category) ? (
                        // Use subtle gray tag
                        <p className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">
                            {item.manual_category_override || item.ai_category}
                        </p>
                     ) : <div/> /* Empty div to keep space-between working */}
                     <p className="text-sm text-slate-500">
                        {item.published_date ? new Date(item.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                     </p>
                 </div>

                {/* Title */} 
                <h2 className="text-xl font-semibold mb-3 text-slate-900">{item.title || 'No Title'}</h2>
                
                {/* Source (Optional) */} 
                {item.source && 
                    <p className="text-xs text-slate-500 mb-3">Source: {item.source}</p>}

                {/* Summary */} 
                <p className="text-slate-600 text-base mb-5 line-clamp-4 flex-grow">{item.ai_summary || 'No summary available.'}</p>
                
                {/* Read More Link - standard text */}
                <a 
                  href={item.url} 
                  className="text-slate-700 hover:text-slate-900 hover:underline font-medium text-sm no-underline mt-auto self-start transition-colors duration-150"
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