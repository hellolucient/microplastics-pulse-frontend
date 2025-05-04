import React, { useState, useEffect } from 'react';
import { CircleDot, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import WhitepaperSection from '../components/WhitepaperSection'; // Path relative to src/pages/
import { createClient } from '@supabase/supabase-js'; // Import Supabase

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

// --- Initialize Supabase client --- 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('HomePage: Supabase URL or Anon Key is missing.');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// --- End Supabase client ---

const HomePage: React.FC = () => {
  // --- State for Latest News --- 
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  // --- End State ---

  // --- Effect to fetch latest news --- 
  useEffect(() => {
    const fetchLatestNews = async () => {
      setNewsLoading(true);
      setNewsError(null);
      try {
        const { data, error } = await supabase
          .from('latest_news')
          .select('*')
          .order('published_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(3); // Limit to 3 results

        if (error) throw error;
        if (data) setLatestNews(data);

      } catch (error: unknown) {
        console.error('Error fetching latest news for homepage:', error);
        if (error instanceof Error) {
             setNewsError(`Failed to load news: ${error.message}`);
        } else {
            setNewsError('An unknown error occurred loading news.');
        }
      } finally {
        setNewsLoading(false);
      }
    };

    fetchLatestNews();
  }, []);
  // --- End Effect ---

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="py-24 text-center bg-gradient-to-b from-[#F8FAFC] to-white">
        <h1 className="text-5xl font-bold mb-4">
          MicroPlastic<span className="text-[#3B82F6]">Pulse</span>
        </h1>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          A living whitepaper on the growing threat of microplastics to human health and wellbeing
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/whitepaper" className="bg-[#3B82F6] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors no-underline">
            <CircleDot size={20} />
            Read Whitepaper
          </Link>
          <Link to="/latest-news" className="bg-white text-gray-800 px-6 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors no-underline">
            Latest News
          </Link>
        </div>
      </section>

      {/* Latest News Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        {newsLoading && <p className="text-center">Loading latest news...</p>}
        {newsError && <p className="text-center text-red-600">{newsError}</p>}
        {!newsLoading && !newsError && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.length === 0 ? (
                <p className="text-center md:col-span-3">No recent news found.</p>
            ) : (
                latestNews.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Newspaper className="text-blue-500" size={20} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 flex-grow">{item.title || 'No Title'}</h3>
                        <p className="text-gray-600 text-sm mb-4 flex-grow">{item.ai_summary || 'Summary unavailable.'}</p>
                         <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium mt-auto text-sm no-underline"
                         >
                             Read Full Article
                         </a>
                    </div>
                ))
            )}
            </div>
        )}
        {/* Optional: Link to see all news */} 
        {!newsLoading && (
             <div className="text-center mt-8">
                 <Link to="/latest-news" className="text-indigo-600 hover:text-indigo-800 font-medium">
                     View All News →
                 </Link>
             </div>
        )}
      </section>

      {/* Whitepaper Sections (Homepage version - Links) */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-2">The Whitepaper</h2>
        <p className="text-gray-600 text-center mb-12">
          Explore our comprehensive analysis of microplastics, their impact on human health, and prevention strategies.
        </p>
        <div className="space-y-4">
          {chapterTitles.map((title, index) => {
            const anchorId = slugify(title); // Generate the ID (should be just the number)
            // Link to the whitepaper page, using only the chapter number as the hash
            return (
              <Link to={`/whitepaper#${anchorId}`} key={index} className="block no-underline">
                <WhitepaperSection 
                  title={title} // Display the full title
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage; 