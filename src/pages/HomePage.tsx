import React, { useState, useEffect } from 'react';
import { Newspaper, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
// import WhitepaperSection from '../components/WhitepaperSection'; // Remove unused import
import axios from 'axios'; // <-- Add axios
import mascotImage from '../assets/mascot-elephant.png'; // <-- Import the image

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

// --- Add Backend URL --- 
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
// --- End Backend URL ---

// Helper for placeholder image
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x250?text=News+Image";

const HomePage: React.FC = () => {
  // --- State for Latest News --- 
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  // --- End State ---

  // --- Effect to fetch latest news from API --- 
  useEffect(() => {
    const fetchLatestNewsFromApi = async () => {
      setNewsLoading(true);
      setNewsError(null);
      setLatestNews([]); // Clear previous items
      try {
        const response = await axios.get<NewsItem[]>(`${BACKEND_URL}/api/latest-news`);
        // Take only the first 3 items returned by the API
        setLatestNews(response.data.slice(0, 3)); 
      } catch (error: unknown) {
        console.error('Error fetching latest news for homepage:', error);
        let message = 'An unknown error occurred loading news.';
        // Use simplified error handling
        if (error && typeof error === 'object') {
            let extracted = false;
            if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data) {
                const data = error.response.data as any;
                if (data.error) {
                    message = `Failed to load news: ${String(data.error)}`;
                    extracted = true;
                } else if (data.details) {
                    message = `Failed to load news: ${String(data.details)}`;
                    extracted = true;
                }
            }
            if (!extracted && 'message' in error) {
                message = `Failed to load news: ${String(error.message)}`;
            }
        }
        setNewsError(message);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchLatestNewsFromApi();
  }, []);
  // --- End Effect ---

  return (
    <div className="bg-brand-light">
      {/* Hero Section - Logo instead of H1 text */}
      <section className="relative overflow-hidden bg-white pt-10 pb-10 md:pt-14 md:pb-14">
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
         <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
                {/* Text Content Area (Takes up more space on large screens) */}
                <div className="lg:col-span-7 text-center lg:text-left">
                    {/* Re-add H1 text, remove img */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-5 text-brand-darker"> 
                      MicroplasticsWatch
                    </h1>
                    <p className="text-xl text-brand-dark mb-10 max-w-2xl mx-auto lg:mx-0">
                      Welcome to MicroplasticsWatch, your dedicated source for the latest research, news, and insights into the world of microplastics. Our mission is to provide timely updates and comprehensive information to help you stay informed about this critical environmental and health issue.
                    </p>
                    {/* Buttons */} 
                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                      <Link 
                        to="/latest-news" 
                        className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-slate-300 bg-white text-brand-dark font-semibold text-lg shadow-sm hover:bg-gray-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-150 no-underline"
                      >
                        Latest News
                      </Link>
                    </div>
                </div>
                {/* Image Area (Takes up less space on large screens) */}
                <div className="mt-12 lg:mt-0 lg:col-span-5 flex justify-center">
                    <img 
                      src={mascotImage} 
                      alt="Elephant composed of microplastics illustration" 
                      className="w-full max-w-md lg:max-w-none rounded-lg object-contain" // Adjust max-w as needed
                    />
                </div>
            </div>
         </div>
      </section>

      {/* Whitepaper PDF Download Section - MOVED HERE */}
      <section className="bg-white pt-8 pb-16 md:pt-12 md:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-brand-darker">
            Download Our Comprehensive Whitepaper
          </h2>
          <p className="text-lg text-brand-dark mb-8 max-w-xl mx-auto">
            Get your copy of "Microplastics - the Elephant in the Wellness Room" to dive deeper into the research, impacts, and potential solutions.
          </p>
          <div className="flex justify-center">
            <a
              href="/Microplastics - the Elephant in the Wellness Room.pdf"
              download
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-brand-blue text-white font-semibold text-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-150 no-underline"
            >
              <FileText size={24} />
              Download PDF
            </a>
          </div>
        </div>
      </section>

      {/* Latest News Feature Cards - Magazine Top Stories Layout */}
      <section className="bg-brand-light py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12 md:mb-16 text-brand-darker">Top Stories</h2>
          {newsLoading && (
             <div className="flex justify-center items-center h-40">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
             </div>
          )}
          {newsError && <p className="text-center text-red-600">{newsError}</p>}
          {!newsLoading && !newsError && latestNews.length > 0 && (
            <>
              {/* Featured Story */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col md:flex-row overflow-hidden mb-12">
                <div className="md:w-2/5 flex-shrink-0">
                  <img src={PLACEHOLDER_IMAGE} alt="News" className="w-full h-64 md:h-full object-cover" />
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {latestNews[0].published_date ? new Date(latestNews[0].published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date(latestNews[0].created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {latestNews[0].source && <span className="text-xs text-gray-500">Source: {latestNews[0].source}</span>}
                  </div>
                  <a href={latestNews[0].url} target="_blank" rel="noopener noreferrer" className="text-2xl md:text-3xl font-bold text-brand-darker mb-4 hover:text-brand-blue transition-colors duration-150 no-underline">
                    {latestNews[0].title || 'No Title'}
                  </a>
                  <p className="text-brand-dark text-base mb-6 flex-grow">{latestNews[0].ai_summary || 'Summary unavailable.'}</p>
                  <a href={latestNews[0].url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-base no-underline mt-auto self-start transition-colors duration-150">
                    Read Full Article →
                  </a>
                </div>
              </div>
              {/* Secondary Stories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {latestNews.slice(1, 3).map((item) => (
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
          {!newsLoading && !newsError && latestNews.length === 0 && (
            <p className="text-center text-brand-dark">No recent news found.</p>
          )}
          {!newsLoading && !newsError && latestNews.length > 0 && (
            <div className="text-center mt-12 md:mt-16">
              <Link to="/latest-news" className="font-semibold text-base no-underline text-brand-blue hover:text-sky-700 transition-colors duration-150">
                View All News →
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage; 