import React, { useState, useEffect } from 'react';
import { CircleDot, Newspaper, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WhitepaperSection from '../components/WhitepaperSection'; // Path relative to src/pages/
import axios from 'axios'; // <-- Add axios

// Define chapter titles for the homepage links
const chapterTitles = [
  "Chapter 1: Microplastics and Human Health – Introduction",
  "Chapter 2: Pathways into Human Biology",
  "Chapter 3: Human Health Impacts of Microplastics",
  "Chapter 4: Environmental Context: Exposure Pathways and Contamination Sources",
  "Chapter 5: Wellness Industry Blindspot – Prevention, Reduction, and Wellness Programming",
  "Chapter 6: Framework for Action",
  "Chapter 7: Conclusion and Future Directions",
  // "Chapter 8: Bibliography" // Removed Bibliography for now
];

// Simple function to create slugs (IDs) - General purpose
// Needs to match the slugify function in WhitepaperPage.tsx
const slugify = (text: string): string => {
  // // Match "Chapter ", followed by digits, followed by ":" at the start
  // const match = text.trim().match(/^Chapter\\s+(\\d+):/i); 
  // if (match && match[1]) {
  //   return match[1]; // Return just the number, e.g., "6"
  // }
  
  // // Fallback for titles that DON'T match "Chapter N:" (like Bibliography)
  // // Use the standard slugification logic here
  // return text
  //   .toLowerCase()
  //   .replace(/\s+/g, '-')
  //   .replace(/[^\w\-]+/g, '') // Keep word chars and hyphens
  //   .replace(/\-\-+/g, '-')   // Collapse multiple hyphens
  //   .replace(/^-+/, '')       // Trim leading hyphen
  //   .replace(/-+$/, '');      // Trim trailing hyphen

  // Revert to the general purpose slugify logic
   return text
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Keep word chars and hyphens
    .replace(/\-\-+/g, '-')      // Collapse multiple hyphens
    .replace(/^-+/, '')          // Trim leading hyphen
    .replace(/-+$/, '');         // Trim trailing hyphen
};

// --- Define NewsItem type (duplicate from LatestNewsPage for now, consider sharing later) ---
interface NewsItem {
  id: string;
  created_at: string;
  url: string;
  title: string | null;
  source: string | null;
  published_date: string | null; 
  ai_summary: string | null;
  ai_category: string | null;
  manual_category_override: string | null;
}
// --- End NewsItem type ---

// --- Add Backend URL --- 
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
// --- End Backend URL ---

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
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-24 md:py-32 text-center bg-white">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          MicroPlastic<span className="text-blue-600">Pulse</span>
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          A living whitepaper on the growing threat of microplastics to human health and wellbeing
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/whitepaper" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold text-base shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors no-underline"
          >
            <CircleDot size={20} />
            Read Whitepaper
          </Link>
          <Link 
            to="/latest-news" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-base shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors no-underline"
          >
            Latest News
          </Link>
        </div>
      </section>

      {/* Latest News Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* --- Loading Spinner / Error Handling --- */}
        {newsLoading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        {newsError && <p className="text-center text-red-600">{newsError}</p>}
        {!newsLoading && !newsError && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestNews.length === 0 ? (
                <p className="text-center md:col-span-3 text-slate-500">No recent news found.</p>
            ) : (
                latestNews.map((item) => (
                    <div key={item.id} className="bg-white p-8 rounded-xl shadow-md border border-slate-100 flex flex-col">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-5">
                            <Newspaper className="text-blue-600" size={22} />
                        </div>
                        <h3 className="text-lg font-semibold mb-3">{item.title || 'No Title'}</h3>
                        <p className="text-slate-600 text-sm mb-5 line-clamp-4 flex-grow">{item.ai_summary || 'Summary unavailable.'}</p>
                         <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm no-underline mt-auto self-start"
                         >
                             Read Full Article →
                         </a>
                    </div>
                ))
            )}
            </div>
        )}
        {/* Optional: Link to see all news */}
        {!newsLoading && !newsError && latestNews.length > 0 && (
             <div className="text-center mt-10">
                 <Link to="/latest-news" className="text-blue-600 hover:text-blue-800 font-semibold text-base no-underline">
                     View All News →
                 </Link>
             </div>
        )}
      </section>

      {/* Whitepaper Sections (Homepage version - Links) */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">The Whitepaper</h2> {/* Adjusted size/tracking */}
        <p className="text-lg text-slate-600 text-center mb-12">
          Explore our comprehensive analysis of microplastics, their impact on human health, and prevention strategies.
        </p>
        {/* Use simple links instead of WhitepaperSection component */}
        <div className="space-y-3">
          {chapterTitles.map((title, index) => {
            const anchorId = slugify(title); 
            return (
              <Link 
                to={`/whitepaper#${anchorId}`} 
                key={index} 
                className="block p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-colors no-underline group"
              >
                <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 group-hover:text-slate-900">{title}</span>
                    <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage; 