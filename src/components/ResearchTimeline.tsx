import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Clock, FileText, Users, Link as LinkIcon } from 'lucide-react';

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

// Updated ResearchTimelineProps (filterCategory removed)
interface ResearchTimelineProps {
  // filterCategory prop REMOVED. If needed for other purposes, it can be re-added.
  // For now, this component will display all news or a subset not based on category.
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

// Updated component signature (filterCategory removed)
const ResearchTimeline: React.FC<ResearchTimelineProps> = () => { 
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/latest-news?page=1&limit=1000`);
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          setAllNewsItems(response.data.data || []);
        } else {
          console.error('API Error: Expected paginated response with data property, but received:', response.data);
          setErrorMessage('Failed to load news: The server returned an unexpected response.');
        }
      } catch (error) {
        console.error('Error fetching news for timeline:', error);
        setErrorMessage('Failed to load relevant news items.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Updated filteredNewsItems logic - now it just returns all items (or a slice if desired)
  const filteredNewsItems = useMemo(() => {
    // No longer filtering by category. Returns all fetched news items.
    // If you want to limit the number, you can use .slice(), e.g., allNewsItems.slice(0, 10)
    return allNewsItems;
  }, [allNewsItems]); // filterCategory REMOVED from dependencies

  return (
    <div className="relative">
      {/* Optional: Add a subtle line if needed, or remove if space-y handles it */}
      {/* <div className="absolute left-4 top-0 h-full w-0.5 bg-blue-200" aria-hidden="true"></div> */}
      
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
          <p className="ml-3 text-brand-dark">Loading news timeline...</p>
        </div>
      )}
      
      {errorMessage && <p className="text-red-600 text-center py-10">{errorMessage}</p>}
      
      {!isLoading && !errorMessage && (
        <div className="space-y-8">
          {filteredNewsItems.length === 0 ? (
            // Updated message for no news
            <p className="text-center text-brand-dark py-10">
              No news items available at the moment.
            </p>
          ) : (
            filteredNewsItems.map((item) => (
              // Timeline item structure - adapt fields as needed
              <div key={item.id} className="relative">
                <div className="flex items-start">
                  {/* Icon */}
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-blue flex items-center justify-center z-10 border-4 border-white shadow">
                    <FileText size={15} className="text-white" />
                  </div>
                  {/* Content Box */}
                  <div className="ml-4 bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex-1 hover:shadow-md transition-shadow duration-150">
                    {/* Date Display */}
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Clock size={14} className="mr-1" />
                      <span>{item.published_date ? new Date(item.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {/* Title (Link) */}
                    <a 
                       href={item.url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-lg font-semibold text-gray-900 mb-1 hover:text-brand-blue transition-colors duration-150 no-underline block"
                     >
                       {item.title || 'No Title'}
                     </a>
                    {/* Source */}
                    {item.source && (
                       <div className="flex items-center text-xs text-gray-600 mb-3">
                         <Users size={12} className="mr-1" />
                         <span>Source: {item.source}</span>
                       </div>
                    )}
                    {/* Summary */}
                    <p className="text-gray-700 mb-3 text-sm line-clamp-3">{item.ai_summary || 'Summary unavailable.'}</p>
                    {/* Read Full Article Link */}
                    <a 
                      href={item.url}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-brand-blue hover:text-sky-700 no-underline"
                    >
                      <span>Read full article</span>
                      <LinkIcon size={14} className="ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ResearchTimeline;