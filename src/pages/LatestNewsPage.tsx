import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Remove backend URL import if no longer needed here
// const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Remove Temporary Fetch Button State ---
  // const [isFetching, setIsFetching] = useState(false);
  // const [fetchMessage, setFetchMessage] = useState('');
  // --- End Remove ---

  // --- Data Fetching Effect ---
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Check if supabase client exists before using it
      if (!supabase) {
        throw new Error("Supabase client not initialized.");
      }
      const { data, error } = await supabase
        .from('latest_news')
        .select('*')
        // Order by published date (if available) descending, then creation date descending
        .order('published_date', { ascending: false, nullsFirst: false }) // Show newest first
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setNewsItems(data);
      }
    } catch (error: unknown) {
      console.error('Error fetching news from Supabase:', error);
      if (error instanceof Error) {
        setErrorMessage(`Failed to fetch news: ${error.message}`);
      } else {
        setErrorMessage('Failed to fetch news due to an unknown error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Remove Temporary Fetch Button Handler ---
  // const handleFetchClick = async () => { ... };
  // --- End Remove ---

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Latest News</h1>

      {/* --- Remove Temporary Fetch Button Section --- */}
      {/* <div className="mb-6 p-4 border rounded-lg bg-gray-50"> ... </div> */}
      {/* --- End Remove --- */}

      {/* --- News List Display --- */}
      {isLoading && <p>Loading news...</p>} 
      {errorMessage && <p className="text-red-600">{errorMessage}</p>}
      {!isLoading && !errorMessage && (
        <div className="space-y-6">
          {newsItems.length === 0 ? (
            <p>No news items found.</p>
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