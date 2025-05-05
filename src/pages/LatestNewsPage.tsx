import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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

  // --- Temporary Fetch Button State ---
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');
  // --- End Temporary Fetch Button State ---

  // --- Data Fetching Effect ---
  useEffect(() => {
    fetchNews();
  }, []); // Empty dependency array means run once on mount

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

  // --- Temporary Fetch Button Handler ---
  const handleFetchClick = async () => {
    setIsFetching(true);
    setFetchMessage('Fetching latest news...');
    try {
      // Assuming backend runs on localhost:3001
      const response = await fetch('http://localhost:3001/api/trigger-fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      setFetchMessage(result.message || 'Fetch completed successfully.');
      // --- Trigger a refresh of the news list after fetch --- 
      fetchNews(); 
      // --- End Trigger refresh ---
    } catch (error) {
      console.error('Error triggering fetch:', error);
      if (error instanceof Error) {
        setFetchMessage(`Error: ${error.message}`);
      } else {
        setFetchMessage('An unknown error occurred during fetch.');
      }
    } finally {
      setIsFetching(false);
    }
  };
  // --- End Temporary Fetch Button Handler ---

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Latest News</h1>

      {/* --- Temporary Fetch Button --- */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <button 
          onClick={handleFetchClick} 
          disabled={isFetching} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetching ? 'Fetching...' : 'Manually Fetch Latest News (Admin Test)'}
        </button>
        {fetchMessage && (
          <p className={`mt-3 text-sm ${fetchMessage.startsWith('Error:') ? 'text-red-600' : 'text-green-600'}`}>
            {fetchMessage}
          </p>
        )}
         <p className="mt-2 text-xs text-gray-500">This button calls the backend to search Google, process with AI, and save new items to the database.</p>
      </div>
      {/* --- End Temporary Fetch Button --- */}

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