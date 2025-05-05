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
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Latest News</h1>

      {/* --- News List Display --- */}
      {/* --- Spinner (Example using Tailwind) --- */}
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}
      {!isLoading && !errorMessage && (
        <div className="space-y-6">
          {newsItems.length === 0 ? (
            <p className="text-center text-gray-500">No news items found.</p>
          ) : (
            newsItems.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                {/* Prefer manual category, fallback to AI, then display nothing if neither */}
                {(item.manual_category_override || item.ai_category) && (
                    <p className="text-xs text-indigo-600 font-semibold uppercase mb-1">
                        {item.manual_category_override || item.ai_category}
                    </p>
                )}
                 <p className="text-sm text-gray-500 mb-1">
                    {item.published_date ? new Date(item.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {item.source && <span className="ml-2"> | Source: {item.source}</span>}
                 </p>
                <h2 className="text-xl font-semibold mb-2">{item.title || 'No Title'}</h2>
                <p className="text-gray-700 mb-3">{item.ai_summary || 'No summary available.'}</p>
                <a 
                  href={item.url} 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Read More
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