import React, { useState, useEffect } from 'react';
import { Newspaper, FileText, DownloadCloud, Send, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// import WhitepaperSection from '../components/WhitepaperSection'; // Remove unused import
import axios from 'axios'; // <-- Add axios
import mascotImage from '../assets/mascot-elephant.png'; // <-- Import the image
import fallbackPlaceholderImage from '../assets/fail whale elephant_404 overload.png'; // Import the placeholder

// Updated NewsItem interface
interface NewsItem {
  id: string;
  created_at: string;
  url: string;
  title: string | null;
  source: string | null;
  published_date: string | null; 
  ai_summary: string | null;
  ai_image_url?: string | null; // Added for AI generated image URL
  // ai_category and manual_category_override REMOVED
}

// --- Add Backend URL --- 
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
// --- End Backend URL ---

// Helper for placeholder image
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x250?text=News+Image";

// --- NewsItemCard Component (Copied and adapted from LatestNewsPage.tsx) ---
interface NewsItemCardProps {
  item: NewsItem;
  isFeatured: boolean;
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({ item, isFeatured }) => {
  const imageUrl = item.ai_image_url || fallbackPlaceholderImage;
  const displayDate = item.published_date ? new Date(item.published_date) : new Date(item.created_at);
  const formattedDate = displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (isFeatured) {
    // Featured card styling for HomePage (matches existing structure)
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col md:flex-row overflow-hidden mb-12">
        <div className="md:w-2/5 flex-shrink-0">
          <img 
            src={imageUrl}
            alt={item.title || 'News image'}
            className="w-full h-64 md:h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }}
          />
        </div>
        <div className="p-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{formattedDate}</span>
            {item.source && <span className="text-xs text-gray-500">Source: {item.source}</span>}
          </div>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-2xl md:text-3xl font-bold text-brand-darker mb-4 hover:text-brand-blue transition-colors duration-150 no-underline">
            {item.title || 'No Title'}
          </a>
          <p className="text-brand-dark text-base mb-6 flex-grow">{item.ai_summary || 'Summary unavailable.'}</p>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-base no-underline mt-auto self-start transition-colors duration-150">
            Read Full Article →
          </a>
        </div>
      </div>
    );
  }

  // Secondary story card styling for HomePage (matches existing structure)
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden p-4 md:p-6 flow-root">
      <img
        src={imageUrl}
        alt={item.title || 'News image'}
        className="float-left w-32 h-32 md:w-36 md:h-36 object-cover mr-4 mb-2 rounded"
        onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }}
      />
      <div className="flex flex-wrap items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{formattedDate}</span>
        {item.source && <span className="text-xs text-gray-500 truncate max-w-[60%]">Source: {item.source}</span>}
      </div>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-brand-darker mb-2 hover:text-brand-blue transition-colors duration-150 no-underline leading-tight block">
        {item.title || 'No Title'}
      </a>
      <p className="text-brand-dark text-sm mb-4 break-words">{item.ai_summary || 'Summary unavailable.'}</p>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline block clear-left mt-2 transition-colors duration-150">
        Read Full Article →
      </a>
    </div>
  );
};
// --- End NewsItemCard Component ---

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  // --- State for Latest News --- 
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  // --- End State ---

  // --- State for Whitepaper Download ---
  const [whitepaperEmail, setWhitepaperEmail] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showDownloadLink, setShowDownloadLink] = useState(false);
  const whitepaperUrl = "/Microplastics - the Elephant in the Wellness Room.pdf";
  // --- End Whitepaper State ---

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/latest-news?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

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

  // --- Whitepaper Email Submission Handler ---
  const handleWhitepaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!whitepaperEmail || !/\S+@\S+\.\S+/.test(whitepaperEmail)) {
      setSubmissionError('Please enter a valid email address.');
      return;
    }

    setIsSubmittingEmail(true);
    try {
      const response = await axios.post<{ message?: string; error?: string }>(`${BACKEND_URL}/api/whitepaper-signup`, { email: whitepaperEmail });
      if (response.status === 200 || response.status === 201) {
        setShowDownloadLink(true);
        setWhitepaperEmail(''); // Clear email field
      } else {
        setSubmissionError(response.data.message || response.data.error || 'An unexpected error occurred.');
      }
    } catch (error: any) {
      console.error('Error submitting email for whitepaper:', error);
      if (error.response && error.response.data && (error.response.data.error || error.response.data.message) ) {
        setSubmissionError(error.response.data.error || error.response.data.message);
      } else if (error.message) {
        setSubmissionError(error.message);
      } else {
        setSubmissionError('Failed to submit email. Please try again.');
      }
    } finally {
      setIsSubmittingEmail(false);
    }
  };
  // --- End Whitepaper Email Submission Handler ---

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
                    {/* Search Bar Form */}
                    <div className="max-w-xl mx-auto lg:mx-0 mb-10">
                      <form onSubmit={handleSearchSubmit}>
                        <label htmlFor="home-search" className="sr-only">Search News</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="search"
                                id="home-search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search news by title, summary, or source..."
                                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full shadow-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-lg"
                            />
                        </div>
                      </form>
                    </div>
                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                      <Link 
                        to="/latest-news" 
                        className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-slate-300 bg-white text-brand-dark font-semibold text-lg shadow-sm hover:bg-gray-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-150 no-underline"
                      >
                        Browse All News
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
          
          <div className="max-w-xl mx-auto">
            <div className="float-left mr-4 mb-2 pt-1">
              <FileText size={64} className="text-green-600" />
            </div>
            <p className="text-lg text-brand-dark mb-4 text-left">
              Get your copy of "Microplastics - the Elephant in the Wellness Room" to dive deeper into the research, impacts, and potential solutions.
            </p>
          </div>
          <div style={{clear: 'both'}}></div> {/* Clear the float */} 

          <p className="text-md text-green-700 font-semibold mt-1 mb-6 max-w-xl mx-auto">
            Enter your email to get the download link.
          </p>
          
          {!showDownloadLink ? (
            <form onSubmit={handleWhitepaperSubmit} className="max-w-lg mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <input
                  type="email"
                  value={whitepaperEmail}
                  onChange={(e) => setWhitepaperEmail(e.target.value)}
                  placeholder="Enter your email address & press Enter"
                  required
                  className="flex-grow w-full px-4 py-3 rounded-full border-2 border-green-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm transition-colors duration-150"
                  disabled={isSubmittingEmail}
                />
              </div>
              {submissionError && (
                <p className="mt-3 text-sm text-red-600">{submissionError}</p>
              )}
              {isSubmittingEmail && (
                <p className="mt-3 text-sm text-gray-600 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-600 mr-2"></div>
                  Submitting...
                </p>
              )}
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4">
               <p className="text-green-700 font-semibold text-lg">Thank you! You can now download the whitepaper.</p>
              <a
                href={whitepaperUrl}
                download
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-green-600 text-white font-semibold text-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150 no-underline"
              >
                <DownloadCloud size={24} />
                Download PDF
              </a>
            </div>
          )}
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
              <NewsItemCard item={latestNews[0]} isFeatured={true} />
              
              {/* Secondary Stories */}
              {latestNews.length > 1 && ( // Check if there are secondary stories
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {latestNews.slice(1, 3).map((item) => (
                    <NewsItemCard key={item.id} item={item} isFeatured={false} />
                  ))}
                </div>
              )}
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