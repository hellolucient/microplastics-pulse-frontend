import React, { useState, useEffect } from 'react';
import { CircleDot, Newspaper, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WhitepaperSection from '../components/WhitepaperSection'; // Path relative to src/pages/
import axios from 'axios'; // <-- Add axios
import mascotImage from '../assets/mascot-elephant.png'; // <-- Import the image

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
    <div className="bg-brand-light">
      {/* Hero Section - Modified Layout */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28">
         {/* Background Pattern */}
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
         {/* Content Container - Use Flex/Grid for side-by-side layout */} 
         <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
                {/* Text Content Area (Takes up more space on large screens) */}
                <div className="lg:col-span-7 text-center lg:text-left">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-brand-darker mb-5"> 
                      MicroPlasticPulse
                    </h1>
                    <p className="text-xl text-brand-dark mb-10 max-w-2xl mx-auto lg:mx-0">
                      Understanding the invisible threat. A living whitepaper on microplastics and human health.
                    </p>
                    {/* Buttons */} 
                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                      <Link 
                        to="/whitepaper" 
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-brand-blue text-white font-semibold text-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-150 no-underline"
                      >
                        <CircleDot size={20} />
                        Explore the Whitepaper
                      </Link>
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

      {/* Latest News Feature Cards - Use brand colors */}
      <section className="bg-brand-light py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12 md:mb-16 text-brand-darker">Latest Updates</h2>
          {newsLoading && (
             <div className="flex justify-center items-center h-40">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
             </div>
          )}
          {newsError && <p className="text-center text-red-600">{newsError}</p>}
          {!newsLoading && !newsError && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> 
              {latestNews.length === 0 ? (
                  <p className="text-center md:col-span-3 text-brand-dark">No recent news found.</p>
              ) : (
                  latestNews.map((item) => (
                      // Add subtle border, use brand colors
                      <div key={item.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg border border-gray-200 flex flex-col transition-shadow duration-200 group">
                          <Newspaper className="text-brand-blue mb-4 flex-shrink-0" size={24} /> 
                          <h3 className="text-lg font-semibold text-brand-darker mb-3">{item.title || 'No Title'}</h3> 
                          <p className="text-brand-dark text-sm mb-5 line-clamp-4 flex-grow">{item.ai_summary || 'Summary unavailable.'}</p> 
                           <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline mt-auto self-start transition-colors duration-150"
                           >
                               Read Full Article →
                           </a>
                      </div>
                  ))
              )}
              </div>
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

      {/* Whitepaper Sections */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4 text-brand-darker">The Whitepaper</h2> 
            <p className="text-lg text-brand-dark text-center mb-12">
              Explore our comprehensive analysis of microplastics, their impact on human health, and prevention strategies.
            </p>
            <div className="space-y-3">
              {chapterTitles.map((title, index) => {
                const anchorId = slugify(title); 
                return (
                  <Link 
                    to={`/whitepaper#${anchorId}`} 
                    key={index} 
                    // Hover uses brand blue subtle
                    className="block p-4 rounded-lg bg-gray-50 hover:bg-sky-50 border border-gray-200 hover:border-sky-300 transition-all duration-150 no-underline group"
                  >
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-brand-dark group-hover:text-brand-blue">{title}</span>
                        <ChevronRight size={20} className="text-gray-400 group-hover:text-brand-blue transition-transform duration-150 group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 